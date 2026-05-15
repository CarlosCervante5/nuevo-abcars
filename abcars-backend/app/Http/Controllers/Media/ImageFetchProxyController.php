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

        $contentType = $this->resolveProxiedImageContentType($response->header('Content-Type'), $body, $url);

        return response($body, 200)
            ->header('Content-Type', $contentType)
            ->header('Cache-Control', 'private, max-age=300');
    }

    /**
     * Intelimotor/S3 suele mandar application/octet-stream aunque el cuerpo sea JPEG/PNG.
     */
    private function resolveProxiedImageContentType(?string $header, string $body, string $url): string
    {
        if (is_string($header) && $header !== '') {
            $main = strtolower(trim(explode(';', $header)[0]));
            if (str_starts_with($main, 'image/')) {
                return $main;
            }
        }

        $sniffed = $this->sniffImageMimeFromBody($body);
        if ($sniffed !== null) {
            return $sniffed;
        }

        $fromPath = $this->guessImageMimeFromUrlPath($url);
        if ($fromPath !== null) {
            return $fromPath;
        }

        abort(415, 'El recurso no es una imagen reconocible.');
    }

    private function sniffImageMimeFromBody(string $body): ?string
    {
        $len = strlen($body);
        if ($len < 12) {
            return null;
        }

        if ($body[0] === "\xff" && $body[1] === "\xd8" && $body[2] === "\xff") {
            return 'image/jpeg';
        }

        $pngSig = "\x89PNG\r\n\x1a\n";
        if (strncmp($body, $pngSig, strlen($pngSig)) === 0) {
            return 'image/png';
        }

        if (strncmp($body, 'GIF87a', 6) === 0 || strncmp($body, 'GIF89a', 6) === 0) {
            return 'image/gif';
        }

        if (
            strncmp($body, 'RIFF', 4) === 0
            && $len >= 12
            && strncmp(substr($body, 8, 4), 'WEBP', 4) === 0
        ) {
            return 'image/webp';
        }

        return null;
    }

    private function guessImageMimeFromUrlPath(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            return null;
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => null,
        };
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
