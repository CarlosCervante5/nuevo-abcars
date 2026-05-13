<?php

namespace App\Console\Commands;

use App\Models\IntelimotorSchedulerSetting;
use App\Services\Intelimotor\IntelimotorIntegrationException;
use App\Services\Intelimotor\IntelimotorInventorySyncService;
use Illuminate\Console\Command;

class SyncIntelimotorInventoryScheduled extends Command
{
    protected $signature = 'intelimotor:sync-scheduled {--force : Ejecutar aunque no corresponda por intervalo}';

    protected $description = 'Sincroniza estatus de unidades Intelimotor si el programador está habilitado y venció el intervalo';

    public function handle(IntelimotorInventorySyncService $syncService): int
    {
        $settings = IntelimotorSchedulerSetting::current();

        if (! $settings->is_enabled && ! $this->option('force')) {
            $this->info('Sincronización programada deshabilitada.');

            return self::SUCCESS;
        }

        if (! $settings->isDue() && ! $this->option('force')) {
            $this->info('Aún no corresponde ejecutar la sincronización programada.');

            return self::SUCCESS;
        }

        try {
            $summary = $syncService->syncInventory((bool) $settings->sync_images);

            $settings->last_run_at = now();
            $settings->last_run_summary = json_encode($summary);
            $settings->last_run_error = null;
            $settings->save();

            $this->info(sprintf(
                'Sync OK: %d creados, %d actualizados, %d vendidos.',
                $summary['created'] ?? 0,
                $summary['updated'] ?? 0,
                $summary['marked_sold'] ?? 0
            ));

            return self::SUCCESS;
        } catch (IntelimotorIntegrationException $exception) {
            $settings->last_run_at = now();
            $settings->last_run_error = $exception->getMessage();
            $settings->save();

            $this->error($exception->getMessage());

            return self::FAILURE;
        } catch (\Throwable $exception) {
            $settings->last_run_at = now();
            $settings->last_run_error = $exception->getMessage();
            $settings->save();

            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
