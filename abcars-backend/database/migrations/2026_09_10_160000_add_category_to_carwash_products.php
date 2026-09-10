<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '').'carwash_products';

        if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'category')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table->string('category', 32)->default('amenity')->after('sku')->index();
        });
    }

    public function down(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '').'carwash_products';

        if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'category')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
