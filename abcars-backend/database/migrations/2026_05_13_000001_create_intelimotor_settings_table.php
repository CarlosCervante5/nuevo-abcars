<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'intelimotor_settings';

        if (Schema::hasTable($tableName)) {
            return;
        }

        Schema::create($tableName, function (Blueprint $table) {
            $table->id();
            $table->text('api_key')->nullable();
            $table->text('api_secret')->nullable();
            $table->string('business_unit_id')->nullable();
            $table->string('base_url')->default('https://app.intelimotor.com/api');
            $table->boolean('is_enabled')->default(false);
            $table->timestamp('last_connection_at')->nullable();
            $table->string('last_connection_status', 32)->nullable();
            $table->text('last_connection_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(env('DB_TABLE_PREFIX', '') . 'intelimotor_settings');
    }
};
