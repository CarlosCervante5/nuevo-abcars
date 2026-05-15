<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * El WebView de Capacitor Android usa Origin https://localhost (androidScheme: https).
 * Si la configuración CORS desplegada no devuelve ACAO, el navegador bloquea XHR/fetch y Axios muestra «Network Error».
 * Este middleware complementa HandleCors solo cuando falta Access-Control-Allow-Origin en rutas /api/*.
 */
class EnsureCapacitorApiCors
{
    private function isAllowedOrigin(?string $origin): bool
    {
        if ($origin === null || $origin === '') {
            return false;
        }

        if (in_array($origin, ['capacitor://localhost', 'ionic://localhost', 'http://localhost'], true)) {
            return true;
        }

        return (bool) preg_match('#^https://localhost(:\d+)?$#', $origin)
            || (bool) preg_match('#^http://localhost(:\d+)?$#', $origin);
    }

    private function applyHeaders(Response $response, string $origin, Request $request): void
    {
        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $vary = $response->headers->get('Vary');
        $response->headers->set('Vary', $vary !== null && $vary !== '' ? $vary.', Origin' : 'Origin');

        if (!$response->headers->has('Access-Control-Allow-Methods')) {
            $response->headers->set(
                'Access-Control-Allow-Methods',
                'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            );
        }

        if (!$response->headers->has('Access-Control-Allow-Headers') && $request->headers->has('Access-Control-Request-Headers')) {
            $response->headers->set(
                'Access-Control-Allow-Headers',
                (string) $request->headers->get('Access-Control-Request-Headers')
            );
        }
    }

    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');

        if (!$this->isAllowedOrigin($origin) || !str_starts_with('/'.$request->path(), '/api')) {
            return $next($request);
        }

        if ($request->isMethod('OPTIONS') && $request->headers->has('Access-Control-Request-Method')) {
            $response = response('', 204);
            $this->applyHeaders($response, $origin, $request);

            return $response;
        }

        $response = $next($request);

        if (!$response->headers->has('Access-Control-Allow-Origin')) {
            $this->applyHeaders($response, $origin, $request);
        }

        return $response;
    }
}
