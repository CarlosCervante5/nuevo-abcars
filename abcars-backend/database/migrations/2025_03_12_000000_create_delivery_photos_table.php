<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(env('DB_TABLE_PREFIX', '') . 'delivery_photos', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('service_image_url')->nullable();
            $table->string('service_public_id')->nullable();
            $table->string('caption')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(env('DB_TABLE_PREFIX', '') . 'delivery_photos');
    }
};
