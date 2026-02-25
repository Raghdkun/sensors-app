<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Convert snapshot_schedules from per-store rows to a single global schedule.
     * We drop the store_id FK + unique constraint and make store_id nullable
     * so the table holds exactly one row (the global settings).
     */
    public function up(): void
    {
        Schema::table('snapshot_schedules', function (Blueprint $table) {
            // Drop the FK and unique constraint before modifying the column
            $table->dropForeign(['store_id']);
            $table->dropUnique(['store_id']);

            // Make store_id nullable so the global record doesn't need one
            $table->unsignedBigInteger('store_id')->nullable()->change();
        });

        // Wipe any per-store rows — keeps only the first (or none); a fresh
        // global record will be created the first time the UI is used.
        \DB::table('snapshot_schedules')->delete();
    }

    public function down(): void
    {
        Schema::table('snapshot_schedules', function (Blueprint $table) {
            $table->unsignedBigInteger('store_id')->nullable(false)->change();
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->unique('store_id');
        });
    }
};
