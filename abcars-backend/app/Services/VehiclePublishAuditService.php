<?php

namespace App\Services;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleUpdate;
use Illuminate\Support\Carbon;

/**
 * Auditoría de cambios de page_status (publicación / baja de inventario).
 * Registros en vehicle_updates con api_name prefijo INVENTORY:
 */
class VehiclePublishAuditService
{
    public const API_PREFIX = 'INVENTORY:';

    public function logPageStatusChange(
        Vehicle $vehicle,
        ?string $fromStatus,
        string $toStatus,
        string $source,
        ?int $userId = null,
        array $meta = [],
    ): void {
        $from = $fromStatus !== null ? strtolower(trim($fromStatus)) : null;
        $to = strtolower(trim($toStatus));

        if ($from === $to) {
            return;
        }

        VehicleUpdate::create([
            'api_name' => self::API_PREFIX . $source,
            'replaced_json' => json_encode([
                'page_status' => $from,
                'vehicle_uuid' => $vehicle->uuid,
                'vin' => $vehicle->vin,
                'vehicle_name' => $vehicle->name,
            ], JSON_UNESCAPED_UNICODE),
            'request_json' => json_encode(array_merge([
                'page_status' => $to,
                'source' => $source,
                'vehicle_uuid' => $vehicle->uuid,
                'vin' => $vehicle->vin,
            ], $meta), JSON_UNESCAPED_UNICODE),
            'user_id' => $userId,
            'vehicle_id' => $vehicle->id,
        ]);
    }

    /**
     * @return array{data: array<int, array<string, mixed>>, filters: array<string, mixed>}
     */
    public function listPublishLog(array $filters): array
    {
        $updatesTable = (new VehicleUpdate)->getTable();
        $usersTable = (new User)->getTable();
        $vehiclesTable = (new Vehicle)->getTable();

        $query = VehicleUpdate::query()
            ->where($updatesTable . '.api_name', 'like', self::API_PREFIX . '%')
            ->whereBetween($updatesTable . '.created_at', [
                $filters['start_date'],
                $filters['end_date'],
            ])
            ->leftJoin($usersTable, $usersTable . '.id', '=', $updatesTable . '.user_id')
            ->leftJoin($vehiclesTable, $vehiclesTable . '.id', '=', $updatesTable . '.vehicle_id')
            ->select([
                $updatesTable . '.id',
                $updatesTable . '.api_name',
                $updatesTable . '.replaced_json',
                $updatesTable . '.request_json',
                $updatesTable . '.created_at',
                $updatesTable . '.vehicle_id',
                $usersTable . '.email as user_email',
                $vehiclesTable . '.uuid as vehicle_uuid',
                $vehiclesTable . '.vin',
                $vehiclesTable . '.name as vehicle_name',
            ])
            ->orderByDesc($updatesTable . '.created_at');

        if (! empty($filters['vehicle_uuid'])) {
            $query->where($vehiclesTable . '.uuid', $filters['vehicle_uuid']);
        }

        if (! empty($filters['user_id'])) {
            $query->where($updatesTable . '.user_id', $filters['user_id']);
        }

        if (! empty($filters['to_status'])) {
            $status = $filters['to_status'];
            $query->where($updatesTable . '.request_json', 'like', '%"page_status":"' . $status . '"%');
        }

        $rows = $query->limit((int) ($filters['limit'] ?? 100))->get();

        $data = $rows->map(function ($row) {
            $replaced = $this->decodeJsonField($row->replaced_json);
            $requested = $this->decodeJsonField($row->request_json);

            return [
                'id' => $row->id,
                'at' => Carbon::parse($row->created_at)->toIso8601String(),
                'source' => str_replace(self::API_PREFIX, '', (string) $row->api_name),
                'from_status' => $replaced['page_status'] ?? null,
                'to_status' => $requested['page_status'] ?? null,
                'vehicle_uuid' => $row->vehicle_uuid ?? ($requested['vehicle_uuid'] ?? null),
                'vehicle_name' => $row->vehicle_name ?? ($replaced['vehicle_name'] ?? null),
                'vin' => $row->vin ?? ($requested['vin'] ?? null),
                'user_email' => $row->user_email,
                'user_id' => $row->user_id ?? null,
                'meta' => $requested,
            ];
        })->values()->all();

        return [
            'data' => $data,
            'filters' => [
                'start_date' => $filters['start_date']->toDateString(),
                'end_date' => $filters['end_date']->toDateString(),
                'vehicle_uuid' => $filters['vehicle_uuid'] ?? null,
                'user_id' => $filters['user_id'] ?? null,
                'to_status' => $filters['to_status'] ?? null,
                'limit' => (int) ($filters['limit'] ?? 100),
            ],
        ];
    }

    private function decodeJsonField(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (! is_string($value) || trim($value) === '') {
            return [];
        }
        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
}
