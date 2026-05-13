<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntelimotorSchedulerSetting extends Model
{
    public const INTERVAL_OPTIONS = [15, 30, 60, 360, 720, 1440];

    protected $table;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '') . 'intelimotor_scheduler_settings';
    }

    protected $fillable = [
        'is_enabled',
        'interval_minutes',
        'sync_images',
        'last_run_at',
        'last_run_summary',
        'last_run_error',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'sync_images' => 'boolean',
        'last_run_at' => 'datetime',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'is_enabled' => false,
            'interval_minutes' => 60,
            'sync_images' => false,
        ]);
    }

    public function isDue(): bool
    {
        if (! $this->is_enabled) {
            return false;
        }

        if ($this->last_run_at === null) {
            return true;
        }

        return $this->last_run_at->copy()->addMinutes($this->interval_minutes)->isPast();
    }

    public function toPublicArray(): array
    {
        return [
            'is_enabled' => $this->is_enabled,
            'interval_minutes' => $this->interval_minutes,
            'sync_images' => $this->sync_images,
            'last_run_at' => $this->last_run_at?->toIso8601String(),
            'last_run_summary' => $this->last_run_summary
                ? json_decode($this->last_run_summary, true)
                : null,
            'last_run_error' => $this->last_run_error,
            'interval_options' => self::INTERVAL_OPTIONS,
        ];
    }
}
