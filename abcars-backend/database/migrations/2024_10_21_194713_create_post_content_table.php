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
        Schema::create(env('DB_TABLE_PREFIX', '') . 'post_contents', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->integer('sort_id',false,true)->nullable();
            $table->string('content_type')->nullable();
            $table->longText('content_text')->nullable();
            $table->string('content_multimedia_1')->nullable();
            $table->string('content_multimedia_2')->nullable();
            $table->string('multimedia_name_1')->nullable();
            $table->string('multimedia_name_2')->nullable();
            $table->foreignId('post_id')->nullable()->constrained(env('DB_TABLE_PREFIX', '') . 'marketing_posts')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(env('DB_TABLE_PREFIX', '') . 'post_contents');
    }
};
