<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sandbox/producción: si la migración 2025_01_29_000001 falló (p. ej. FK a tabla users),
 * la columna referrer_user_id no existe y /api/seller/referral-stats responde 500.
 */
return new class extends Migration
{
    public function up(): void
    {
        $table = env('DB_TABLE_PREFIX', '') . 'customer_appointments';
        if (! Schema::hasTable($table) || Schema::hasColumn($table, 'referrer_user_id')) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) {
            $blueprint->unsignedBigInteger('referrer_user_id')->nullable()->after('vehicle_id');
        });
    }

    public function down(): void
    {
        $table = env('DB_TABLE_PREFIX', '') . 'customer_appointments';
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'referrer_user_id')) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) {
            $blueprint->dropColumn('referrer_user_id');
        });
    }
};
