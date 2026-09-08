<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');

        Schema::table($prefix.'carwash_appointments', function (Blueprint $table) use ($prefix) {
            if (! Schema::hasColumn($prefix.'carwash_appointments', 'order_type')) {
                $table->string('order_type', 32)->default('public')->index()->after('channel');
            }
            if (! Schema::hasColumn($prefix.'carwash_appointments', 'vehicle_vin')) {
                $table->string('vehicle_vin', 32)->nullable()->index()->after('vehicle_color');
            }
            if (! Schema::hasColumn($prefix.'carwash_appointments', 'vehicle_condition')) {
                $table->string('vehicle_condition', 16)->nullable()->after('vehicle_vin'); // new | used
            }
            if (! Schema::hasColumn($prefix.'carwash_appointments', 'vin_validation_status')) {
                $table->string('vin_validation_status', 16)->default('skipped')->after('vehicle_condition');
            }
            if (! Schema::hasColumn($prefix.'carwash_appointments', 'vin_validated_at')) {
                $table->timestamp('vin_validated_at')->nullable()->after('vin_validation_status');
            }
            if (! Schema::hasColumn($prefix.'carwash_appointments', 'requested_by_name')) {
                $table->string('requested_by_name')->nullable()->after('vin_validated_at');
            }
        });

        Schema::table($prefix.'carwash_orders', function (Blueprint $table) use ($prefix) {
            if (! Schema::hasColumn($prefix.'carwash_orders', 'order_type')) {
                $table->string('order_type', 32)->default('public')->index()->after('status');
            }
            if (! Schema::hasColumn($prefix.'carwash_orders', 'vehicle_vin')) {
                $table->string('vehicle_vin', 32)->nullable()->index()->after('customer_phone');
            }
            if (! Schema::hasColumn($prefix.'carwash_orders', 'vehicle_condition')) {
                $table->string('vehicle_condition', 16)->nullable()->after('vehicle_vin');
            }
        });
    }

    public function down(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');

        Schema::table($prefix.'carwash_appointments', function (Blueprint $table) use ($prefix) {
            foreach ([
                'order_type', 'vehicle_vin', 'vehicle_condition',
                'vin_validation_status', 'vin_validated_at', 'requested_by_name',
            ] as $col) {
                if (Schema::hasColumn($prefix.'carwash_appointments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table($prefix.'carwash_orders', function (Blueprint $table) use ($prefix) {
            foreach (['order_type', 'vehicle_vin', 'vehicle_condition'] as $col) {
                if (Schema::hasColumn($prefix.'carwash_orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
