<?php

namespace Tests\Unit;

use App\Services\Intelimotor\IntelimotorPictureUrlTransformer;
use PHPUnit\Framework\TestCase;

class IntelimotorPictureUrlTransformerTest extends TestCase
{
    public function test_inserts_flatten_segment_after_cloudinary_upload(): void
    {
        $in = 'https://res.cloudinary.com/demo/image/upload/v1693497123/abcars_images/uuid/photo.png';
        $out = IntelimotorPictureUrlTransformer::forPush($in, 'fafbfc');

        $this->assertStringContainsString('/image/upload/f_jpg,q_auto,b_rgb%3Afafbfc/', $out);
        $this->assertStringEndsWith('v1693497123/abcars_images/uuid/photo.png', $out);
    }

    public function test_chains_with_existing_transformations(): void
    {
        $in = 'https://res.cloudinary.com/x/image/upload/w_400,h_300,c_fill/v1/sample/file';
        $out = IntelimotorPictureUrlTransformer::forPush($in, 'e8ebef');

        $this->assertStringContainsString('f_jpg,q_auto,b_rgb%3Ae8ebef/', $out);
        $this->assertStringContainsString('w_400,h_300,c_fill/', $out);
    }

    public function test_does_not_modify_non_cloudinary_urls(): void
    {
        $in = 'https://cdn.example.com/vehicles/photo.jpg';
        $this->assertSame($in, IntelimotorPictureUrlTransformer::forPush($in));
    }

    public function test_does_not_modify_signed_cloudinary_urls(): void
    {
        $in = 'https://res.cloudinary.com/demo/image/upload/s--abc123--/folder/x.jpg';
        $this->assertSame($in, IntelimotorPictureUrlTransformer::forPush($in));
    }

    public function test_idempotent_second_call(): void
    {
        $once = IntelimotorPictureUrlTransformer::forPush(
            'https://res.cloudinary.com/c/image/upload/v1/a/b.png',
            'fafbfc'
        );
        $twice = IntelimotorPictureUrlTransformer::forPush($once, 'fafbfc');
        $this->assertSame($once, $twice);
    }

    /** URLs ya generadas con ':' siguen siendo reconocidas como aplanadas (no duplicar segmento). */
    public function test_colon_background_syntax_is_idempotent(): void
    {
        $withColon = 'https://res.cloudinary.com/dpaoahbcf/image/upload/f_jpg,q_auto,b_rgb:fafbfc/v1778862922/abcars_vehicles_sandbox/uuid/1778862921_27.jpg';
        $this->assertSame($withColon, IntelimotorPictureUrlTransformer::forPush($withColon));
    }
}
