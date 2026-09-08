<?php

namespace App\Models\CarWash;

class CarWashSetting extends CarWashModel
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    protected $hidden = ['id'];

    protected function tableSuffix(): string
    {
        return 'carwash_settings';
    }

    public static function getJson(string $key, array $default = []): array
    {
        $row = static::query()->where('key', $key)->first();
        if (! $row || ! is_array($row->value)) {
            return $default;
        }

        return $row->value;
    }

    public static function putJson(string $key, array $value): self
    {
        $row = static::query()->firstOrNew(['key' => $key]);
        $row->value = $value;
        $row->save();

        return $row;
    }
}
