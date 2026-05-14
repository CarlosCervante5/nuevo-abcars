<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudioCatalogSetting extends Model
{
    public const DEFAULT_WIDTH = 2048;

    public const DEFAULT_HEIGHT = 1536;

    protected $table;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '') . 'studio_catalog_settings';
    }

    protected $fillable = [
        'cyclorama_image_url',
        'cyclorama_public_id',
        'width',
        'height',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'width' => self::DEFAULT_WIDTH,
            'height' => self::DEFAULT_HEIGHT,
        ]);
    }

    public function usesDefaultBackground(): bool
    {
        return ! filled($this->cyclorama_image_url);
    }

    public function toPublicArray(): array
    {
        return [
            'cyclorama_image_url' => $this->cyclorama_image_url,
            'width' => (int) $this->width,
            'height' => (int) $this->height,
            'using_default' => $this->usesDefaultBackground(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
