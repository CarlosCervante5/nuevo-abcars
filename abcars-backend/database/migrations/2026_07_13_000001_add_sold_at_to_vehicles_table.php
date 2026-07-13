<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $table = env('DB_TABLE_PREFIX', '') . 'vehicles';

        Schema::table($table, function (Blueprint $blueprint) {
            $blueprint->timestamp('sold_at')->nullable()->after('page_status_manual_at');
        });

        // Historial: vehículos ya en sale obtienen sold_at aproximado para el cron.
        DB::table($table)
            ->where('page_status', 'sale')
            ->whereNull('sold_at')
            ->update([
                'sold_at' => DB::raw('COALESCE(intelimotor_synced_at, updated_at, created_at)'),
            ]);
    }

    public function down(): void
    {
        Schema::table(env('DB_TABLE_PREFIX', '') . 'vehicles', function (Blueprint $table) {
            $table->dropColumn('sold_at');
        });
    }
};
