<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(env('DB_TABLE_PREFIX', '') . 'customer_appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('referrer_user_id')->nullable()->after('vehicle_id');
            $table->foreign('referrer_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table(env('DB_TABLE_PREFIX', '') . 'customer_appointments', function (Blueprint $table) {
            $table->dropForeign(['referrer_user_id']);
        });
    }
};
