<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $accountsTable = env('DB_TABLE_PREFIX', '') . 'intelimotor_accounts';
        $settingsTable = env('DB_TABLE_PREFIX', '') . 'intelimotor_settings';
        $vehiclesTable = env('DB_TABLE_PREFIX', '') . 'vehicles';
        $dealershipsTable = env('DB_TABLE_PREFIX', '') . 'dealerships';

        if (! Schema::hasTable($accountsTable)) {
            Schema::create($accountsTable, function (Blueprint $table) use ($dealershipsTable) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->string('name', 120);
                $table->text('api_key')->nullable();
                $table->text('api_secret')->nullable();
                $table->string('business_unit_id', 128)->nullable();
                $table->unsignedBigInteger('default_dealership_id')->nullable();
                $table->string('base_url')->default('https://app.intelimotor.com/api');
                $table->boolean('is_enabled')->default(true);
                $table->timestamp('last_connection_at')->nullable();
                $table->string('last_connection_status', 32)->nullable();
                $table->text('last_connection_message')->nullable();
                $table->timestamp('last_sync_at')->nullable();
                $table->text('last_sync_summary')->nullable();
                $table->timestamps();

                if (Schema::hasTable($dealershipsTable)) {
                    $table->foreign('default_dealership_id')
                        ->references('id')
                        ->on($dealershipsTable)
                        ->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable($settingsTable) && Schema::hasTable($accountsTable)) {
            $legacy = DB::table($settingsTable)->orderBy('id')->first();
            if ($legacy && DB::table($accountsTable)->count() === 0) {
                DB::table($accountsTable)->insert([
                    'uuid' => (string) \Ramsey\Uuid\Uuid::uuid4(),
                    'name' => 'Cuenta principal',
                    'api_key' => $legacy->api_key,
                    'api_secret' => $legacy->api_secret,
                    'business_unit_id' => $legacy->business_unit_id,
                    'default_dealership_id' => $legacy->default_dealership_id ?? null,
                    'base_url' => $legacy->base_url ?? 'https://app.intelimotor.com/api',
                    'is_enabled' => (bool) ($legacy->is_enabled ?? false),
                    'last_connection_at' => $legacy->last_connection_at,
                    'last_connection_status' => $legacy->last_connection_status,
                    'last_connection_message' => $legacy->last_connection_message,
                    'last_sync_at' => $legacy->last_sync_at ?? null,
                    'last_sync_summary' => $legacy->last_sync_summary ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if (Schema::hasTable($vehiclesTable) && ! Schema::hasColumn($vehiclesTable, 'intelimotor_account_id')) {
            Schema::table($vehiclesTable, function (Blueprint $table) use ($accountsTable, $vehiclesTable) {
                $table->unsignedBigInteger('intelimotor_account_id')->nullable()->after('intelimotor_unit_id');
                if (Schema::hasTable($accountsTable)) {
                    $table->foreign('intelimotor_account_id')
                        ->references('id')
                        ->on($accountsTable)
                        ->nullOnDelete();
                }
            });

            $firstAccountId = DB::table($accountsTable)->orderBy('id')->value('id');
            if ($firstAccountId) {
                DB::table($vehiclesTable)
                    ->whereNotNull('intelimotor_unit_id')
                    ->whereNull('intelimotor_account_id')
                    ->update(['intelimotor_account_id' => $firstAccountId]);
            }

            try {
                Schema::table($vehiclesTable, function (Blueprint $table) {
                    $table->dropUnique(['intelimotor_unit_id']);
                });
            } catch (\Throwable) {
                // Índice único puede tener otro nombre según el motor.
            }

            Schema::table($vehiclesTable, function (Blueprint $table) {
                $table->unique(['intelimotor_account_id', 'intelimotor_unit_id'], 'vehicles_intelimotor_account_unit_unique');
            });
        }
    }

    public function down(): void
    {
        $accountsTable = env('DB_TABLE_PREFIX', '') . 'intelimotor_accounts';
        $vehiclesTable = env('DB_TABLE_PREFIX', '') . 'vehicles';

        if (Schema::hasTable($vehiclesTable) && Schema::hasColumn($vehiclesTable, 'intelimotor_account_id')) {
            Schema::table($vehiclesTable, function (Blueprint $table) use ($vehiclesTable) {
                try {
                    $table->dropUnique('vehicles_intelimotor_account_unit_unique');
                } catch (\Throwable) {
                }
                $table->dropConstrainedForeignId('intelimotor_account_id');
            });
        }

        Schema::dropIfExists($accountsTable);
    }
};
