<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');

        Schema::create($prefix.'carwash_locations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('code')->nullable();
            $table->unsignedBigInteger('dealership_id')->nullable()->index();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('open_hours')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_service_types', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('duration_minutes')->default(60);
            $table->decimal('price', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_bays', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('location_id')->index();
            $table->string('name');
            $table->string('code')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_washers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->unsignedBigInteger('location_id')->nullable()->index();
            $table->string('display_name');
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_products', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('sku')->nullable()->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('image_path')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_appointments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('location_id')->index();
            $table->unsignedBigInteger('service_type_id')->index();
            $table->unsignedBigInteger('bay_id')->nullable()->index();
            $table->unsignedBigInteger('washer_id')->nullable()->index();
            $table->string('customer_name');
            $table->string('customer_phone', 32)->index();
            $table->string('vehicle_plates', 32)->nullable()->index();
            $table->string('vehicle_brand')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_color')->nullable();
            $table->string('status', 32)->default('scheduled')->index();
            $table->string('channel', 32)->default('admin')->index();
            $table->timestamp('scheduled_start_at')->nullable()->index();
            $table->timestamp('scheduled_end_at')->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('quoted_price', 12, 2)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_appointment_status_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('appointment_id')->index();
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32);
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('source', 64)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create($prefix.'carwash_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('location_id')->index();
            $table->unsignedBigInteger('appointment_id')->nullable()->index();
            $table->unsignedBigInteger('cashier_user_id')->nullable()->index();
            $table->string('status', 32)->default('open')->index();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone', 32)->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('payment_method', 32)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_order_items', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('order_id')->index();
            $table->string('item_type', 32); // service | product
            $table->unsignedBigInteger('item_id')->nullable();
            $table->string('name');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create($prefix.'carwash_whatsapp_conversations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('phone', 32)->unique();
            $table->string('customer_name')->nullable();
            $table->string('status', 32)->default('open')->index();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->boolean('needs_human')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('conversation_id')->index();
            $table->string('direction', 16); // inbound | outbound
            $table->string('twilio_sid')->nullable()->unique();
            $table->text('body')->nullable();
            $table->string('status', 32)->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });

        Schema::create($prefix.'carwash_notification_outbox', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('appointment_id')->nullable()->index();
            $table->string('channel', 32)->default('whatsapp');
            $table->string('to_phone', 32);
            $table->string('template_key', 64)->nullable();
            $table->text('body');
            $table->string('status', 32)->default('pending')->index();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->text('last_error')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        Schema::dropIfExists($prefix.'carwash_notification_outbox');
        Schema::dropIfExists($prefix.'carwash_whatsapp_messages');
        Schema::dropIfExists($prefix.'carwash_whatsapp_conversations');
        Schema::dropIfExists($prefix.'carwash_order_items');
        Schema::dropIfExists($prefix.'carwash_orders');
        Schema::dropIfExists($prefix.'carwash_appointment_status_logs');
        Schema::dropIfExists($prefix.'carwash_appointments');
        Schema::dropIfExists($prefix.'carwash_products');
        Schema::dropIfExists($prefix.'carwash_washers');
        Schema::dropIfExists($prefix.'carwash_bays');
        Schema::dropIfExists($prefix.'carwash_service_types');
        Schema::dropIfExists($prefix.'carwash_locations');
    }
};
