<?php

namespace App\Services\Intelimotor;

use App\Models\IntelimotorAccount;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class IntelimotorApiService
{
    public function testConnection(IntelimotorAccount $account): array
    {
        $response = $this->request($account, 'get', '/business-units');

        return $this->finalizeConnectionTest(
            $account,
            $response,
            'Conexión exitosa con Intelimotor (' . $account->name . ').'
        );
    }

    public function getInventoryUnits(array $query, IntelimotorAccount $account): array
    {
        $this->assertReady($account);

        $endpoint = $this->inventoryUnitsEndpoint($account);
        $response = $this->request($account, 'get', $endpoint, $this->buildPaginationQuery($query));

        return $this->formatResponse($response);
    }

    public function getUnit(string $unitId, IntelimotorAccount $account): array
    {
        $this->assertReady($account);

        $response = $this->request($account, 'get', '/units/' . rawurlencode($unitId));

        return $this->formatResponse($response);
    }

    public function createUnit(array $payload, IntelimotorAccount $account): array
    {
        $this->assertReady($account);

        if (empty($payload['businessUnitId']) && filled($account->business_unit_id)) {
            $payload['businessUnitId'] = $account->business_unit_id;
        }

        $response = $this->request($account, 'post', '/units', [], $payload);

        return $this->formatResponse($response);
    }

    public function patchUnit(string $unitId, array $payload, IntelimotorAccount $account): array
    {
        $this->assertReady($account);

        $response = $this->request(
            $account,
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
    public function fetchVisibleUnits(IntelimotorAccount $account, int $pageSize = 100): array
    {
        return $this->fetchAllUnits($account, $pageSize, ['isSold' => false]);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function fetchAllUnits(
        IntelimotorAccount $account,
        int $pageSize = 100,
        array $filters = []
    ): array {
        $this->assertReady($account);

        $endpoint = $this->inventoryUnitsEndpoint($account);
        $units = [];
        $pageNumber = 0;

        do {
            $response = $this->request($account, 'get', $endpoint, $this->buildPaginationQuery(array_merge([
                'pageNumber' => $pageNumber,
                'pageSize' => $pageSize,
            ], $filters)));

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

    private function inventoryUnitsEndpoint(IntelimotorAccount $account): string
    {
        return $account->business_unit_id
            ? '/business-units/' . $account->business_unit_id . '/units'
            : '/inventory-units';
    }

    private function assertReady(IntelimotorAccount $account): void
    {
        if (! $account->hasCredentials()) {
            throw new IntelimotorIntegrationException(
                'Configura API Key y API Secret en la cuenta «' . $account->name . '».',
                422
            );
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
            'isSold' => array_key_exists('isSold', $query)
                ? ($query['isSold'] ? 'true' : 'false')
                : (array_key_exists('is_sold', $query)
                    ? ($query['is_sold'] ? 'true' : 'false')
                    : null),
            'status' => $query['status'] ?? null,
            'visible' => array_key_exists('visible', $query)
                ? ($query['visible'] ? 'true' : 'false')
                : null,
        ], static fn ($value) => $value !== null && $value !== '');
    }

    private function request(
        IntelimotorAccount $account,
        string $method,
        string $path,
        array $query = [],
        ?array $body = null
    ): Response {
        if (! $account->hasCredentials()) {
            throw new IntelimotorIntegrationException('Configura API Key y API Secret antes de continuar.', 422);
        }

        $baseUrl = rtrim($account->base_url ?: config('services.intelimotor.base_url'), '/');
        $authQuery = [
            'apiKey' => $account->api_key,
            'apiSecret' => $account->api_secret,
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

    private function finalizeConnectionTest(IntelimotorAccount $account, Response $response, string $successMessage): array
    {
        $formatted = $this->formatResponse($response);

        $account->last_connection_at = now();
        $account->last_connection_status = $formatted['success'] ? 'success' : 'error';
        $account->last_connection_message = $formatted['success']
            ? $successMessage
            : ($formatted['error'] ?? 'No se pudo conectar con Intelimotor.');
        $account->save();

        if (! $formatted['success']) {
            throw new IntelimotorIntegrationException($account->last_connection_message, $formatted['status']);
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
