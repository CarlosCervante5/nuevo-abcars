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
        Schema::create(env('DB_TABLE_PREFIX_STREGA', '') . 'activity_responses', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->text('content');
            $table->string('file_path');
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('activity_id')->nullable()->constrained(env('DB_TABLE_PREFIX_STREGA', '') . 'user_activities')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(env('DB_TABLE_PREFIX_STREGA', '') . 'activity_responses');
    }
};
