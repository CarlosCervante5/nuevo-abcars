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
        Schema::create(env('DB_TABLE_PREFIX_STREGA', '') . 'user_activity', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assigner_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('receptor_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
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
        Schema::dropIfExists(env('DB_TABLE_PREFIX_STREGA', '') . 'user_activity');
    }
};
