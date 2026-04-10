<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'vehicles';

        if (! Schema::hasTable($tableName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (! Schema::hasColumn($tableName, 'engine_displacement_cc')) {
                $table->unsignedInteger('engine_displacement_cc')->nullable()->after('cylinders');
            }
            if (! Schema::hasColumn($tableName, 'wet_weight_kg')) {
                $table->unsignedInteger('wet_weight_kg')->nullable()->after('engine_displacement_cc');
            }
        });
    }

    public function down(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'vehicles';

        if (! Schema::hasTable($tableName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (Schema::hasColumn($tableName, 'wet_weight_kg')) {
                $table->dropColumn('wet_weight_kg');
            }
            if (Schema::hasColumn($tableName, 'engine_displacement_cc')) {
                $table->dropColumn('engine_displacement_cc');
            }
        });
    }
};
