<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        $table = $prefix.'carwash_customers';

        if (Schema::hasTable($table)) {
            return;
        }

        Schema::create($table, function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('customer_phone', 32)->unique();
            $table->string('customer_name')->nullable();
            $table->unsignedBigInteger('last_service_type_id')->nullable()->index();
            $table->string('last_service_name')->nullable();
            $table->string('last_service_code', 64)->nullable();
            $table->unsignedBigInteger('last_location_id')->nullable()->index();
            $table->string('last_location_name')->nullable();
            $table->string('last_vehicle_plates', 32)->nullable();
            $table->string('last_vehicle_brand')->nullable();
            $table->string('last_vehicle_model')->nullable();
            $table->unsignedBigInteger('last_appointment_id')->nullable();
            $table->timestamp('last_delivered_at')->nullable()->index();
            $table->unsignedInteger('visits_count')->default(0);
            $table->timestamp('last_rebook_offer_at')->nullable();
            $table->unsignedInteger('rebook_offers_count')->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        Schema::dropIfExists($prefix.'carwash_customers');
    }
};
