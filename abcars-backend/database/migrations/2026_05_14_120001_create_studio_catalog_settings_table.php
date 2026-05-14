<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'studio_catalog_settings';

        if (Schema::hasTable($tableName)) {
            return;
        }

        Schema::create($tableName, function (Blueprint $table) {
            $table->id();
            $table->string('cyclorama_image_url', 512)->nullable();
            $table->string('cyclorama_public_id', 256)->nullable();
            $table->unsignedSmallInteger('width')->default(2048);
            $table->unsignedSmallInteger('height')->default(1536);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(env('DB_TABLE_PREFIX', '') . 'studio_catalog_settings');
    }
};
