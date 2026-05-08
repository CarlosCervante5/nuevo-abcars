<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        $profiles = $prefix.'user_profiles';
        $dealerships = $prefix.'dealerships';

        Schema::table($profiles, function (Blueprint $table) use ($profiles, $dealerships) {
            if (! Schema::hasColumn($profiles, 'dealership_id')) {
                $table->foreignId('dealership_id')
                    ->nullable()
                    ->after('location')
                    ->constrained($dealerships)
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        $profiles = $prefix.'user_profiles';

        Schema::table($profiles, function (Blueprint $table) use ($profiles) {
            if (Schema::hasColumn($profiles, 'dealership_id')) {
                $table->dropForeign(['dealership_id']);
                $table->dropColumn('dealership_id');
            }
        });
    }
};
