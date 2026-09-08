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

        $system = <<<PROMPT
Eres el asistente de WhatsApp de ABCars CarWash. Atiendes citas de lavado de autos.

Puedes: listar servicios/sedes, revisar ocupación, agendar, consultar estatus y cancelar citas, o escalar a humano.
Responde SIEMPRE en español, breve y claro (mensajes de WhatsApp, sin markdown pesado).
No inventes precios ni horarios: usa las tools.

REGLAS DE AGENDAR (críticas):
1. Para crear una cita DEBES llamar carwash_create_appointment.
2. NUNCA digas que la cita "quedó agendada" / "con éxito" si la tool no devolvió ok:true y un uuid.
3. Si la tool responde ok:false o error, explica el problema y pide el dato faltante. No inventes confirmación.
4. Si ok:true, confirma con: uuid, fecha/hora exacta (scheduled_local o scheduled_start_at), servicio, sede, placas y precio de la respuesta de la tool.
5. Para scheduled_start_at preferí YYYY-MM-DD HH:MM en zona America/Mexico_City. También puedes usar "mañana 14:00".
6. Usa service_code / service_type_uuid y location_uuid que salgan de las tools (no inventes UUIDs).
7. En carwash_get_availability: lee available_slots. Si available_count > 0, SÍ hay cupo. booked_slots/slots vacíos = día libre (todo disponible), NO digas que no hay horarios.

Confirma datos (nombre, servicio, sede, fecha/hora, placas) antes de crear una cita.
El teléfono del cliente en este chat es: {$callerPhone}. Úsalo si no lo proporciona.
Si piden autos seminuevos / inventario ABCars, indica amablemente que este canal es solo CarWash.
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
                        'temperature' => 0.3,
                        'max_tokens' => 700,
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
        $rows = CarWashWhatsAppMessage::query()
            ->where('conversation_id', $conversation->id)
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
            $history[] = [
                'role' => $row->direction === 'inbound' ? 'user' : 'assistant',
                'content' => $body,
            ];
        }

        return $history;
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

        $wantsSchedule = (bool) preg_match('/\b(agendar|cita|reservar|horario|disponib|lavar|lavado)\b/u', $text);
        $wantsServices = (bool) preg_match('/\b(servicio|paquete|precio|cu[aá]nto|lista)\b/u', $text);
        $wantsLocations = (bool) preg_match('/\b(sede|sucursal|ubicaci[oó]n|d[oó]nde)\b/u', $text);

        if (! $wantsSchedule && ! $wantsServices && ! $wantsLocations) {
            if (preg_match('/\b(hola|buenas|buen d[ií]a|info|informaci[oó]n)\b/u', $text)) {
                return "¡Hola! Soy el asistente de ABCars CarWash.\nPuedo ayudarte a agendar un lavado. Escribe *agendar* o dime qué servicio necesitas.";
            }

            return null;
        }

        $lines = ['¡Claro! Te ayudo con ABCars CarWash.'];

        if ($wantsServices || $wantsSchedule) {
            $services = $this->tools->execute('carwash_list_services', [], $callerPhone);
            $items = $services['services'] ?? [];
            if (is_iterable($items) && count($items) > 0) {
                $lines[] = '';
                $lines[] = '*Servicios:*';
                $i = 1;
                foreach ($items as $s) {
                    $name = is_array($s) ? ($s['name'] ?? '') : ($s->name ?? '');
                    $code = is_array($s) ? ($s['code'] ?? '') : ($s->code ?? '');
                    $price = is_array($s) ? ($s['price'] ?? '') : ($s->price ?? '');
                    $mins = is_array($s) ? ($s['duration_minutes'] ?? '') : ($s->duration_minutes ?? '');
                    $priceFmt = is_numeric($price) ? '$'.number_format((float) $price, 0) : (string) $price;
                    $lines[] = "{$i}. {$name} ({$code}) — {$priceFmt} · {$mins} min";
                    $i++;
                    if ($i > 12) {
                        break;
                    }
                }
            }
        }

        if ($wantsLocations || $wantsSchedule) {
            $locations = $this->tools->execute('carwash_list_locations', [], $callerPhone);
            $items = $locations['locations'] ?? [];
            if (is_iterable($items) && count($items) > 0) {
                $lines[] = '';
                $lines[] = '*Sedes:*';
                $i = 1;
                foreach ($items as $loc) {
                    $name = is_array($loc) ? ($loc['name'] ?? '') : ($loc->name ?? '');
                    $addr = is_array($loc) ? ($loc['address'] ?? '') : ($loc->address ?? '');
                    $lines[] = $addr !== '' && $addr !== null
                        ? "{$i}. {$name} — {$addr}"
                        : "{$i}. {$name}";
                    $i++;
                }
            }
        }

        if ($wantsSchedule) {
            $locations = $this->tools->execute('carwash_list_locations', [], $callerPhone);
            $firstLoc = null;
            $locItems = $locations['locations'] ?? [];
            if (is_iterable($locItems)) {
                foreach ($locItems as $loc) {
                    $firstLoc = is_array($loc) ? ($loc['uuid'] ?? null) : ($loc->uuid ?? null);
                    break;
                }
            }
            if ($firstLoc) {
                $avail = $this->tools->execute('carwash_get_availability', [
                    'location_uuid' => (string) $firstLoc,
                    'date' => 'hoy',
                ], $callerPhone);
                $free = $avail['available_slots'] ?? [];
                if (is_array($free) && count($free) > 0) {
                    $lines[] = '';
                    $lines[] = '*Horarios libres hoy:* '.implode(', ', array_slice($free, 0, 8));
                } elseif (! empty($avail['message'])) {
                    $lines[] = '';
                    $lines[] = (string) $avail['message'];
                }
            }

            $lines[] = '';
            $lines[] = 'Para agendar necesito: *nombre*, *servicio* (código o nombre), *sede*, *fecha y hora*, y *placas*.';
            $lines[] = 'Ejemplo: Juan Pérez, lavado-aspirado-secado, mañana 10:00, ABC123.';
        }

        return implode("\n", $lines);
    }
}
