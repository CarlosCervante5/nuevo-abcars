<?php

use App\Http\Middleware\LogBandwidthUsage;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);
        $middleware->prepend(\App\Http\Middleware\EnsureCapacitorApiCors::class);
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'deny_role' => \App\Http\Middleware\DenyIfRoleMiddleware::class,
            'bandwidth_usage' => LogBandwidthUsage::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('intelimotor:sync-scheduled')->everyMinute();
        // Soft-delete de vendidos por Intelimotor tras 1 mes calendario (sold_at). El auto permanece soft-deleted.
        $schedule->command('vehicles:purge-sold')->dailyAt('03:15');
        // Hard-delete de imágenes soft-deleted tras 1 mes calendario (Cloudinary + BD). No toca el vehículo.
        $schedule->command('vehicles:hard-delete-images')->dailyAt('03:30');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Sin ruta web nombrada `login`, `AuthenticationException` intentaba `route('login')` y fallaba → 500 HTML.
        // Todas las rutas en `routes/api.php` deben responder errores en JSON aunque `Accept` sea `*/*` (p. ej. fetch()).
        $exceptions->shouldRenderJsonWhen(function (Request $request, \Throwable $e): bool {
            return $request->is('api/*');
        });
    })->create();
