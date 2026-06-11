<?php

namespace App\Services\Intelimotor;

use App\Models\IntelimotorAccount;
use App\Models\LineModel;
use App\Models\ModelVersion;
use App\Models\Vehicle;
use App\Models\VehicleBody;
use App\Models\VehicleBrand;
use App\Models\VehicleImage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IntelimotorInventorySyncService
{
    public function __construct(
        private IntelimotorApiService $intelimotorApi,
        private IntelimotorAccountService $accountService
    ) {}

    public function syncInventory(bool $syncImages = true, ?string $accountUuid = null): array
    {
        $accounts = $this->resolveAccountsForSync($accountUuid);

        if ($accounts->isEmpty()) {
            throw new IntelimotorIntegrationException('No hay cuentas Intelimotor habilitadas con credenciales.', 422);
        }

        $aggregate = $this->emptySummary();
        $aggregate['accounts'] = [];

        foreach ($accounts as $account) {
            $accountSummary = $this->syncAccountInventory($account, $syncImages);
            $aggregate['accounts'][] = [
                'account_uuid' => $account->uuid,
                'account_name' => $account->name,
                ...$accountSummary,
            ];
            $this->mergeSummary($aggregate, $accountSummary);
        }

        return $aggregate;
    }

    public function pushVehiclePhotos(Vehicle $vehicle): array
    {
        if (! filled($vehicle->intelimotor_unit_id)) {
            throw new IntelimotorIntegrationException(
                'El vehículo no tiene intelimotor_unit_id. Sincroniza primero desde Intelimotor.',
                422
            );
        }

        $account = $this->resolveAccountForVehicle($vehicle);

        $pictureUrls = $vehicle->images()
            ->orderBy('sort_id')
            ->pluck('service_image_url')
            ->filter(fn ($url) => filled($url) && str_starts_with($url, 'http'))
            ->map(fn ($url) => IntelimotorPictureUrlTransformer::forPush(
                (string) $url,
                (string) config('services.intelimotor.picture_flatten_bg', 'fafbfc')
            ))
            ->values()
            ->all();

        if ($pictureUrls === []) {
            throw new IntelimotorIntegrationException('El vehículo no tiene fotos con URL pública para enviar.', 422);
        }

        $result = $this->intelimotorApi->patchUnit($vehicle->intelimotor_unit_id, [
            'pictureUrls' => $pictureUrls,
        ], $account);

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
            'intelimotor_account_uuid' => $account->uuid,
            'intelimotor_unit_id' => $vehicle->intelimotor_unit_id,
            'photos_sent' => count($pictureUrls),
            'remote' => $result['data'],
        ];
    }

    public function listLinkedVehicles(int $limit = 100): array
    {
        return Vehicle::query()
            ->whereNotNull('intelimotor_unit_id')
            ->with(['intelimotorAccount:id,uuid,name'])
            ->withCount('images')
            ->orderByDesc('intelimotor_synced_at')
            ->limit($limit)
            ->get([
                'uuid',
                'name',
                'vin',
                'page_status',
                'intelimotor_unit_id',
                'intelimotor_account_id',
                'intelimotor_ref',
                'intelimotor_synced_at',
            ])
            ->map(fn (Vehicle $vehicle) => [
                'uuid' => $vehicle->uuid,
                'name' => $vehicle->name,
                'vin' => $vehicle->vin,
                'page_status' => $vehicle->page_status,
                'intelimotor_unit_id' => $vehicle->intelimotor_unit_id,
                'intelimotor_account_uuid' => $vehicle->intelimotorAccount?->uuid,
                'intelimotor_account_name' => $vehicle->intelimotorAccount?->name,
                'intelimotor_ref' => $vehicle->intelimotor_ref,
                'intelimotor_synced_at' => $vehicle->intelimotor_synced_at?->toIso8601String(),
                'images_count' => $vehicle->images_count,
            ])
            ->all();
    }

    private function syncAccountInventory(IntelimotorAccount $account, bool $syncImages): array
    {
        $units = $this->intelimotorApi->fetchVisibleUnits($account);

        $summary = $this->emptySummary();
        $summary['total_remote'] = count($units);
        $summary['visible_remote'] = count($units);

        $seenUnitIds = [];

        DB::transaction(function () use ($units, $account, $syncImages, &$summary, &$seenUnitIds) {
            foreach ($units as $unit) {
                $unitId = (string) ($unit['id'] ?? '');
                if ($unitId === '') {
                    $summary['skipped']++;
                    continue;
                }

                $seenUnitIds[] = $unitId;

                try {
                    $existing = $this->findVehicleForUnit($unit, $account);
                    $isCreate = $existing === null;
                    $vehicle = $this->upsertVehicleFromUnit($unit, $account, $existing);

                    if ($isCreate) {
                        $summary['created']++;
                    } else {
                        $summary['updated']++;
                    }

                    if ($syncImages) {
                        $imageCount = $this->syncImagesFromIntelimotor($vehicle, $unit, $isCreate);
                        $summary['images_synced'] += $imageCount;
                    }
                } catch (\Throwable $exception) {
                    $summary['errors'][] = [
                        'unit_id' => $unitId,
                        'message' => $exception->getMessage(),
                    ];
                }
            }

            $summary['marked_sold'] += $this->markMissingUnitsAsSold($seenUnitIds, $account);
        });

        $account->last_sync_at = now();
        $account->last_sync_summary = json_encode($summary);
        $account->save();

        return $summary;
    }

    private function resolveAccountsForSync(?string $accountUuid): Collection
    {
        if ($accountUuid) {
            $account = $this->accountService->findByUuid($accountUuid);
            if (! $account->is_enabled || ! $account->hasCredentials()) {
                throw new IntelimotorIntegrationException('La cuenta seleccionada no está habilitada o no tiene credenciales.', 422);
            }

            return collect([$account]);
        }

        return $this->accountService->enabledAccounts()->filter(fn (IntelimotorAccount $account) => $account->hasCredentials());
    }

    private function resolveAccountForVehicle(Vehicle $vehicle): IntelimotorAccount
    {
        if ($vehicle->intelimotor_account_id) {
            $account = IntelimotorAccount::query()->find($vehicle->intelimotor_account_id);
            if ($account) {
                return $account;
            }
        }

        $fallback = $this->accountService->enabledAccounts()->first(fn (IntelimotorAccount $account) => $account->hasCredentials());
        if (! $fallback) {
            throw new IntelimotorIntegrationException('No hay cuenta Intelimotor configurada para este vehículo.', 422);
        }

        return $fallback;
    }

    private function emptySummary(): array
    {
        return [
            'total_remote' => 0,
            'visible_remote' => 0,
            'created' => 0,
            'updated' => 0,
            'marked_sold' => 0,
            'images_synced' => 0,
            'skipped' => 0,
            'skipped_not_visible' => 0,
            'errors' => [],
            'accounts' => [],
        ];
    }

    private function mergeSummary(array &$aggregate, array $accountSummary): void
    {
        foreach (['total_remote', 'visible_remote', 'created', 'updated', 'marked_sold', 'images_synced', 'skipped', 'skipped_not_visible'] as $key) {
            $aggregate[$key] += (int) ($accountSummary[$key] ?? 0);
        }

        $aggregate['errors'] = array_merge($aggregate['errors'], $accountSummary['errors'] ?? []);
    }

    private function findVehicleForUnit(array $unit, IntelimotorAccount $account): ?Vehicle
    {
        $unitId = (string) ($unit['id'] ?? '');

        if ($unitId !== '') {
            $byUnitId = Vehicle::query()
                ->where('intelimotor_account_id', $account->id)
                ->where('intelimotor_unit_id', $unitId)
                ->first();
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
                ->where(function ($query) use ($ref, $normalizedRefVin, $account) {
                    $query->where(function ($inner) use ($ref, $account) {
                        $inner->where('intelimotor_account_id', $account->id)
                            ->where('intelimotor_ref', $ref);
                    });
                    if ($this->isUsableVin($normalizedRefVin)) {
                        $query->orWhere('vin', $normalizedRefVin);
                    }
                })
                ->first();
        }

        return null;
    }

    private function upsertVehicleFromUnit(array $unit, IntelimotorAccount $account, ?Vehicle $vehicle = null): Vehicle
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

        $isNew = ! $vehicle->exists;

        $vehicle->intelimotor_account_id = $account->id;
        $vehicle->intelimotor_unit_id = $unitId;
        $vehicle->intelimotor_ref = (string) ($unit['ref'] ?? null) ?: null;
        $vehicle->intelimotor_synced_at = now();
        $vehicle->name = $vehicleName;
        $vehicle->description = $vehicle->description ?: 'Importado desde Intelimotor';
        $vehicle->mileage = (int) ($unit['kms'] ?? 0);
        $vehicle->list_price = (float) ($unit['listPrice'] ?? 0);
        $vehicle->sale_price = (float) ($unit['listPrice'] ?? 0);
        if ($isNew) {
            $vehicle->category = 'pre_owned';
            $vehicle->type = 'car';
            $vehicle->page_status = $this->resolvePageStatusFromIntelimotor($unit, $pictureUrls);
        }
        $vehicle->brand_id = $brand->id;
        $vehicle->model_id = $model->id;
        $vehicle->version_id = $version->id;
        if ($isNew) {
            $vehicle->body_id = $body->id;
        }

        if ($this->isUsableVin($this->normalizeVin((string) ($unit['vin'] ?? '')))) {
            $vehicle->vin = $this->normalizeVin((string) $unit['vin']);
        } elseif (! filled($vehicle->vin)) {
            $vehicle->vin = $vin;
        }

        $vehicle->save();

        return $vehicle->fresh();
    }

    private function syncImagesFromIntelimotor(Vehicle $vehicle, array $unit, bool $isCreate = false): int
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

        if ($isCreate && $vehicle->page_status !== 'sale') {
            $vehicle->page_status = $created > 0 ? 'active' : 'inactive';
            $vehicle->save();
        }

        return $created;
    }

    /**
     * @param  array<int, string>  $seenUnitIds
     */
    private function markMissingUnitsAsSold(array $seenUnitIds, IntelimotorAccount $account): int
    {
        if ($seenUnitIds === []) {
            return 0;
        }

        return Vehicle::query()
            ->where('intelimotor_account_id', $account->id)
            ->whereNotNull('intelimotor_unit_id')
            ->whereNotIn('intelimotor_unit_id', $seenUnitIds)
            ->where('page_status', '!=', 'sale')
            ->update([
                'page_status' => 'sale',
                'intelimotor_synced_at' => now(),
            ]);
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
}
