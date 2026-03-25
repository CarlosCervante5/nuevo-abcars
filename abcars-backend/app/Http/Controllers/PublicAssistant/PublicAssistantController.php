<?php

namespace App\Http\Controllers\PublicAssistant;

use App\Http\Controllers\Controller;
use App\Services\PublicAssistant\PublicAssistantToolsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PublicAssistantController extends Controller
{
    public function __construct(
        private PublicAssistantToolsService $toolsService
    ) {}

    /**
     * Consulta del asistente público: usa ChatGPT con function calling para consultas de inventario y citas.
     */
    public function query(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
            'conversation_history' => 'nullable|array|max:20',
            'conversation_history.*.role' => 'required_with:conversation_history|string|in:user,assistant',
            'conversation_history.*.content' => 'required_with:conversation_history|string|max:1000',
        ]);

        $apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        if (empty($apiKey)) {
            return response()->json([
                'response' => 'El asistente no está disponible en este momento.',
                'data' => null,
            ], 503);
        }

        $userMessage = trim($validated['message']);
        $conversationHistory = $validated['conversation_history'] ?? [];

        Log::info('Public assistant query', ['ip' => $request->ip(), 'message' => $userMessage]);

        $response = $this->callChatGPTWithTools($apiKey, $userMessage, $conversationHistory);

        return response()->json($response);
    }

    private function callChatGPTWithTools(string $apiKey, string $userMessage, array $conversationHistory): array
    {
        $systemPrompt = <<<PROMPT
Eres el asistente virtual de ABCars, una agencia de autos. Ayudas a los visitantes del sitio web con información sobre vehículos disponibles y gestión de citas.

CAPACIDADES (solo puedes hacer esto):
- Buscar vehículos disponibles en el inventario público
- Mostrar detalles de un vehículo específico
- Agendar citas para visitar una sucursal
- Confirmar citas existentes
- Consultar el estado de una cita

RESTRICCIONES:
- NO tienes acceso a datos internos, usuarios, valuaciones, estadísticas ni información administrativa
- Si te preguntan algo fuera de tu ámbito, responde amablemente que solo puedes ayudar con información de vehículos disponibles y gestión de citas
- Responde SIEMPRE en español, de forma clara, amigable y concisa

FORMATO DE RESPUESTA PARA VEHÍCULOS:
Cuando muestres vehículos, usa EXACTAMENTE este formato markdown para cada uno:

**[Nombre del vehículo](URL_VEHICULO)**
📅 Año: [año] | 🛣️ [km] | 💰 [precio]
⛽ [combustible] | ⚙️ [transmisión] | 🎨 [color]
📍 [sucursal]
![imagen](URL_IMAGEN)

- La URL del vehículo es: {FRONTEND_URL}/vehiculo/[uuid]
- Siempre incluye la imagen si está disponible
- Siempre incluye el link al detalle del vehículo
- Para agendar citas, recopila: nombre, teléfono (10 dígitos), email, sucursal y fecha/hora preferida
PROMPT;

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));
        $systemPrompt = str_replace('{FRONTEND_URL}', $frontendUrl, $systemPrompt);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Add conversation history
        foreach ($conversationHistory as $historyMessage) {
            $messages[] = [
                'role' => $historyMessage['role'],
                'content' => $historyMessage['content'],
            ];
        }

        // Add current user message
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $maxIterations = 5;
        $iterations = 0;

        try {
            while ($iterations < $maxIterations) {
                $iterations++;

                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])
                    ->timeout(45)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => 'gpt-4o-mini',
                        'messages' => $messages,
                        'tools' => $this->toolsService->getToolsDefinitions(),
                        'tool_choice' => 'auto',
                        'temperature' => 0.3,
                        'max_tokens' => 1000,
                    ]);

                if (!$response->successful()) {
                    $status = $response->status();
                    $body = $response->json() ?? [];
                    $errorMsg = $body['error']['message'] ?? $body['error']['code'] ?? $response->body();
                    $errorMsg = is_string($errorMsg) ? $errorMsg : json_encode($errorMsg);
                    Log::error('Public assistant OpenAI API error', ['status' => $status, 'body' => $body]);

                    $userMsg = match (true) {
                        $status === 401 => 'Error temporal del asistente. Intenta de nuevo.',
                        $status === 429 => 'El asistente está ocupado. Intenta en unos momentos.',
                        default => 'Error temporal del asistente. Intenta de nuevo.',
                    };

                    return [
                        'response' => $userMsg,
                        'data' => null,
                    ];
                }

                $body = $response->json();
                $choice = $body['choices'][0] ?? null;
                $message = $choice['message'] ?? null;

                if (!$message) {
                    return ['response' => 'No se pudo obtener respuesta. Intenta de nuevo.', 'data' => null];
                }

                $messages[] = [
                    'role' => 'assistant',
                    'content' => $message['content'] ?? null,
                    'tool_calls' => $message['tool_calls'] ?? null,
                ];

                $toolCalls = $message['tool_calls'] ?? [];
                if (empty($toolCalls)) {
                    $content = trim($message['content'] ?? '');
                    $data = $this->extractRelevantData($messages, $userMessage);
                    return ['response' => $content ?: 'No tengo información para esa consulta.', 'data' => $data];
                }

                foreach ($toolCalls as $tc) {
                    $id = $tc['id'];
                    $name = $tc['function']['name'] ?? '';
                    $args = json_decode($tc['function']['arguments'] ?? '{}', true) ?? [];

                    $result = $this->toolsService->execute($name, $args);
                    $messages[] = [
                        'role' => 'tool',
                        'tool_call_id' => $id,
                        'content' => json_encode($result, JSON_UNESCAPED_UNICODE),
                    ];
                }
            }

            return [
                'response' => 'Se alcanzó el límite de consultas. Intenta con una pregunta más específica.',
                'data' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('Public assistant ChatGPT error', ['message' => $e->getMessage()]);
            return [
                'response' => 'Error temporal del asistente. Intenta de nuevo.',
                'data' => null,
            ];
        }
    }

    /**
     * Extrae solo el data relevante para la pregunta.
     * Si hubo una sola herramienta, pasa su resultado. Si hubo múltiples, retorna null.
     */
    private function extractRelevantData(array $messages, string $userMessage): ?array
    {
        $toolResults = [];
        foreach ($messages as $m) {
            if (($m['role'] ?? '') === 'tool' && !empty($m['content'])) {
                $decoded = json_decode($m['content'], true);
                if (is_array($decoded)) {
                    $toolResults[] = $decoded;
                }
            }
        }

        if (empty($toolResults)) {
            return null;
        }
        if (count($toolResults) > 1) {
            return null;
        }

        return $toolResults[0];
    }
}
