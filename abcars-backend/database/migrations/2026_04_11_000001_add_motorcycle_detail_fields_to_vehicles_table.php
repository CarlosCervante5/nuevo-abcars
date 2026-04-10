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
            if (! Schema::hasColumn($tableName, 'motorcycle_brakes')) {
                $table->string('motorcycle_brakes', 255)->nullable()->after('wet_weight_kg');
            }
            if (! Schema::hasColumn($tableName, 'motorcycle_starting_system')) {
                $table->string('motorcycle_starting_system', 255)->nullable()->after('motorcycle_brakes');
            }
            if (! Schema::hasColumn($tableName, 'motorcycle_digital_dashboard')) {
                $table->string('motorcycle_digital_dashboard', 10)->nullable()->after('motorcycle_starting_system');
            }
            if (! Schema::hasColumn($tableName, 'motorcycle_engine_cycle')) {
                $table->string('motorcycle_engine_cycle', 100)->nullable()->after('motorcycle_digital_dashboard');
            }
            if (! Schema::hasColumn($tableName, 'motorcycle_power_hp')) {
                $table->decimal('motorcycle_power_hp', 8, 2)->nullable()->after('motorcycle_engine_cycle');
            }
            if (! Schema::hasColumn($tableName, 'motorcycle_max_speed_kmh')) {
                $table->unsignedInteger('motorcycle_max_speed_kmh')->nullable()->after('motorcycle_power_hp');
            }
            if (! Schema::hasColumn($tableName, 'motorcycle_suspension')) {
                $table->string('motorcycle_suspension', 255)->nullable()->after('motorcycle_max_speed_kmh');
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
            foreach ([
                'motorcycle_suspension',
                'motorcycle_max_speed_kmh',
                'motorcycle_power_hp',
                'motorcycle_engine_cycle',
                'motorcycle_digital_dashboard',
                'motorcycle_starting_system',
                'motorcycle_brakes',
            ] as $col) {
                if (Schema::hasColumn($tableName, $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
