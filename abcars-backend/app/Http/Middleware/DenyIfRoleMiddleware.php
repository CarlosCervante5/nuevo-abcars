<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloquea el acceso si el usuario autenticado tiene alguno de los roles indicados.
 */
class DenyIfRoleMiddleware
{
    /**
     * @param  string  ...$roles  Nombres de rol Spatie (ej. body)
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if ($user && $roles !== [] && $user->hasAnyRole($roles)) {
            abort(Response::HTTP_FORBIDDEN, 'No autorizado para este recurso.');
        }

        return $next($request);
    }
}
