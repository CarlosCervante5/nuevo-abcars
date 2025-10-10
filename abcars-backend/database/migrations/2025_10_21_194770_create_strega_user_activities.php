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
        Schema::create(env('DB_TABLE_PREFIX_STREGA', '') . 'user_activities', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('name');
            $table->text('comments');
            $table->string('date_begin');
            $table->string('date_end');
            $table->string('type');
            $table->string('status');
            $table->string('categories');

            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->foreign('parent_id')->references('id')->on(env('DB_TABLE_PREFIX_STREGA', '') . 'user_activities')->onUpdate('cascade')->onDelete('set null');
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(env('DB_TABLE_PREFIX_STREGA', '') . 'user_activities');
    }
};
