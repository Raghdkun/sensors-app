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
        Schema::create('sensor_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_device_id')->constrained()->cascadeOnDelete();
            $table->string('device_id');            // YoSmart deviceId (denormalized for quick queries)
            $table->string('device_type');           // e.g. THSensor, DoorSensor
            $table->string('device_name');
            $table->boolean('online')->default(false);

            // Sensor readings (nullable – not all device types emit all values)
            $table->decimal('temperature', 6, 2)->nullable();
            $table->string('temperature_unit', 1)->nullable();   // 'f' or 'c'
            $table->decimal('humidity', 5, 2)->nullable();
            $table->integer('battery_level')->nullable();         // 0-4
            $table->boolean('alarm')->nullable();                 // leak / door / motion alarm
            $table->string('state', 50)->nullable();              // e.g. 'open', 'closed', 'normal'

            // Raw JSON blob for any extra fields the device returns
            $table->json('raw_state')->nullable();

            $table->timestamp('reported_at')->nullable();         // device-reported timestamp
            $table->timestamp('recorded_at')->useCurrent();       // our snapshot timestamp
            $table->timestamps();

            // Indexes for efficient report queries
            $table->index(['store_id', 'recorded_at']);
            $table->index(['store_device_id', 'recorded_at']);
            $table->index(['device_type', 'recorded_at']);
            $table->index('recorded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sensor_reports');
    }
};
