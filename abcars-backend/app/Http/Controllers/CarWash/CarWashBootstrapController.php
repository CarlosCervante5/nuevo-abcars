<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
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
