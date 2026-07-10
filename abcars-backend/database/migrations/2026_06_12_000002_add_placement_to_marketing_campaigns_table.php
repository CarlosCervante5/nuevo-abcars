<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(env('DB_TABLE_PREFIX', '') . 'marketing_campaigns', function (Blueprint $table) {
            $table->string('placement', 32)->default('showroom')->after('category');
        });
    }

    public function down(): void
    {
        Schema::table(env('DB_TABLE_PREFIX', '') . 'marketing_campaigns', function (Blueprint $table) {
            $table->dropColumn('placement');
        });
    }
};
