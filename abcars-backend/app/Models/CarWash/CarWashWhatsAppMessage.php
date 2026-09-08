<?php

namespace App\Models\CarWash;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class CarWashWhatsAppMessage extends Model
{
    protected $table;

    protected $fillable = [
        'conversation_id', 'direction', 'twilio_sid', 'body', 'status', 'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    protected $hidden = ['id'];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '').'carwash_whatsapp_messages';
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

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(CarWashWhatsAppConversation::class, 'conversation_id');
    }
}
