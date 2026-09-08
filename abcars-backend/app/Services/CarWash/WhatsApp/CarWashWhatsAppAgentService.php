<?php

namespace App\Services\CarWash\WhatsApp;

use App\Models\CarWash\CarWashWhatsAppConversation;
use App\Models\CarWash\CarWashWhatsAppMessage;
use App\Services\CarWash\CarWashAssistantToolsService;
use App\Services\CarWash\CarWashSettingsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CarWashWhatsAppAgentService
{
    public function __construct(
        private CarWashAssistantToolsService $tools,
        private CarWashSettingsService $settings,
    ) {}

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     */
    public function reply(string $userMessage, array $history, string $callerPhone): string
    {
        $this->settings->applyRuntime();

        if (! config('carwash.agent.enabled', true)) {
            return 'Gracias por escribir a ABCars CarWash. Un asesor te atenderá pronto.';
        }

        $apiKey = $this->resolveOpenAiKey();
        if ($apiKey === '') {
            Log::warning('CarWash WhatsApp: OPENAI_API_KEY ausente');

            return $this->fallbackReply($userMessage, $callerPhone)
                ?? 'El asistente IA no está configurado (falta OPENAI_API_KEY). Un asesor te puede ayudar pronto.';
        }

        $todayMx = now('America/Mexico_City')->format('Y-m-d');
        $tomorrowMx = now('America/Mexico_City')->addDay()->format('Y-m-d');
        $nowMx = now('America/Mexico_City')->format('H:i');

        $system = <<<PROMPT
Eres el asistente de WhatsApp de ABCars CarWash. Atiendes citas de lavado de autos como un asesor amable y conversacional (no como un formulario).

FECHA/HORA ACTUAL (America/Mexico_City): hoy={$todayMx} hora={$nowMx}; mañana={$tomorrowMx}.

Puedes: consultar servicios/sedes, revisar ocupación, agendar, consultar estatus y cancelar citas, consultar cuponera/sellos, o escalar a humano.
Responde SIEMPRE en español, mensajes cortos de WhatsApp (1–4 líneas). Sin markdown pesado ni listas enormes.

ESTILO CONVERSACIONAL (muy importante):
1. Pide INFORMACIÓN POR PARTES: una pregunta a la vez. No pidas nombre+servicio+sede+hora+placas en el mismo mensaje.
2. Orden sugerido al agendar: (a) qué necesita el auto / tipo de lavado → (b) sede → (c) día/hora → (d) nombre → (e) placas → (f) resumen y confirmación → (g) crear cita.
3. Si el cliente ya dio varios datos juntos, úsalos y pregunta solo lo que falte.
4. SERVICIOS: no sueltes un catálogo numerado completo. Usa carwash_list_services y ofrece 2–3 opciones en tono de asesor, p. ej. “¿Buscas algo rápido de exterior, o también aspirado/interior? El más pedido es X (\$.\.\.). También tenemos Y…”. Si pide “ver todos”, entonces sí muestra el resto breve.
5. HORARIOS: ofrece 2–4 slots concretos (no una lista interminable). Pregunta “¿te late alguno de estos?”.
6. SEDES: si hay pocas, puedes nombrarlas en una frase; si hay varias, pregunta por zona o ofrece la principal primero.
7. Tras reunir datos, haz UN resumen corto y pregunta “¿Confirmamos?”. Solo entonces llama carwash_create_appointment.

REGLAS DE AGENDAR (críticas):
1. Para crear una cita DEBES llamar carwash_create_appointment.
2. NUNCA digas que la cita “quedó agendada” / “con éxito” si la tool no devolvió ok:true y un uuid.
3. Si la tool responde ok:false o error, explica el problema y pide el dato faltante. No inventes confirmación.
4. Si ok:true, confirma con: uuid, fecha/hora exacta (scheduled_local o scheduled_start_at), servicio, sede, placas y precio de la respuesta de la tool.
5. Para scheduled_start_at usa SIEMPRE YYYY-MM-DD HH:MM con las fechas de arriba. Si el cliente dice “hoy” usa {$todayMx}. Si dice “mañana” usa {$tomorrowMx}. Nunca inventes otra fecha cuando pidieron hoy/mañana.
6. Usa service_code / service_type_uuid y location_uuid de las tools (no inventes UUIDs).
7. En carwash_get_availability: lee available_slots. Si available_count > 0, SÍ hay cupo. booked_slots/slots vacíos = día libre.
8. Si preguntan por sellos/cuponera: carwash_get_loyalty_stamps y muestra punch_card/message tal cual.

El teléfono del cliente en este chat es: {$callerPhone}. Úsalo si no lo proporciona.
Si piden autos seminuevos / inventario ABCars, indica amablemente que este canal es solo CarWash.
Si el cliente escribe 0 / iniciar / reiniciar, el sistema ya reinicia el flujo; no hace falta tool.
En mensajes de ayuda puedes recordar: “Escribe 0 o iniciar para reiniciar”.
PROMPT;

        $messages = [['role' => 'system', 'content' => $system]];
        foreach ($history as $h) {
            if (! empty($h['role']) && isset($h['content'])) {
                $content = trim((string) $h['content']);
                if ($content === '') {
                    continue;
                }
                // Evitar contaminar el contexto con fallos previos del bot
                if (($h['role'] ?? '') === 'assistant' && $this->isFailurePlaceholder($content)) {
                    continue;
                }
                $messages[] = ['role' => $h['role'], 'content' => $content];
            }
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $model = trim((string) config('carwash.agent.model', 'gpt-4o-mini')) ?: 'gpt-4o-mini';
        $maxIterations = 5;

        try {
            for ($i = 0; $i < $maxIterations; $i++) {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer '.$apiKey,
                    'Content-Type' => 'application/json',
                ])
                    ->timeout(45)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => $model,
                        'messages' => $messages,
                        'tools' => $this->tools->getToolsDefinitions(),
                        'tool_choice' => 'auto',
                        'temperature' => 0.45,
                        'max_tokens' => 550,
                    ]);

                if (! $response->successful()) {
                    $status = $response->status();
                    $body = $response->json() ?? $response->body();
                    Log::error('CarWash WhatsApp OpenAI error', [
                        'status' => $status,
                        'model' => $model,
                        'body' => $body,
                    ]);

                    $fallback = $this->fallbackReply($userMessage, $callerPhone);
                    if ($fallback !== null) {
                        return $fallback;
                    }

                    return $this->openaiErrorMessage($status);
                }

                $message = $response->json('choices.0.message') ?? null;
                if (! $message) {
                    return $this->fallbackReply($userMessage, $callerPhone)
                        ?? 'No pude generar respuesta. Intenta de nuevo.';
                }

                $toolCalls = $message['tool_calls'] ?? [];
                $assistantMsg = ['role' => 'assistant'];
                $content = $message['content'] ?? null;
                if (is_string($content) && trim($content) !== '') {
                    $assistantMsg['content'] = $content;
                } elseif (! empty($toolCalls)) {
                    $assistantMsg['content'] = null;
                } else {
                    $assistantMsg['content'] = '';
                }
                if (! empty($toolCalls)) {
                    $assistantMsg['tool_calls'] = $toolCalls;
                }
                $messages[] = $assistantMsg;

                if (empty($toolCalls)) {
                    $text = trim((string) ($message['content'] ?? ''));

                    return $text !== '' ? $text : '¿En qué más te puedo ayudar con tu lavado?';
                }

                foreach ($toolCalls as $tc) {
                    $id = $tc['id'] ?? uniqid('tool_', true);
                    $name = $tc['function']['name'] ?? '';
                    $args = json_decode($tc['function']['arguments'] ?? '{}', true) ?? [];
                    $result = $this->tools->execute($name, $args, $callerPhone);
                    if ($name === 'carwash_create_appointment' && empty($result['ok'])) {
                        $result['assistant_instruction'] = 'La cita NO se creó. No confirmes agendado. Explica el error al cliente.';
                    }
                    $messages[] = [
                        'role' => 'tool',
                        'tool_call_id' => $id,
                        'content' => json_encode($result, JSON_UNESCAPED_UNICODE),
                    ];
                }
            }

            return 'Se me complicó un poco. ¿Puedes reformular tu solicitud?';
        } catch (\Throwable $e) {
            Log::error('CarWash WhatsApp agent exception', ['message' => $e->getMessage()]);

            return $this->fallbackReply($userMessage, $callerPhone)
                ?? 'Error temporal del asistente. Un asesor te puede ayudar pronto.';
        }
    }

    /**
     * @return array<int, array{role: string, content: string}>
     */
    public function historyFromConversation(CarWashWhatsAppConversation $conversation): array
    {
        $limit = max(2, (int) config('carwash.agent.history_limit', 12));
        $query = CarWashWhatsAppMessage::query()
            ->where('conversation_id', $conversation->id);

        $resetAt = $conversation->meta['context_reset_at'] ?? null;
        if (is_string($resetAt) && trim($resetAt) !== '') {
            try {
                $query->where('created_at', '>=', \Carbon\Carbon::parse($resetAt));
            } catch (\Throwable) {
                // si el meta está mal, no filtrar
            }
        }

        $rows = $query
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        $history = [];
        foreach ($rows as $row) {
            $body = trim((string) $row->body);
            if ($body === '') {
                continue;
            }
            // No contaminar el historial del agente con comandos de reinicio
            if ($row->direction === 'inbound' && $this->isHistoryNoise($body)) {
                continue;
            }
            $history[] = [
                'role' => $row->direction === 'inbound' ? 'user' : 'assistant',
                'content' => $body,
            ];
        }

        return $history;
    }

    private function isHistoryNoise(string $body): bool
    {
        $normalized = mb_strtolower(trim($body));
        $normalized = trim($normalized, " \t\n\r\0\x0B.!¡?¿*\"'");

        return $normalized === '0'
            || (bool) preg_match('/^(iniciar|inciar|reiniciar|reset|menu|menú|inicio|empezar|comenzar)$/u', $normalized);
    }

    private function resolveOpenAiKey(): string
    {
        $candidates = [
            config('carwash.agent.openai_api_key'),
            config('services.openai.key'),
            env('OPENAI_API_KEY'),
        ];

        foreach ($candidates as $key) {
            $key = trim((string) ($key ?? ''));
            if ($key !== '' && ! str_starts_with($key, '••••')) {
                return $key;
            }
        }

        return '';
    }

    private function openaiErrorMessage(int $status): string
    {
        return match (true) {
            $status === 401, $status === 403 => 'El asistente no puede autenticarse con OpenAI. Revisa OPENAI_API_KEY en Settings o en el servidor.',
            $status === 429 => 'El asistente está saturado por límite de OpenAI. Intenta en un minuto.',
            $status >= 500 => 'OpenAI no respondió bien. ¿Puedes intentar de nuevo en un momento?',
            default => 'Tuve un problema temporal con el asistente. ¿Puedes intentar de nuevo en un momento?',
        };
    }

    private function isFailurePlaceholder(string $content): bool
    {
        $needles = [
            'problema temporal',
            'OPENAI_API_KEY',
            'asistente no está disponible',
            'Error temporal del asistente',
            'no puede autenticarse con OpenAI',
        ];
        $lower = mb_strtolower($content);
        foreach ($needles as $n) {
            if (str_contains($lower, mb_strtolower($n))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Respuesta determinística cuando OpenAI falla (agendar / servicios / sedes).
     */
    private function fallbackReply(string $userMessage, string $callerPhone): ?string
    {
        $text = mb_strtolower(trim($userMessage));
        if ($text === '') {
            return null;
        }

        $wantsLoyalty = (bool) preg_match('/\b(sello|sellos|cuponera|lealtad|loyalty|puntos|recompensa|premio)\b/u', $text);
        if ($wantsLoyalty) {
            $loyalty = $this->tools->execute('carwash_get_loyalty_stamps', [], $callerPhone);
            if (! empty($loyalty['message'])) {
                return (string) $loyalty['message'];
            }
            if (! empty($loyalty['error'])) {
                return (string) $loyalty['error'];
            }
        }

        $wantsSchedule = (bool) preg_match('/\b(agendar|cita|reservar|horario|disponib|lavar|lavado)\b/u', $text);
        $wantsServices = (bool) preg_match('/\b(servicio|paquete|precio|cu[aá]nto|lista)\b/u', $text);
        $wantsLocations = (bool) preg_match('/\b(sede|sucursal|ubicaci[oó]n|d[oó]nde)\b/u', $text);

        if (! $wantsSchedule && ! $wantsServices && ! $wantsLocations) {
            if (preg_match('/\b(hola|buenas|buen d[ií]a|info|informaci[oó]n)\b/u', $text)) {
                return "¡Hola! Soy el asistente de ABCars CarWash 👋\n¿Quieres *agendar un lavado* o consultar tus *sellos* de la cuponera?";
            }

            return null;
        }

        // Flujo conversacional por partes (sin volcar catálogo completo)
        if ($wantsSchedule && ! $wantsServices && ! $wantsLocations) {
            return "¡Claro! Te ayudo a agendar.\n¿Qué necesitas hoy: algo *rápido de exterior*, o también *aspirado/interior*?";
        }

        if ($wantsServices || ($wantsSchedule && $wantsServices)) {
            $services = $this->tools->execute('carwash_list_services', [], $callerPhone);
            $suggestions = $services['top_suggestions'] ?? [];
            if (is_array($suggestions) && count($suggestions) > 0) {
                $lines = ['Te sugiero estas opciones:'];
                foreach (array_slice($suggestions, 0, 3) as $s) {
                    $pitch = is_array($s) ? ($s['pitch'] ?? ($s['name'] ?? '')) : (string) $s;
                    if ($pitch !== '') {
                        $lines[] = '• '.$pitch;
                    }
                }
                $lines[] = '';
                $lines[] = '¿Cuál te late, o prefieres que te explique la diferencia?';

                return implode("\n", $lines);
            }
        }

        if ($wantsLocations) {
            $locations = $this->tools->execute('carwash_list_locations', [], $callerPhone);
            $items = $locations['locations'] ?? [];
            $names = [];
            if (is_iterable($items)) {
                foreach ($items as $loc) {
                    $names[] = is_array($loc) ? ($loc['name'] ?? '') : ($loc->name ?? '');
                }
            }
            $names = array_values(array_filter($names));
            if (count($names) === 1) {
                return "Atendemos en *{$names[0]}*. ¿Te queda bien esa sede?";
            }
            if (count($names) > 1) {
                return 'Tenemos: '.implode(' y ', array_slice($names, 0, 3)).".\n¿Cuál te queda más cerca?";
            }
        }

        return "Perfecto. Empecemos: ¿buscas un lavado *rápido* o uno más *completo* (aspirado/interior)?";
    }
}
