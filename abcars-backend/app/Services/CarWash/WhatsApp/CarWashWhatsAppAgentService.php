<?php

namespace App\Services\CarWash\WhatsApp;

use App\Models\CarWash\CarWashWhatsAppConversation;
use App\Models\CarWash\CarWashWhatsAppMessage;
use App\Services\CarWash\CarWashAssistantToolsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CarWashWhatsAppAgentService
{
    public function __construct(private CarWashAssistantToolsService $tools) {}

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     */
    public function reply(string $userMessage, array $history, string $callerPhone): string
    {
        if (! config('carwash.agent.enabled', true)) {
            return 'Gracias por escribir a ABCars CarWash. Un asesor te atenderá pronto.';
        }

        $apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        if (empty($apiKey)) {
            return 'El asistente no está disponible en este momento. Intenta más tarde o espera a un asesor.';
        }

        $system = <<<PROMPT
Eres el asistente de WhatsApp de ABCars CarWash. Atiendes citas de lavado de autos.

Puedes: listar servicios/sedes, revisar ocupación, agendar, consultar estatus y cancelar citas, o escalar a humano.
Responde SIEMPRE en español, breve y claro (mensajes de WhatsApp, sin markdown pesado).
No inventes precios ni horarios: usa las tools.
Confirma datos (nombre, servicio, sede, fecha/hora, placas) antes de crear una cita.
El teléfono del cliente en este chat es: {$callerPhone}. Úsalo si no lo proporciona.
Si piden autos seminuevos / inventario ABCars, indica amablemente que este canal es solo CarWash.
PROMPT;

        $messages = [['role' => 'system', 'content' => $system]];
        foreach ($history as $h) {
            if (! empty($h['role']) && isset($h['content'])) {
                $messages[] = ['role' => $h['role'], 'content' => (string) $h['content']];
            }
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $model = (string) config('carwash.agent.model', 'gpt-4o-mini');
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
                    Log::error('CarWash WhatsApp OpenAI error', ['status' => $response->status(), 'body' => $response->json()]);

                    return 'Tuve un problema temporal. ¿Puedes intentar de nuevo en un momento?';
                }

                $message = $response->json('choices.0.message') ?? null;
                if (! $message) {
                    return 'No pude generar respuesta. Intenta de nuevo.';
                }

                $messages[] = [
                    'role' => 'assistant',
                    'content' => $message['content'] ?? null,
                    'tool_calls' => $message['tool_calls'] ?? null,
                ];

                $toolCalls = $message['tool_calls'] ?? [];
                if (empty($toolCalls)) {
                    $content = trim((string) ($message['content'] ?? ''));

                    return $content !== '' ? $content : '¿En qué más te puedo ayudar con tu lavado?';
                }

                foreach ($toolCalls as $tc) {
                    $id = $tc['id'] ?? uniqid('tool_', true);
                    $name = $tc['function']['name'] ?? '';
                    $args = json_decode($tc['function']['arguments'] ?? '{}', true) ?? [];
                    $result = $this->tools->execute($name, $args, $callerPhone);
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

            return 'Error temporal del asistente. Un asesor te puede ayudar pronto.';
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
}
