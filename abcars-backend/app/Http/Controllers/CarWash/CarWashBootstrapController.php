<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\CarWash\CarWashAppointment;
use Carbon\Carbon;
use Database\Seeders\CarWashSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

/**
 * Bootstrap one-shot para sandbox: migraciones CarWash + seeder (usuarios supervisor/lavador).
 * Protegido por secret (CARWASH_BOOTSTRAP_SECRET o EVOLUTION_WEBHOOK_SECRET).
 */
class CarWashBootstrapController extends Controller
{
    public function staff(Request $request)
    {
        if (! $this->authorizeBootstrap($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            Artisan::call('migrate', [
                '--force' => true,
                '--path' => 'database/migrations/2026_09_08_120000_create_carwash_tables.php',
            ]);
            $migrateOutput = Artisan::output();

            Artisan::call('migrate', [
                '--force' => true,
                '--path' => 'database/migrations/2026_09_08_140000_create_carwash_settings_table.php',
            ]);
            $migrateOutput .= Artisan::output();

            Artisan::call('db:seed', [
                '--class' => CarWashSeeder::class,
                '--force' => true,
            ]);
            $seedOutput = Artisan::output();

            return ApiResponseHelper::apiSuccess(200, 'CarWash bootstrap OK', [
                'migrate' => trim($migrateOutput),
                'seed' => trim($seedOutput),
                'users' => [
                    [
                        'role' => 'carwash_supervisor',
                        'email' => 'carwash_supervisor@abcars.mx',
                        'password' => 'CarWashSupervisor%2026%%',
                    ],
                    [
                        'role' => 'carwash_washer',
                        'email' => 'carwash_lavador@abcars.mx',
                        'password' => 'CarWashLavador%2026%%',
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('CarWash bootstrap failed', ['message' => $e->getMessage()]);

            return ApiResponseHelper::apiError('Bootstrap CarWash falló', $e->getMessage(), 500, 'CARWASH_BOOTSTRAP');
        }
    }

    /**
     * Repara citas WhatsApp/admin con año viejo (p. ej. 2023) para que aparezcan en la agenda actual.
     */
    public function repairSchedules(Request $request)
    {
        if (! $this->authorizeBootstrap($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $tz = 'America/Mexico_City';
            $now = now($tz);
            $fixed = [];

            $rows = CarWashAppointment::query()
                ->with('serviceType')
                ->whereNotNull('scheduled_start_at')
                ->whereNotIn('status', ['cancelled', 'delivered', 'no_show'])
                ->where(function ($q) use ($now) {
                    $q->whereYear('scheduled_start_at', '<', (int) $now->year)
                        ->orWhere('scheduled_start_at', '<', $now->copy()->subDay())
                        // WhatsApp reciente con fecha lejana (IA inventó p. ej. octubre cuando dijeron "hoy")
                        ->orWhere(function ($q2) use ($now) {
                            $q2->where('channel', 'whatsapp')
                                ->where('created_at', '>=', $now->copy()->subDays(14)->utc())
                                ->where('scheduled_start_at', '>', $now->copy()->addDays(2)->utc());
                        });
                })
                ->limit(200)
                ->get();

            foreach ($rows as $row) {
                $start = Carbon::parse($row->scheduled_start_at)->timezone($tz);
                $from = $start->toIso8601String();
                $created = $row->created_at ? Carbon::parse($row->created_at)->timezone($tz) : $now->copy();
                $isRecentWhatsApp = ($row->channel ?? '') === 'whatsapp'
                    && $created->gt($now->copy()->subDays(14));

                // WhatsApp reciente + fecha lejana o año viejo → anclar al día de creación (misma hora)
                if ($isRecentWhatsApp && (
                    (int) $start->year < (int) $now->year
                    || $start->gt($created->copy()->addDays(2))
                )) {
                    $candidate = $created->copy()->startOfDay()->setTime($start->hour, $start->minute, 0);
                    if ($candidate->lt($now->copy()->subHours(1))) {
                        $candidate->addDay();
                    }
                } else {
                    $candidate = $start->copy()->year($now->year);
                    if ($candidate->lt($now->copy()->subHours(1))) {
                        $candidate->addYear();
                    }
                    if ($candidate->gt($now->copy()->addMonths(6))) {
                        $candidate = $now->copy()->addDay()->setTime($start->hour, $start->minute, 0);
                    }
                }

                $duration = max(15, (int) ($row->serviceType?->duration_minutes ?? 60));
                if ($row->scheduled_end_at && $row->scheduled_start_at) {
                    $duration = max(15, Carbon::parse($row->scheduled_start_at)->diffInMinutes(Carbon::parse($row->scheduled_end_at)));
                }

                $row->scheduled_start_at = $candidate;
                $row->scheduled_end_at = $candidate->copy()->addMinutes($duration);
                $row->save();

                $fixed[] = [
                    'uuid' => $row->uuid,
                    'customer_name' => $row->customer_name,
                    'from' => $from,
                    'to' => $candidate->toIso8601String(),
                ];
            }

            return ApiResponseHelper::apiSuccess(200, 'Citas CarWash reparadas', [
                'fixed_count' => count($fixed),
                'fixed' => $fixed,
            ]);
        } catch (\Throwable $e) {
            Log::error('CarWash repairSchedules failed', ['message' => $e->getMessage()]);

            return ApiResponseHelper::apiError('Repair CarWash falló', $e->getMessage(), 500, 'CARWASH_REPAIR_SCHEDULES');
        }
    }

    private function authorizeBootstrap(Request $request): bool
    {
        $secret = (string) (
            env('CARWASH_BOOTSTRAP_SECRET')
            ?: config('carwash.evolution.webhook_secret')
            ?: ''
        );

        if ($secret === '') {
            return false;
        }

        $provided = $request->header('x-carwash-bootstrap-secret')
            ?: $request->header('x-webhook-secret')
            ?: $request->query('secret');

        return is_string($provided) && hash_equals($secret, $provided);
    }
}
