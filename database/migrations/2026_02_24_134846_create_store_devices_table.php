<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('store_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('device_id');       // YoSmart deviceId
            $table->string('device_token');    // YoSmart device token
            $table->string('device_type');     // e.g. Hub, THSensor
            $table->string('device_name');     // human-readable name
            $table->string('model_name')->nullable();
            $table->boolean('is_hub')->default(false);
            $table->timestamps();

            $table->unique(['store_id', 'device_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_devices');
    }
};
