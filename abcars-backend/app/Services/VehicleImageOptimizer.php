<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

/**
 * Optimiza fotos de vehículos en el servidor: aplana alpha, JPEG, opcional resize.
 * Sustituye el paso Cloudinary del upload híbrido.
 */
class VehicleImageOptimizer
{
    /**
     * @return array{binary: string, width: int, height: int, driver: string, bytes: int}
     */
    public function optimizeFileToJpeg(string $absolutePath): array
    {
        if (! is_file($absolutePath) || ! is_readable($absolutePath)) {
            throw new Exception("Image file not readable: {$absolutePath}");
        }

        $driver = $this->resolveDriver();
        $bg = $this->flattenBgRgb();
        $maxWidth = max(1, (int) Config::get('vehicle_images.max_width', 2400));
        $quality = min(100, max(1, (int) Config::get('vehicle_images.jpeg_quality', 85)));

        $result = $driver === 'imagick'
            ? $this->optimizeWithImagick($absolutePath, $bg, $maxWidth, $quality)
            : $this->optimizeWithGd($absolutePath, $bg, $maxWidth, $quality);

        Log::info('Vehicle image optimized locally', [
            'driver' => $result['driver'],
            'width' => $result['width'],
            'height' => $result['height'],
            'bytes' => $result['bytes'],
        ]);

        return $result;
    }

    public function resolveDriver(): string
    {
        $pref = strtolower((string) Config::get('vehicle_images.driver', 'auto'));

        if ($pref === 'imagick') {
            if (! extension_loaded('imagick')) {
                throw new Exception('VEHICLE_IMAGE_DRIVER=imagick but ext-imagick is not loaded');
            }

            return 'imagick';
        }

        if ($pref === 'gd') {
            if (! extension_loaded('gd')) {
                throw new Exception('VEHICLE_IMAGE_DRIVER=gd but ext-gd is not loaded');
            }

            return 'gd';
        }

        if (extension_loaded('imagick')) {
            return 'imagick';
        }

        if (extension_loaded('gd')) {
            return 'gd';
        }

        throw new Exception('Neither imagick nor gd PHP extensions are available for vehicle image optimization');
    }

    /**
     * @return array{r: int, g: int, b: int, hex: string}
     */
    public function flattenBgRgb(): array
    {
        $raw = (string) Config::get('vehicle_images.flatten_bg_rgb', 'fafbfc');
        $hex = strtolower(preg_replace('/[^a-f0-9]/', '', $raw) ?? '');
        if (strlen($hex) !== 6) {
            $hex = 'fafbfc';
        }

        return [
            'r' => hexdec(substr($hex, 0, 2)),
            'g' => hexdec(substr($hex, 2, 2)),
            'b' => hexdec(substr($hex, 4, 2)),
            'hex' => $hex,
        ];
    }

    /**
     * @param  array{r: int, g: int, b: int, hex: string}  $bg
     * @return array{binary: string, width: int, height: int, driver: string, bytes: int}
     */
    protected function optimizeWithImagick(string $path, array $bg, int $maxWidth, int $quality): array
    {
        $image = new \Imagick($path);

        try {
            if (method_exists($image, 'autoOrientImage')) {
                $image->autoOrientImage();
            } elseif (method_exists($image, 'autoOrient')) {
                $image->autoOrient();
            } elseif (defined('Imagick::ORIENTATION_TOPLEFT')) {
                // Imagick < 3.x naming
                $orientation = $image->getImageOrientation();
                if ($orientation !== \Imagick::ORIENTATION_TOPLEFT && $orientation !== 0) {
                    switch ($orientation) {
                        case \Imagick::ORIENTATION_RIGHTTOP:
                            $image->rotateImage(new \ImagickPixel('none'), 90);
                            break;
                        case \Imagick::ORIENTATION_BOTTOMRIGHT:
                            $image->rotateImage(new \ImagickPixel('none'), 180);
                            break;
                        case \Imagick::ORIENTATION_LEFTBOTTOM:
                            $image->rotateImage(new \ImagickPixel('none'), -90);
                            break;
                    }
                    $image->setImageOrientation(\Imagick::ORIENTATION_TOPLEFT);
                }
            }

            $width = $image->getImageWidth();
            $height = $image->getImageHeight();

            if ($width > $maxWidth) {
                $image->resizeImage($maxWidth, 0, \Imagick::FILTER_LANCZOS, 1);
                $width = $image->getImageWidth();
                $height = $image->getImageHeight();
            }

            $canvas = new \Imagick();
            $canvas->newImage($width, $height, new \ImagickPixel('#'.$bg['hex']));
            $canvas->compositeImage($image, \Imagick::COMPOSITE_OVER, 0, 0);
            $canvas->setImageFormat('jpeg');
            $canvas->setImageCompression(\Imagick::COMPRESSION_JPEG);
            $canvas->setImageCompressionQuality($quality);
            $canvas->stripImage();

            $binary = $canvas->getImageBlob();
            $outW = $canvas->getImageWidth();
            $outH = $canvas->getImageHeight();

            $canvas->clear();
            $canvas->destroy();
            $image->clear();
            $image->destroy();

            if ($binary === '' || $binary === false) {
                throw new Exception('Imagick produced empty JPEG');
            }

            return [
                'binary' => $binary,
                'width' => $outW,
                'height' => $outH,
                'driver' => 'imagick',
                'bytes' => strlen($binary),
            ];
        } catch (\Throwable $e) {
            try {
                $image->clear();
                $image->destroy();
            } catch (\Throwable) {
            }
            throw new Exception('Imagick optimization failed: '.$e->getMessage(), 0, $e);
        }
    }

    /**
     * @param  array{r: int, g: int, b: int, hex: string}  $bg
     * @return array{binary: string, width: int, height: int, driver: string, bytes: int}
     */
    protected function optimizeWithGd(string $path, array $bg, int $maxWidth, int $quality): array
    {
        $info = @getimagesize($path);
        if ($info === false) {
            throw new Exception('GD could not read image dimensions');
        }

        $type = $info[2];
        $src = match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            IMAGETYPE_GIF => @imagecreatefromgif($path),
            default => false,
        };

        if ($src === false) {
            throw new Exception('GD could not decode image (unsupported or corrupt)');
        }

        $width = imagesx($src);
        $height = imagesy($src);

        if ($width > $maxWidth) {
            $newW = $maxWidth;
            $newH = (int) max(1, round($height * ($maxWidth / $width)));
            $resized = imagecreatetruecolor($newW, $newH);
            if ($resized === false) {
                imagedestroy($src);
                throw new Exception('GD failed to allocate resize canvas');
            }
            imagecopyresampled($resized, $src, 0, 0, 0, 0, $newW, $newH, $width, $height);
            imagedestroy($src);
            $src = $resized;
            $width = $newW;
            $height = $newH;
        }

        $canvas = imagecreatetruecolor($width, $height);
        if ($canvas === false) {
            imagedestroy($src);
            throw new Exception('GD failed to allocate flatten canvas');
        }

        $fill = imagecolorallocate($canvas, $bg['r'], $bg['g'], $bg['b']);
        imagefill($canvas, 0, 0, $fill);
        imagealphablending($canvas, true);
        imagecopy($canvas, $src, 0, 0, 0, 0, $width, $height);
        imagedestroy($src);

        ob_start();
        $ok = imagejpeg($canvas, null, $quality);
        $binary = ob_get_clean();
        imagedestroy($canvas);

        if (! $ok || $binary === false || $binary === '') {
            throw new Exception('GD failed to encode JPEG');
        }

        return [
            'binary' => $binary,
            'width' => $width,
            'height' => $height,
            'driver' => 'gd',
            'bytes' => strlen($binary),
        ];
    }
}
