<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'vehicles';

        DB::statement(
            "ALTER TABLE `{$tableName}` MODIFY COLUMN `category` ENUM('new','pre_owned','demo','consignment') NULL DEFAULT NULL"
        );
    }

    public function down(): void
    {
        $tableName = env('DB_TABLE_PREFIX', '') . 'vehicles';

        DB::statement(
            "ALTER TABLE `{$tableName}` MODIFY COLUMN `category` ENUM('new','pre_owned','demo') NULL DEFAULT NULL"
        );
    }
};
