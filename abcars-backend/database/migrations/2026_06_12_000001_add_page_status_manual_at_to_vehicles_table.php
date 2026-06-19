<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(env('DB_TABLE_PREFIX', '') . 'vehicles', function (Blueprint $table) {
            $table->timestamp('page_status_manual_at')->nullable()->after('page_status');
        });
    }

    public function down(): void
    {
        Schema::table(env('DB_TABLE_PREFIX', '') . 'vehicles', function (Blueprint $table) {
            $table->dropColumn('page_status_manual_at');
        });
    }
};
