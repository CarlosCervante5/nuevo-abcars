<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'ask_information';

        if (! Schema::hasTable($tableName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (! Schema::hasColumn($tableName, 'name')) {
                $table->string('name')->nullable();
            }
            if (! Schema::hasColumn($tableName, 'lastname')) {
                $table->string('lastname')->nullable();
            }
            if (! Schema::hasColumn($tableName, 'email')) {
                $table->string('email')->nullable();
            }
            if (! Schema::hasColumn($tableName, 'phone_1')) {
                $table->string('phone_1')->nullable();
            }
            if (! Schema::hasColumn($tableName, 'vehicle_name')) {
                $table->string('vehicle_name')->nullable();
            }
            if (! Schema::hasColumn($tableName, 'dealership_name')) {
                $table->string('dealership_name')->nullable();
            }
        });
    }

    public function down(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'ask_information';

        if (! Schema::hasTable($tableName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            foreach (['dealership_name', 'vehicle_name', 'phone_1', 'email', 'lastname', 'name'] as $col) {
                if (Schema::hasColumn($tableName, $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
