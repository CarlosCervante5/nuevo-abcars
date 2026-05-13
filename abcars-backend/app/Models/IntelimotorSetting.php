<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntelimotorSetting extends Model
{
    protected $table;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '') . 'intelimotor_settings';
    }

    protected $fillable = [
        'api_key',
        'api_secret',
        'business_unit_id',
        'default_dealership_id',
        'base_url',
        'is_enabled',
        'last_connection_at',
        'last_connection_status',
        'last_connection_message',
        'last_sync_at',
        'last_sync_summary',
    ];

    protected $casts = [
        'api_key' => 'encrypted',
        'api_secret' => 'encrypted',
        'is_enabled' => 'boolean',
        'last_connection_at' => 'datetime',
        'last_sync_at' => 'datetime',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'base_url' => config('services.intelimotor.base_url'),
            'is_enabled' => false,
        ]);
    }

    public function hasCredentials(): bool
    {
        return filled($this->api_key) && filled($this->api_secret);
    }

    public function maskedApiKey(): ?string
    {
        if (! $this->api_key) {
            return null;
        }

        $key = (string) $this->api_key;
        $length = strlen($key);

        if ($length <= 8) {
            return str_repeat('•', $length);
        }

        return str_repeat('•', $length - 4) . substr($key, -4);
    }

    public function maskedApiSecret(): ?string
    {
        if (! $this->api_secret) {
            return null;
        }

        $secret = (string) $this->api_secret;
        $length = strlen($secret);

        if ($length <= 8) {
            return str_repeat('•', $length);
        }

        return str_repeat('•', $length - 4) . substr($secret, -4);
    }
}
