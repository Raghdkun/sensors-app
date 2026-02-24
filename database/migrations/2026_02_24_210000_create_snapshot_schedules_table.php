<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('snapshot_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('interval_minutes')->default(60);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->unsignedInteger('total_runs')->default(0);
            $table->unsignedInteger('consecutive_failures')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->unique('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('snapshot_schedules');
    }
};
