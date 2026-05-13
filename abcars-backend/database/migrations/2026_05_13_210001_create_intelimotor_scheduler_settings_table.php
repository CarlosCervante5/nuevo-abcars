<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'intelimotor_scheduler_settings';

        if (Schema::hasTable($tableName)) {
            return;
        }

        Schema::create($tableName, function (Blueprint $table) {
            $table->id();
            $table->boolean('is_enabled')->default(false);
            $table->unsignedSmallInteger('interval_minutes')->default(60);
            $table->boolean('sync_images')->default(false);
            $table->timestamp('last_run_at')->nullable();
            $table->text('last_run_summary')->nullable();
            $table->text('last_run_error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(env('DB_TABLE_PREFIX', '') . 'intelimotor_scheduler_settings');
    }
};
