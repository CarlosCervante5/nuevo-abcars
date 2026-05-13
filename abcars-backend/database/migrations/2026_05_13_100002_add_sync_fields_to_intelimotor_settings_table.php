<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'intelimotor_settings';

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (! Schema::hasColumn($tableName, 'default_dealership_id')) {
                $table->unsignedBigInteger('default_dealership_id')->nullable()->after('business_unit_id');
            }
            if (! Schema::hasColumn($tableName, 'last_sync_at')) {
                $table->timestamp('last_sync_at')->nullable()->after('last_connection_message');
            }
            if (! Schema::hasColumn($tableName, 'last_sync_summary')) {
                $table->text('last_sync_summary')->nullable()->after('last_sync_at');
            }
        });
    }

    public function down(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'intelimotor_settings';

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            foreach (['last_sync_summary', 'last_sync_at', 'default_dealership_id'] as $column) {
                if (Schema::hasColumn($tableName, $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
