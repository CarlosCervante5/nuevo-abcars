<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class ImageFetchProxyController extends Controller
{
    private const MAX_BYTES = 15 * 1024 * 1024;

    /** @var array<string, string> */
    private const OUTBOUND_HEADERS = [
        'User-Agent' => 'Mozilla/5.0 (compatible; ABCarsImageProxy/1.0; +https://abcars.mx)',
        'Accept' => 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language' => 'es-MX,es;q=0.9,en;q=0.8',
    ];

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

        $redirectOptions = [
            'max' => 10,
            'referer' => true,
            'protocols' => ['https'],
            'track_redirects' => false,
        ];

        $tooLargeFromHead = false;
        try {
            $head = Http::timeout(25)
                ->withHeaders(self::OUTBOUND_HEADERS)
                ->withOptions(['allow_redirects' => $redirectOptions])
                ->head($url);

            if ($head->successful()) {
                $lengthHeader = $head->header('Content-Length');
                if (is_string($lengthHeader) && $lengthHeader !== '' && ctype_digit($lengthHeader)) {
                    $tooLargeFromHead = (int) $lengthHeader > self::MAX_BYTES;
                }
            }
        } catch (Throwable) {
            // HEAD suele fallar (405, timeout); el GET sigue siendo la fuente de verdad.
        }

        if ($tooLargeFromHead) {
            abort(413, 'Imagen demasiado grande.');
        }

        try {
            $response = Http::timeout(60)
                ->withHeaders(self::OUTBOUND_HEADERS)
                ->withOptions(['allow_redirects' => $redirectOptions])
                ->get($url);
        } catch (ConnectionException $e) {
            Log::warning('fetch-image: conexión o tiempo agotado', [
                'host' => $host,
                'message' => $e->getMessage(),
            ]);
            abort(504, 'Tiempo de espera agotado al obtener la imagen.');
        } catch (Throwable $e) {
            if ($e instanceof HttpExceptionInterface) {
                throw $e;
            }
            Log::warning('fetch-image: error de cliente HTTP', [
                'host' => $host,
                'message' => $e->getMessage(),
            ]);
            abort(502, 'No se pudo contactar el origen de la imagen.');
        }

        if (! $response->successful()) {
            Log::warning('fetch-image: respuesta no exitosa del origen', [
                'host' => $host,
                'status' => $response->status(),
            ]);
            abort(502, 'No se pudo obtener la imagen del origen.');
        }

        $body = $response->body();
        if (strlen($body) > self::MAX_BYTES) {
            abort(413, 'Imagen demasiado grande.');
        }

        if ($this->looksLikeNonImagePayload($body)) {
            Log::warning('fetch-image: cuerpo no es binario de imagen', ['host' => $host]);
            abort(502, 'El origen no devolvió una imagen válida.');
        }

        $contentType = $this->resolveProxiedImageContentType($response->header('Content-Type'), $body, $url);

        return response($body, 200)
            ->header('Content-Type', $contentType)
            ->header('Cache-Control', 'private, max-age=300');
    }

    /**
     * Evita devolver HTML/XML de error del CDN (a veces con 200) como si fuera JPEG por la extensión .jpg.
     */
    private function looksLikeNonImagePayload(string $body): bool
    {
        if ($body === '') {
            return true;
        }

        $probe = substr($body, 0, 64);
        $trim = ltrim($probe);
        if ($trim !== '' && (
            str_starts_with($trim, '<!DOCTYPE')
            || str_starts_with($trim, '<html')
            || str_starts_with($trim, '<?xml')
            || str_starts_with($trim, '<HTML')
            || str_starts_with($trim, '{')
        )) {
            return true;
        }

        return false;
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
        $patterns = config('external_image_proxy.allowed_host_patterns', []);
        if (! is_array($patterns)) {
            $patterns = [];
        }

        foreach ($patterns as $pattern) {
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
