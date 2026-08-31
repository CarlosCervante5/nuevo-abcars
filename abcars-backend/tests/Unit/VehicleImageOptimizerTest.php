<?php

namespace Tests\Unit;

use App\Services\VehicleImageOptimizer;
use Tests\TestCase;

class VehicleImageOptimizerTest extends TestCase
{
    public function test_optimizes_png_with_alpha_to_opaque_jpeg(): void
    {
        if (! extension_loaded('gd') && ! extension_loaded('imagick')) {
            $this->markTestSkipped('Requires gd or imagick');
        }

        $png = $this->makeTransparentPng();
        $optimizer = app(VehicleImageOptimizer::class);

        $result = $optimizer->optimizeFileToJpeg($png);

        $this->assertNotEmpty($result['binary']);
        $this->assertSame('image/jpeg', (new \finfo(FILEINFO_MIME_TYPE))->buffer($result['binary']));
        $this->assertGreaterThan(0, $result['width']);
        $this->assertGreaterThan(0, $result['height']);
        $this->assertContains($result['driver'], ['gd', 'imagick']);

        // El JPEG aplanado no debe ser mayor que un tope razonable para 64x64.
        $this->assertLessThan(50_000, $result['bytes']);

        @unlink($png);
    }

    public function test_downscales_wide_images(): void
    {
        if (! extension_loaded('gd') && ! extension_loaded('imagick')) {
            $this->markTestSkipped('Requires gd or imagick');
        }

        config(['vehicle_images.max_width' => 200]);

        $jpeg = $this->makeWideJpeg(800, 400);
        $optimizer = app(VehicleImageOptimizer::class);
        $result = $optimizer->optimizeFileToJpeg($jpeg);

        $this->assertLessThanOrEqual(200, $result['width']);
        $this->assertSame(100, $result['height']);

        @unlink($jpeg);
    }

    private function makeTransparentPng(): string
    {
        $path = sys_get_temp_dir().'/abcars_opt_'.uniqid().'.png';
        $im = imagecreatetruecolor(64, 64);
        imagesavealpha($im, true);
        $transparent = imagecolorallocatealpha($im, 0, 0, 0, 127);
        imagefill($im, 0, 0, $transparent);
        $red = imagecolorallocatealpha($im, 220, 40, 40, 0);
        imagefilledellipse($im, 32, 32, 40, 40, $red);
        imagepng($im, $path);
        imagedestroy($im);

        return $path;
    }

    private function makeWideJpeg(int $w, int $h): string
    {
        $path = sys_get_temp_dir().'/abcars_opt_'.uniqid().'.jpg';
        $im = imagecreatetruecolor($w, $h);
        $bg = imagecolorallocate($im, 30, 30, 30);
        imagefill($im, 0, 0, $bg);
        imagejpeg($im, $path, 90);
        imagedestroy($im);

        return $path;
    }
}
