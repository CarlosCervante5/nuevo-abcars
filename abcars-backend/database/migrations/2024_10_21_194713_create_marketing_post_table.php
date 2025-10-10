<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create(env('DB_TABLE_PREFIX', '') . 'marketing_posts', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('status')->default('unpublished');
            $table->string('category')->default('uncategorized');
            $table->string('sub_category')->default('uncategorized');
            $table->string('key_words')->nullable();
            $table->string('title')->nullable();
            $table->string('image_path')->nullable();
            $table->string('url_name')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(env('DB_TABLE_PREFIX', '') . 'marketing_posts');
    }
};
