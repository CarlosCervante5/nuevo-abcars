<?php

namespace App\Services\Intelimotor;

use App\Models\IntelimotorSetting;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class IntelimotorApiService
{
    public function getSettings(): IntelimotorSetting
    {
        return IntelimotorSetting::current();
    }

    public function toPublicSettings(IntelimotorSetting $settings): array
    {
        return [
            'business_unit_id' => $settings->business_unit_id,
            'base_url' => $settings->base_url,
            'is_enabled' => $settings->is_enabled,
            'has_credentials' => $settings->hasCredentials(),
            'api_key_masked' => $settings->maskedApiKey(),
            'api_secret_masked' => $settings->maskedApiSecret(),
            'last_connection_at' => $settings->last_connection_at?->toIso8601String(),
            'last_connection_status' => $settings->last_connection_status,
            'last_connection_message' => $settings->last_connection_message,
            'last_sync_at' => $settings->last_sync_at?->toIso8601String(),
            'last_sync_summary' => $settings->last_sync_summary
                ? json_decode($settings->last_sync_summary, true)
                : null,
        ];
    }

    public function updateSettings(array $data): IntelimotorSetting
    {
        $settings = IntelimotorSetting::current();

        if (array_key_exists('api_key', $data) && filled($data['api_key'])) {
            $settings->api_key = $data['api_key'];
        }

        if (array_key_exists('api_secret', $data) && filled($data['api_secret'])) {
            $settings->api_secret = $data['api_secret'];
        }

        if (array_key_exists('business_unit_id', $data)) {
            $settings->business_unit_id = $data['business_unit_id'] ?: null;
        }

        if (array_key_exists('default_dealership_id', $data)) {
            $settings->default_dealership_id = $data['default_dealership_id'] ?: null;
        }

        if (array_key_exists('base_url', $data) && filled($data['base_url'])) {
            $settings->base_url = rtrim($data['base_url'], '/');
        }

        if (array_key_exists('is_enabled', $data)) {
            $settings->is_enabled = (bool) $data['is_enabled'];
        }

        if ($settings->hasCredentials() && ! array_key_exists('is_enabled', $data)) {
            $settings->is_enabled = true;
        }

        $settings->save();

        return $settings->fresh();
    }

    public function testConnection(?IntelimotorSetting $settings = null): array
    {
        $settings ??= IntelimotorSetting::current();
        $response = $this->request($settings, 'get', '/business-units');

        return $this->finalizeConnectionTest($settings, $response, 'Conexión exitosa con Intelimotor.');
    }

    public function getInventoryUnits(array $query = [], ?IntelimotorSetting $settings = null): array
    {
        $settings ??= IntelimotorSetting::current();
        $this->assertReady($settings);

        $endpoint = $settings->business_unit_id
            ? '/business-units/' . $settings->business_unit_id . '/units'
            : '/inventory-units';

        $response = $this->request($settings, 'get', $endpoint, $this->buildPaginationQuery($query));

        return $this->formatResponse($response);
    }

    public function getUnit(string $unitId, ?IntelimotorSetting $settings = null): array
    {
        $settings ??= IntelimotorSetting::current();
        $this->assertReady($settings);

        $response = $this->request($settings, 'get', '/units/' . rawurlencode($unitId));

        return $this->formatResponse($response);
    }

    public function createUnit(array $payload, ?IntelimotorSetting $settings = null): array
    {
        $settings ??= IntelimotorSetting::current();
        $this->assertReady($settings);

        if (empty($payload['businessUnitId']) && filled($settings->business_unit_id)) {
            $payload['businessUnitId'] = $settings->business_unit_id;
        }

        $response = $this->request($settings, 'post', '/units', [], $payload);

        return $this->formatResponse($response);
    }

    public function patchUnit(string $unitId, array $payload, ?IntelimotorSetting $settings = null): array
    {
        $settings ??= IntelimotorSetting::current();
        $this->assertReady($settings);

        $response = $this->request(
            $settings,
            'patch',
            '/units/' . rawurlencode($unitId),
            [],
            $payload
        );

        return $this->formatResponse($response);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAllUnits(?IntelimotorSetting $settings = null, int $pageSize = 100): array
    {
        $settings ??= IntelimotorSetting::current();
        $this->assertReady($settings);

        $endpoint = $settings->business_unit_id
            ? '/business-units/' . $settings->business_unit_id . '/units'
            : '/units';

        $units = [];
        $pageNumber = 0;

        do {
            $response = $this->request($settings, 'get', $endpoint, $this->buildPaginationQuery([
                'pageNumber' => $pageNumber,
                'pageSize' => $pageSize,
            ]));

            $result = $this->formatResponse($response);

            if (! $result['success']) {
                throw new IntelimotorIntegrationException(
                    $result['error'] ?? 'No se pudo obtener el inventario de Intelimotor.',
                    $result['status']
                );
            }

            $payload = $result['data'] ?? [];
            $pageUnits = is_array($payload['data'] ?? null) ? $payload['data'] : [];
            $units = array_merge($units, $pageUnits);

            $count = (int) ($payload['pagination']['count'] ?? count($pageUnits));
            $total = (int) ($payload['pagination']['total'] ?? count($units));
            $pageNumber++;

            if ($count === 0 || count($units) >= $total) {
                break;
            }
        } while ($pageNumber < 200);

        return $units;
    }

    private function assertReady(IntelimotorSetting $settings): void
    {
        if (! $settings->hasCredentials()) {
            throw new IntelimotorIntegrationException('Configura API Key y API Secret antes de usar la integración.', 422);
        }
    }

    private function buildPaginationQuery(array $query): array
    {
        return array_filter([
            'pageNumber' => $query['pageNumber'] ?? $query['page_number'] ?? 0,
            'pageSize' => $query['pageSize'] ?? $query['page_size'] ?? 25,
            'minListPrice' => $query['minListPrice'] ?? $query['min_list_price'] ?? null,
            'maxListPrice' => $query['maxListPrice'] ?? $query['max_list_price'] ?? null,
            'minYear' => $query['minYear'] ?? $query['min_year'] ?? null,
            'maxYear' => $query['maxYear'] ?? $query['max_year'] ?? null,
            'minKms' => $query['minKms'] ?? $query['min_kms'] ?? null,
            'maxKms' => $query['maxKms'] ?? $query['max_kms'] ?? null,
            'brand' => $query['brand'] ?? null,
            'state' => $query['state'] ?? null,
            'bodyType' => $query['bodyType'] ?? $query['body_type'] ?? null,
        ], static fn ($value) => $value !== null && $value !== '');
    }

    private function request(
        IntelimotorSetting $settings,
        string $method,
        string $path,
        array $query = [],
        ?array $body = null
    ): Response {
        if (! $settings->hasCredentials()) {
            throw new IntelimotorIntegrationException('Configura API Key y API Secret antes de continuar.', 422);
        }

        $baseUrl = rtrim($settings->base_url ?: config('services.intelimotor.base_url'), '/');
        $authQuery = [
            'apiKey' => $settings->api_key,
            'apiSecret' => $settings->api_secret,
        ];

        $client = Http::acceptJson()
            ->timeout((int) config('services.intelimotor.timeout', 30))
            ->withQueryParameters(array_merge($authQuery, $query));

        if ($body !== null) {
            return $client
                ->withHeaders(['Content-Type' => 'application/json'])
                ->{$method}($baseUrl . $path, $body);
        }

        return $client->{$method}($baseUrl . $path);
    }

    private function finalizeConnectionTest(IntelimotorSetting $settings, Response $response, string $successMessage): array
    {
        $formatted = $this->formatResponse($response);

        $settings->last_connection_at = now();
        $settings->last_connection_status = $formatted['success'] ? 'success' : 'error';
        $settings->last_connection_message = $formatted['success']
            ? $successMessage
            : ($formatted['error'] ?? 'No se pudo conectar con Intelimotor.');
        $settings->save();

        if (! $formatted['success']) {
            throw new IntelimotorIntegrationException($settings->last_connection_message, $formatted['status']);
        }

        return $formatted;
    }

    private function formatResponse(Response $response): array
    {
        $json = $response->json();
        $error = null;

        if (is_array($json) && isset($json['error'])) {
            $error = is_string($json['error']) ? $json['error'] : json_encode($json['error']);
        }

        if (! $response->successful()) {
            $error ??= $response->body() ?: 'Error desconocido al consultar Intelimotor.';
        }

        return [
            'success' => $response->successful(),
            'status' => $response->status(),
            'data' => $json,
            'error' => $error,
        ];
    }
}
