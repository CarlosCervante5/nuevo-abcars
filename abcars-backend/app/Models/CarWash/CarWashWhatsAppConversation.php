<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class CarWashWhatsAppConversation extends Model
{
    use SoftDeletes;

    protected $table;

    protected $fillable = [
        'phone', 'customer_name', 'status', 'last_message_at', 'needs_human', 'meta',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'needs_human' => 'boolean',
        'meta' => 'array',
    ];

    protected $hidden = ['id', 'deleted_at'];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '').'carwash_whatsapp_conversations';
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Uuid::uuid4();
            }
        });
    }

    public static function findByUuid(string $uuid): ?static
    {
        return static::query()->where('uuid', $uuid)->first();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CarWashWhatsAppMessage::class, 'conversation_id');
    }
}
