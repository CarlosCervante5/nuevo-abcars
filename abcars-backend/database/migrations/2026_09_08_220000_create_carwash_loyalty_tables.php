<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');

        Schema::create($prefix.'carwash_loyalty_cards', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('customer_phone', 32)->unique();
            $table->string('customer_name')->nullable();
            $table->unsignedTinyInteger('stamps_count')->default(0);
            $table->unsignedInteger('completed_cycles')->default(0);
            $table->timestamp('last_stamp_at')->nullable();
            $table->timestamp('reward_ready_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create($prefix.'carwash_loyalty_stamps', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('loyalty_card_id')->constrained($prefix.'carwash_loyalty_cards')->cascadeOnDelete();
            $table->unsignedBigInteger('appointment_id')->nullable()->unique();
            $table->unsignedTinyInteger('cycle_number')->default(1);
            $table->string('source', 32)->default('delivered');
            $table->timestamps();

            $table->index(['loyalty_card_id', 'cycle_number']);
        });
    }

    public function down(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');
        Schema::dropIfExists($prefix.'carwash_loyalty_stamps');
        Schema::dropIfExists($prefix.'carwash_loyalty_cards');
    }
};
