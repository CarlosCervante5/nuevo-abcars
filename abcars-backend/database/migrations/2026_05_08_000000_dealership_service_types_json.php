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
            $table->json('service_types')->nullable()->after('location');
        });

        $prefix = env('DB_TABLE_PREFIX', '');
        $rows = DB::table($prefix . 'dealerships')->select('id', 'service_type')->get();
        foreach ($rows as $row) {
            $st = strtolower(trim((string) ($row->service_type ?? 'venta')));
            if (! in_array($st, ['venta', 'servicios', 'valuaciones'], true)) {
                $st = 'venta';
            }
            DB::table($prefix . 'dealerships')
                ->where('id', $row->id)
                ->update(['service_types' => json_encode([$st])]);
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table->dropColumn('service_type');
        });
    }

    public function down(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'dealerships';

        Schema::table($tableName, function (Blueprint $table) {
            $table->string('service_type', 32)->default('venta')->after('location');
        });

        $prefix = env('DB_TABLE_PREFIX', '');
        $rows = DB::table($prefix . 'dealerships')->select('id', 'service_types')->get();
        foreach ($rows as $row) {
            $decoded = json_decode((string) $row->service_types, true);
            $first = is_array($decoded) && count($decoded) > 0
                ? strtolower((string) $decoded[0])
                : 'venta';
            if (! in_array($first, ['venta', 'servicios'], true)) {
                $first = 'venta';
            }
            DB::table($prefix . 'dealerships')
                ->where('id', $row->id)
                ->update(['service_type' => $first]);
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table->dropColumn('service_types');
        });
    }
};
