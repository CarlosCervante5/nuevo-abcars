<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class IntelimotorAccount extends Model
{
    protected $table;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '') . 'intelimotor_accounts';
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model) {
            if (! filled($model->uuid)) {
                $model->uuid = (string) Uuid::uuid4();
            }
        });
    }

    protected $fillable = [
        'uuid',
        'name',
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

    public function hasCredentials(): bool
    {
        return filled($this->api_key) && filled($this->api_secret);
    }

    public function maskedApiKey(): ?string
    {
        return $this->maskSecret((string) $this->api_key);
    }

    public function maskedApiSecret(): ?string
    {
        return $this->maskSecret((string) $this->api_secret);
    }

    public function toPublicArray(): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'business_unit_id' => $this->business_unit_id,
            'default_dealership_id' => $this->default_dealership_id,
            'base_url' => $this->base_url,
            'is_enabled' => $this->is_enabled,
            'has_credentials' => $this->hasCredentials(),
            'api_key_masked' => $this->maskedApiKey(),
            'api_secret_masked' => $this->maskedApiSecret(),
            'last_connection_at' => $this->last_connection_at?->toIso8601String(),
            'last_connection_status' => $this->last_connection_status,
            'last_connection_message' => $this->last_connection_message,
            'last_sync_at' => $this->last_sync_at?->toIso8601String(),
            'last_sync_summary' => $this->last_sync_summary
                ? json_decode($this->last_sync_summary, true)
                : null,
        ];
    }

    private function maskSecret(?string $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        $length = strlen($value);

        if ($length <= 8) {
            return str_repeat('•', $length);
        }

        return str_repeat('•', $length - 4) . substr($value, -4);
    }
}
