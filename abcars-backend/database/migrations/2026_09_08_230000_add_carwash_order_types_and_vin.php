<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        $appointments = $prefix.'carwash_appointments';
        $orders = $prefix.'carwash_orders';

        if (Schema::hasTable($appointments)) {
            $this->addColumnIfMissing($appointments, 'order_type', function (Blueprint $table) {
                $table->string('order_type', 32)->default('public')->index()->after('channel');
            });
            $this->addColumnIfMissing($appointments, 'vehicle_vin', function (Blueprint $table) {
                $table->string('vehicle_vin', 32)->nullable()->index()->after('vehicle_color');
            });
            $this->addColumnIfMissing($appointments, 'vehicle_condition', function (Blueprint $table) {
                $table->string('vehicle_condition', 16)->nullable()->after('vehicle_vin');
            });
            $this->addColumnIfMissing($appointments, 'vin_validation_status', function (Blueprint $table) {
                $table->string('vin_validation_status', 16)->default('skipped')->after('vehicle_condition');
            });
            $this->addColumnIfMissing($appointments, 'vin_validated_at', function (Blueprint $table) {
                $table->timestamp('vin_validated_at')->nullable()->after('vin_validation_status');
            });
            $this->addColumnIfMissing($appointments, 'requested_by_name', function (Blueprint $table) {
                $table->string('requested_by_name')->nullable()->after('vin_validated_at');
            });
        }

        if (Schema::hasTable($orders)) {
            $this->addColumnIfMissing($orders, 'order_type', function (Blueprint $table) {
                $table->string('order_type', 32)->default('public')->index()->after('status');
            });
            $this->addColumnIfMissing($orders, 'vehicle_vin', function (Blueprint $table) {
                $table->string('vehicle_vin', 32)->nullable()->index()->after('customer_phone');
            });
            $this->addColumnIfMissing($orders, 'vehicle_condition', function (Blueprint $table) {
                $table->string('vehicle_condition', 16)->nullable()->after('vehicle_vin');
            });
        }
    }

    public function down(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        $appointments = $prefix.'carwash_appointments';
        $orders = $prefix.'carwash_orders';

        if (Schema::hasTable($appointments)) {
            foreach ([
                'order_type', 'vehicle_vin', 'vehicle_condition',
                'vin_validation_status', 'vin_validated_at', 'requested_by_name',
            ] as $col) {
                if (Schema::hasColumn($appointments, $col)) {
                    Schema::table($appointments, function (Blueprint $table) use ($col) {
                        $table->dropColumn($col);
                    });
                }
            }
        }

        if (Schema::hasTable($orders)) {
            foreach (['order_type', 'vehicle_vin', 'vehicle_condition'] as $col) {
                if (Schema::hasColumn($orders, $col)) {
                    Schema::table($orders, function (Blueprint $table) use ($col) {
                        $table->dropColumn($col);
                    });
                }
            }
        }
    }

    private function addColumnIfMissing(string $table, string $column, callable $definition): void
    {
        if (Schema::hasColumn($table, $column)) {
            return;
        }

        Schema::table($table, $definition);
    }
};
