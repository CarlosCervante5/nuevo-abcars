<?php

namespace App\Models\Analytics;

use Illuminate\Database\Eloquent\Model;

class PageView extends Model
{
    protected $table;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->table = env('DB_TABLE_PREFIX', '') . 'analytics_page_views';
    }

    protected $fillable = [
        'path',
        'referrer',
        'user_agent',
        'ip',
        'session_id',
        'view_date',
    ];

    protected $casts = [
        'view_date' => 'date',
    ];
}
