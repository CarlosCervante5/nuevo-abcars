<?php

namespace App\Services\Intelimotor;

use App\Models\Dealership;
use App\Models\IntelimotorSetting;
use App\Models\LineModel;
use App\Models\ModelVersion;
use App\Models\Vehicle;
use App\Models\VehicleBody;
use App\Models\VehicleBrand;
use App\Models\VehicleImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IntelimotorInventorySyncService
{
    public function __construct(
        private IntelimotorApiService $intelimotorApi
    ) {}

    public function syncInventory(bool $syncImages = true): array
    {
        $settings = IntelimotorSetting::current();
        $units = $this->intelimotorApi->fetchAllUnits($settings);

        $summary = [
            'total_remote' => count($units),
            'visible_remote' => 0,
            'created' => 0,
            'updated' => 0,
            'marked_sold' => 0,
            'images_synced' => 0,
            'skipped' => 0,
            'skipped_not_visible' => 0,
            'errors' => [],
        ];

        $seenUnitIds = [];

        DB::transaction(function () use ($units, $settings, $syncImages, &$summary, &$seenUnitIds) {
            foreach ($units as $unit) {
                $unitId = (string) ($unit['id'] ?? '');
                if ($unitId === '') {
                    $summary['skipped']++;
                    continue;
                }

                if (! $this->isImportableIntelimotorUnit($unit)) {
                    $summary['skipped_not_visible']++;
                    continue;
                }

                $summary['visible_remote']++;
                $seenUnitIds[] = $unitId;

                try {
                    $existing = $this->findVehicleForUnit($unit);
                    $isCreate = $existing === null;
                    $vehicle = $this->upsertVehicleFromUnit($unit, $settings, $existing);

                    if ($isCreate) {
                        $summary['created']++;
                    } else {
                        $summary['updated']++;
                    }

                    if ($syncImages) {
                        $imageCount = $this->syncImagesFromIntelimotor($vehicle, $unit);
                        $summary['images_synced'] += $imageCount;
                    }
                } catch (\Throwable $exception) {
                    $summary['errors'][] = [
                        'unit_id' => $unitId,
                        'message' => $exception->getMessage(),
                    ];
                }
            }

            $summary['marked_sold'] += $this->markMissingUnitsAsSold($seenUnitIds);
        });

        $settings->last_sync_at = now();
        $settings->last_sync_summary = json_encode($summary);
        $settings->save();

        return $summary;
    }

    public function pushVehiclePhotos(Vehicle $vehicle): array
    {
        if (! filled($vehicle->intelimotor_unit_id)) {
            throw new IntelimotorIntegrationException(
                'El vehículo no tiene intelimotor_unit_id. Sincroniza primero desde Intelimotor.',
                422
            );
        }

        $pictureUrls = $vehicle->images()
            ->orderBy('sort_id')
            ->pluck('service_image_url')
            ->filter(fn ($url) => filled($url) && str_starts_with($url, 'http'))
            ->values()
            ->all();

        if ($pictureUrls === []) {
            throw new IntelimotorIntegrationException('El vehículo no tiene fotos con URL pública para enviar.', 422);
        }

        $result = $this->intelimotorApi->patchUnit($vehicle->intelimotor_unit_id, [
            'pictureUrls' => $pictureUrls,
        ]);

        if (! $result['success']) {
            throw new IntelimotorIntegrationException(
                $result['error'] ?? 'Intelimotor rechazó la actualización de fotos.',
                $result['status']
            );
        }

        $vehicle->intelimotor_synced_at = now();
        $vehicle->save();

        return [
            'vehicle_uuid' => $vehicle->uuid,
            'intelimotor_unit_id' => $vehicle->intelimotor_unit_id,
            'photos_sent' => count($pictureUrls),
            'remote' => $result['data'],
        ];
    }

    public function listLinkedVehicles(int $limit = 50): array
    {
        return Vehicle::query()
            ->whereNotNull('intelimotor_unit_id')
            ->withCount('images')
            ->orderByDesc('intelimotor_synced_at')
            ->limit($limit)
            ->get(['uuid', 'name', 'vin', 'page_status', 'intelimotor_unit_id', 'intelimotor_ref', 'intelimotor_synced_at'])
            ->map(fn (Vehicle $vehicle) => [
                'uuid' => $vehicle->uuid,
                'name' => $vehicle->name,
                'vin' => $vehicle->vin,
                'page_status' => $vehicle->page_status,
                'intelimotor_unit_id' => $vehicle->intelimotor_unit_id,
                'intelimotor_ref' => $vehicle->intelimotor_ref,
                'intelimotor_synced_at' => $vehicle->intelimotor_synced_at?->toIso8601String(),
                'images_count' => $vehicle->images_count,
            ])
            ->all();
    }

    private function findVehicleForUnit(array $unit): ?Vehicle
    {
        $unitId = (string) ($unit['id'] ?? '');

        if ($unitId !== '') {
            $byUnitId = Vehicle::query()->where('intelimotor_unit_id', $unitId)->first();
            if ($byUnitId) {
                return $byUnitId;
            }
        }

        $vin = $this->normalizeVin((string) ($unit['vin'] ?? ''));
        if ($this->isUsableVin($vin)) {
            $byVin = Vehicle::query()->where('vin', $vin)->first();
            if ($byVin) {
                return $byVin;
            }
        }

        $ref = trim((string) ($unit['ref'] ?? ''));
        if ($ref !== '') {
            $normalizedRefVin = $this->normalizeVin($ref);

            return Vehicle::query()
                ->where(function ($query) use ($ref, $normalizedRefVin) {
                    $query->where('intelimotor_ref', $ref);
                    if ($this->isUsableVin($normalizedRefVin)) {
                        $query->orWhere('vin', $normalizedRefVin);
                    }
                })
                ->first();
        }

        return null;
    }

    private function upsertVehicleFromUnit(array $unit, IntelimotorSetting $settings, ?Vehicle $vehicle = null): Vehicle
    {
        $unitId = (string) $unit['id'];
        $brandName = $unit['brands'][0]['name'] ?? $unit['externalBrand'] ?? 'sin marca';
        $modelName = $unit['models'][0]['name'] ?? $unit['externalModel'] ?? 'sin modelo';
        $year = (int) ($unit['years'][0]['name'] ?? $unit['externalYear'] ?? date('Y'));
        $trim = $unit['customTrim'] ?? ($unit['trims'][0]['name'] ?? $unit['externalTrim'] ?? '');

        $vehicleName = trim(implode(' ', array_filter([
            $brandName,
            $modelName,
            (string) $year,
            $trim,
        ])));

        $vin = $this->resolveVin($unit);
        $pictureUrls = $this->extractPictureUrls($unit);

        $dealership = $this->resolveDealership($settings);
        $brand = VehicleBrand::firstOrCreate(['name' => strtolower($brandName)]);
        $model = LineModel::firstOrCreate([
            'name' => strtolower($modelName),
            'year' => $year,
            'brand_id' => $brand->id,
        ]);
        $versionName = $trim !== '' ? strtolower($trim) : 'base';
        $version = ModelVersion::firstOrCreate([
            'name' => $versionName,
            'model_id' => $model->id,
        ]);
        $body = VehicleBody::firstOrCreate(['name' => 'sedán']);

        if (! $model->bodies()->where('body_id', $body->id)->exists()) {
            $model->bodies()->attach($body->id);
        }

        if ($vehicle === null) {
            $vehicle = new Vehicle();
            $vehicle->vin = $vin;
        }

        $vehicle->intelimotor_unit_id = $unitId;
        $vehicle->intelimotor_ref = (string) ($unit['ref'] ?? null) ?: null;
        $vehicle->intelimotor_synced_at = now();
        $vehicle->name = $vehicleName;
        $vehicle->description = $vehicle->description ?: 'Importado desde Intelimotor';
        $vehicle->mileage = (int) ($unit['kms'] ?? 0);
        $vehicle->list_price = (float) ($unit['listPrice'] ?? 0);
        $vehicle->sale_price = (float) ($unit['listPrice'] ?? 0);
        $vehicle->category = 'pre_owned';
        $vehicle->type = 'car';
        $vehicle->page_status = $this->resolvePageStatusFromIntelimotor($unit, $pictureUrls);
        $vehicle->dealership_id = $dealership->id;
        $vehicle->brand_id = $brand->id;
        $vehicle->model_id = $model->id;
        $vehicle->version_id = $version->id;
        $vehicle->body_id = $body->id;

        if ($this->isUsableVin($this->normalizeVin((string) ($unit['vin'] ?? '')))) {
            $vehicle->vin = $this->normalizeVin((string) $unit['vin']);
        } elseif (! filled($vehicle->vin)) {
            $vehicle->vin = $vin;
        }

        $vehicle->save();

        return $vehicle->fresh();
    }

    private function syncImagesFromIntelimotor(Vehicle $vehicle, array $unit): int
    {
        $remoteUrls = $this->extractPictureUrls($unit);
        if ($remoteUrls === []) {
            return 0;
        }

        $existing = $vehicle->images()->orderBy('sort_id')->get();
        $existingUrls = $existing->pluck('service_image_url')->filter()->values()->all();

        if ($existingUrls === $remoteUrls) {
            return 0;
        }

        foreach ($existing as $image) {
            $image->delete();
        }

        $created = 0;
        foreach ($remoteUrls as $index => $url) {
            VehicleImage::create([
                'sort_id' => $index + 1,
                'image_name' => 'intelimotor-' . ($index + 1),
                'service_public_id' => 'intelimotor:' . md5($url),
                'service_image_url' => $url,
                'vehicle_id' => $vehicle->id,
            ]);
            $created++;
        }

        if ($vehicle->page_status !== 'sale') {
            $vehicle->page_status = $created > 0 ? 'active' : 'inactive';
            $vehicle->save();
        }

        return $created;
    }

    /**
     * @param array<int, string> $seenUnitIds
     */
    private function markMissingUnitsAsSold(array $seenUnitIds): int
    {
        if ($seenUnitIds === []) {
            return 0;
        }

        return Vehicle::query()
            ->whereNotNull('intelimotor_unit_id')
            ->whereNotIn('intelimotor_unit_id', $seenUnitIds)
            ->where('page_status', '!=', 'sale')
            ->update([
                'page_status' => 'sale',
                'intelimotor_synced_at' => now(),
            ]);
    }

    /**
     * Solo importar unidades visibles en Intelimotor (isSold=false).
     */
    private function isImportableIntelimotorUnit(array $unit): bool
    {
        return ($unit['isSold'] ?? true) === false;
    }

    private function resolvePageStatusFromIntelimotor(array $unit, array $pictureUrls): string
    {
        $status = $this->normalizeIntelimotorStatus((string) ($unit['status'] ?? ''));

        if (in_array($status, ['vendido', 'vendida', 'sold', 'entregado'], true)) {
            return 'sale';
        }

        if (in_array($status, ['activo'], true)) {
            return $pictureUrls !== [] ? 'active' : 'inactive';
        }

        if (in_array($status, ['apartado', 'preparacion', 'transito'], true)) {
            return 'inactive';
        }

        return $pictureUrls !== [] ? 'active' : 'inactive';
    }

    private function normalizeIntelimotorStatus(string $status): string
    {
        $status = mb_strtolower(trim($status));

        return str_replace(['á', 'é', 'í', 'ó', 'ú'], ['a', 'e', 'i', 'o', 'u'], $status);
    }

    /**
     * @return array<int, string>
     */
    private function extractPictureUrls(array $unit): array
    {
        $candidates = [];

        foreach (['pictureUrls', 'pictures'] as $field) {
            if (! empty($unit[$field]) && is_array($unit[$field])) {
                $candidates = array_merge($candidates, $unit[$field]);
            }
        }

        if (! empty($unit['listingInfo']['pictures']) && is_array($unit['listingInfo']['pictures'])) {
            $candidates = array_merge($candidates, $unit['listingInfo']['pictures']);
        }

        $urls = [];
        foreach ($candidates as $value) {
            if (! is_string($value)) {
                continue;
            }
            $value = trim($value);
            if ($value !== '' && (str_starts_with($value, 'http://') || str_starts_with($value, 'https://'))) {
                $urls[] = $value;
            }
        }

        return array_values(array_unique($urls));
    }

    private function resolveVin(array $unit): string
    {
        $vin = $this->normalizeVin((string) ($unit['vin'] ?? ''));
        if ($this->isUsableVin($vin)) {
            return $vin;
        }

        $refVin = $this->normalizeVin((string) ($unit['ref'] ?? ''));
        if ($this->isUsableVin($refVin)) {
            return $refVin;
        }

        $unitId = (string) ($unit['id'] ?? Str::random(12));

        return strtoupper(substr('IM' . preg_replace('/[^a-zA-Z0-9]/', '', $unitId), 0, 20));
    }

    private function normalizeVin(string $vin): string
    {
        return strtoupper(trim($vin));
    }

    private function isUsableVin(string $vin): bool
    {
        return strlen($vin) >= 8;
    }

    private function resolveDealership(IntelimotorSetting $settings): Dealership
    {
        if ($settings->default_dealership_id) {
            $dealership = Dealership::query()->find($settings->default_dealership_id);
            if ($dealership) {
                return $dealership;
            }
        }

        $dealership = Dealership::query()->orderBy('id')->first();
        if (! $dealership) {
            throw new IntelimotorIntegrationException('No hay sucursales en ABCars para asignar vehículos importados.', 422);
        }

        return $dealership;
    }
}
