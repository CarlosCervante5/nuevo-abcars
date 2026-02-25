<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');

        Schema::create($prefix . 'analytics_page_views', function (Blueprint $table) {
            $table->id();
            $table->string('path', 500);
            $table->string('referrer', 500)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('session_id', 100)->nullable();
            $table->date('view_date');
            $table->timestamps();
        });

        Schema::create($prefix . 'analytics_form_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('form_type', 50);
            $table->json('metadata')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();
        });

        Schema::table($prefix . 'analytics_page_views', function (Blueprint $table) use ($prefix) {
            $table->index('view_date');
            $table->index('path');
        });
    }

    public function down(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        Schema::dropIfExists($prefix . 'analytics_page_views');
        Schema::dropIfExists($prefix . 'analytics_form_submissions');
    }
};
