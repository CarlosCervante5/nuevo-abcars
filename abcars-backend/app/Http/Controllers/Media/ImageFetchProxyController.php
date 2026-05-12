<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class ImageFetchProxyController extends Controller
{
    private const MAX_BYTES = 15 * 1024 * 1024;

    public function fetch(Request $request): Response
    {
        $url = $request->query('url');
        if (! is_string($url) || $url === '' || strlen($url) > 4096) {
            abort(400, 'Parámetro url inválido.');
        }

        $parsed = parse_url($url);
        if (($parsed['scheme'] ?? '') !== 'https') {
            abort(400, 'Solo se permiten URLs HTTPS.');
        }

        $host = strtolower((string) ($parsed['host'] ?? ''));
        if ($host === '' || $this->isBlockedHost($host) || ! $this->isAllowedHost($host)) {
            abort(403, 'Host no permitido para descarga de imagen.');
        }

        $response = Http::timeout(60)
            ->withOptions(['allow_redirects' => ['max' => 3]])
            ->get($url);

        if (! $response->successful()) {
            abort(502, 'No se pudo obtener la imagen del origen.');
        }

        $body = $response->body();
        if (strlen($body) > self::MAX_BYTES) {
            abort(413, 'Imagen demasiado grande.');
        }

        $contentType = $response->header('Content-Type');
        if (! is_string($contentType) || ! str_starts_with(strtolower($contentType), 'image/')) {
            abort(415, 'El recurso no es una imagen.');
        }

        return response($body, 200)
            ->header('Content-Type', $contentType)
            ->header('Cache-Control', 'private, max-age=300');
    }

    private function isBlockedHost(string $host): bool
    {
        if (in_array($host, ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'], true)) {
            return true;
        }
        if (str_ends_with($host, '.local')) {
            return true;
        }
        if (str_starts_with($host, '169.254.')) {
            return true;
        }

        return false;
    }

    private function isAllowedHost(string $host): bool
    {
        foreach (config('external_image_proxy.allowed_host_patterns', []) as $pattern) {
            $pattern = trim((string) $pattern);
            if ($pattern === '') {
                continue;
            }
            if (fnmatch($pattern, $host)) {
                return true;
            }
        }

        return false;
    }
}
