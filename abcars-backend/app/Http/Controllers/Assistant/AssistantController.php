<?php

namespace App\Http\Controllers\Assistant;

use App\Http\Controllers\Controller;
use App\Services\Assistant\AssistantToolsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AssistantController extends Controller
{
    public function __construct(
        private AssistantToolsService $toolsService
    ) {}

    /**
     * Consulta del asistente: usa ChatGPT con function calling para consultas dinámicas a la API/BD.
     */
    public function query(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        if (empty($apiKey)) {
            return response()->json([
                'response' => 'El asistente no está configurado. Falta OPENAI_API_KEY en .env',
                'data' => null,
            ], 503);
        }

        $userMessage = trim($validated['message']);
        $response = $this->callChatGPTWithTools($apiKey, $userMessage);

        return response()->json($response);
    }

    private function getToolsDefinitions(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'search_vehicles',
                    'description' => 'Busca vehículos en inventario por nombre, marca o palabra clave. Usar cuando pregunten por autos específicos, inventario, o listar vehículos.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'keyword' => ['type' => 'string', 'description' => 'Palabra clave, nombre o marca a buscar'],
                            'status' => ['type' => 'string', 'description' => 'Estado: active, inactive, sale, valuing'],
                            'limit' => ['type' => 'integer', 'description' => 'Máximo de resultados (default 20)'],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_vehicle_inventory_info',
                    'description' => 'Obtiene días en inventario de un vehículo específico (por nombre) o estadísticas generales (promedio, vehículos con más tiempo). Usar para preguntas como "cuántos días tiene X en inventario".',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'vehicle_name' => ['type' => 'string', 'description' => 'Nombre del vehículo si se pregunta por uno específico. Dejar vacío para estadísticas generales.'],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_users',
                    'description' => 'Obtiene conteo de usuarios. Total o filtrado por rol.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'role' => ['type' => 'string', 'description' => 'Rol específico: administrator, valuator, seller, etc. Opcional.'],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_valuations',
                    'description' => 'Obtiene conteo de valuaciones. Total, por estado, o filtrado por periodo (este_mes, este_año).',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'status' => ['type' => 'string', 'description' => 'Estado de valuación. Opcional.'],
                            'period' => ['type' => 'string', 'description' => 'Periodo: este_mes (del mes actual) o este_año. Opcional.'],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_dealerships',
                    'description' => 'Lista todas las sucursales/concesionarios con nombre, ubicación y descripción.',
                    'parameters' => ['type' => 'object', 'properties' => new \stdClass()],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_appointments',
                    'description' => 'Obtiene el total de citas agendadas.',
                    'parameters' => ['type' => 'object', 'properties' => new \stdClass()],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_general_stats',
                    'description' => 'Resumen general: usuarios, vehículos, sucursales, valuaciones, citas. SOLO cuando el usuario pida explícitamente un resumen completo o estadísticas de todo. No usar para preguntas específicas.',
                    'parameters' => ['type' => 'object', 'properties' => new \stdClass()],
                ],
            ],
        ];
    }

    private function callChatGPTWithTools(string $apiKey, string $userMessage): array
    {
        $systemPrompt = <<<PROMPT
Eres el asistente de datos del panel de administración de ABCars, un sistema de gestión de seminuevos.
Respondes en español de forma clara y concisa.

IMPORTANTE: Usa UNA SOLA herramienta por consulta. El usuario hace preguntas específicas:
- Si pregunta por valuaciones (total, este mes, por estado) → usa ÚNICAMENTE get_valuations
- Si pregunta por vehículos o inventario → usa ÚNICAMENTE search_vehicles o get_vehicle_inventory_info
- Si pregunta por usuarios o roles → usa ÚNICAMENTE get_users
- Si pregunta por sucursales/concesionarios → usa ÚNICAMENTE get_dealerships
- Si pregunta por citas → usa ÚNICAMENTE get_appointments
- Solo usa get_general_stats cuando el usuario pida explícitamente "resumen completo", "estadísticas generales" o "resumen de todo"

Responde solo con la información solicitada. No agregues datos extra que el usuario no pidió.
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userMessage],
        ];

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
                        'tools' => $this->getToolsDefinitions(),
                        'tool_choice' => 'auto',
                        'temperature' => 0.2,
                        'max_tokens' => 1000,
                    ]);

                if (!$response->successful()) {
                    $status = $response->status();
                    $body = $response->json() ?? [];
                    $errorMsg = $body['error']['message'] ?? $body['error']['code'] ?? $response->body();
                    $errorMsg = is_string($errorMsg) ? $errorMsg : json_encode($errorMsg);
                    Log::error('OpenAI API error', ['status' => $status, 'body' => $body]);

                    $userMsg = match (true) {
                        $status === 401 => 'API key de OpenAI inválida o expirada. Revisa OPENAI_API_KEY en .env',
                        $status === 429 => 'Límite de uso de OpenAI alcanzado. Intenta más tarde.',
                        default => config('app.debug') ? "Error OpenAI ({$status}): {$errorMsg}" : 'Error al conectar con el asistente. Intenta más tarde.',
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
                    return ['response' => 'No se pudo obtener respuesta.', 'data' => null];
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
            Log::error('Assistant ChatGPT error', ['message' => $e->getMessage()]);
            return [
                'response' => 'Error temporal del asistente. Intenta de nuevo.',
                'data' => null,
            ];
        }
    }

    /**
     * Extrae solo el data relevante para la pregunta. Evita dumps excesivos.
     * Si hubo múltiples tool calls, pasa null para que el texto del asistente sea suficiente.
     * Si hubo una sola herramienta, pasa su resultado.
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
