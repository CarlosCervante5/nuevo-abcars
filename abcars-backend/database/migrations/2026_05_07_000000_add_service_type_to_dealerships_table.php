<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'dealerships';

        Schema::table($tableName, function (Blueprint $table) {
            $table->string('service_type', 32)->default('venta')->after('location');
        });

        $prefix = env('DB_TABLE_PREFIX', '');
        // Heurística: sucursales de taller / servicio ya conocidas
        DB::table($prefix . 'dealerships')
            ->whereRaw('LOWER(name) LIKE ?', ['%service%'])
            ->update(['service_type' => 'servicios']);
    }

    public function down(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'dealerships';

        Schema::table($tableName, function (Blueprint $table) {
            $table->dropColumn('service_type');
        });
    }
};
