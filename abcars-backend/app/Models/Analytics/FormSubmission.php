<?php

namespace App\Models\Analytics;

use Illuminate\Database\Eloquent\Model;

class FormSubmission extends Model
{
    protected $table;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '') . 'analytics_form_submissions';
    }

    protected $fillable = [
        'form_type',
        'metadata',
        'ip',
        'user_agent',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}
