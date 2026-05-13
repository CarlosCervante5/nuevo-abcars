<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'vehicles';

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (! Schema::hasColumn($tableName, 'intelimotor_unit_id')) {
                $table->string('intelimotor_unit_id', 64)->nullable()->unique()->after('uuid');
            }
            if (! Schema::hasColumn($tableName, 'intelimotor_ref')) {
                $table->string('intelimotor_ref', 128)->nullable()->index()->after('intelimotor_unit_id');
            }
            if (! Schema::hasColumn($tableName, 'intelimotor_synced_at')) {
                $table->timestamp('intelimotor_synced_at')->nullable()->after('intelimotor_ref');
            }
        });
    }

    public function down(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'vehicles';

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (Schema::hasColumn($tableName, 'intelimotor_synced_at')) {
                $table->dropColumn('intelimotor_synced_at');
            }
            if (Schema::hasColumn($tableName, 'intelimotor_ref')) {
                $table->dropColumn('intelimotor_ref');
            }
            if (Schema::hasColumn($tableName, 'intelimotor_unit_id')) {
                $table->dropColumn('intelimotor_unit_id');
            }
        });
    }
};
