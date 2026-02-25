<?php

namespace App\Console\Commands;

use App\Http\Controllers\YoSmartController;
use App\Models\SensorReport;
use App\Models\SnapshotSchedule;
use App\Models\Store;
use App\Models\StoreDevice;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CaptureSnapshots extends Command
{
    /**
     * The name and signature of the console command.
     *
     * --force : Ignore schedule timing and run immediately
     */
    protected $signature = 'snapshots:capture
                            {--force : Ignore schedule timing and run immediately}';

    protected $description = 'Capture sensor snapshots for ALL active stores (global schedule)';

    public function handle(): int
    {
        $schedule = SnapshotSchedule::global();

        if (! $schedule->is_active && ! $this->option('force')) {
            $this->line('Global snapshot schedule is inactive — skipping.');
            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $schedule->isDue()) {
            $this->line("Next run scheduled for {$schedule->next_run_at}");
            return self::SUCCESS;
        }

        $this->info('📡 Running global snapshot for all active stores…');

        $stores = Store::where('is_active', true)->with('devices')->get();

        if ($stores->isEmpty()) {
            $this->warn('No active stores found.');
            $schedule->markRanSuccessfully();
            return self::SUCCESS;
        }

        $yosmart       = app(YoSmartController::class);
        $totalCaptured = 0;
        $failed        = 0;
        $errors        = [];

        foreach ($stores as $store) {
            $this->line("  → {$store->store_name} ({$store->store_number})");

            try {
                $count = $this->captureForStore($store, $yosmart);
                $totalCaptured += $count;
                $this->info("    ✅ {$count} device(s)");
            } catch (\Throwable $e) {
                $failed++;
                $errors[] = "{$store->store_name}: {$e->getMessage()}";
                $this->error("    ❌ {$e->getMessage()}");
            }
        }

        $this->newLine();
        $this->info("Done — {$totalCaptured} total device(s) captured across {$stores->count()} stores.");

        if ($failed > 0) {
            $schedule->markFailed(implode('; ', $errors));
            return self::FAILURE;
        }

        $schedule->markRanSuccessfully();
        return self::SUCCESS;
    }

    private function captureForStore($store, YoSmartController $yosmart): int
    {
        $count = 0;

        foreach ($store->devices as $device) {
            /** @var StoreDevice $device */
            $method = $device->device_type . '.getState';

            $result = $yosmart->callApi($method, [
                'targetDevice' => $device->device_id,
                'token'        => $device->device_token,
            ]);

            $success = $result && ($result['code'] ?? null) === '000000';
            $data    = $result['data'] ?? [];
            $state   = $data['state'] ?? [];

            SensorReport::create([
                'store_id'         => $store->id,
                'store_device_id'  => $device->id,
                'device_id'        => $device->device_id,
                'device_type'      => $device->device_type,
                'device_name'      => $device->device_name,
                'online'           => $data['online'] ?? false,
                'temperature'      => $state['temperature'] ?? $state['temp'] ?? null,
                'temperature_unit' => $state['mode'] ?? null,
                'humidity'         => $state['humidity'] ?? null,
                'battery_level'    => $state['battery'] ?? null,
                'alarm'            => self::parseAlarm($state['alarm'] ?? false),
                'state'            => is_array($state) ? ($state['state'] ?? null) : $state,
                'raw_state'        => $success ? $data : ['error' => $result['desc'] ?? 'unknown'],
                'reported_at'      => isset($data['reportAt']) ? Carbon::parse($data['reportAt']) : null,
                'recorded_at'      => now(),
            ]);

            $count++;
        }

        return $count;
    }

    private static function parseAlarm(mixed $alarm): bool
    {
        if (is_bool($alarm)) {
            return $alarm;
        }

        if (is_array($alarm)) {
            foreach ($alarm as $key => $val) {
                if ($key === 'code') {
                    continue;
                }
                if ($val === true) {
                    return true;
                }
            }

            return false;
        }

        return (bool) $alarm;
    }
}

    public function handle(): int
    {
        $this->info('🔍 Checking snapshot schedules…');

        $query = SnapshotSchedule::with('store.devices')->active();

        // Optionally filter to a single store
        if ($storeId = $this->option('store')) {
            $query->where('store_id', $storeId);
        }

        $schedules = $query->get();

        if ($schedules->isEmpty()) {
            $this->warn('No active snapshot schedules found.');
            return self::SUCCESS;
        }

        $force    = (bool) $this->option('force');
        $yosmart  = app(YoSmartController::class);
        $captured = 0;
        $skipped  = 0;
        $failed   = 0;

        foreach ($schedules as $schedule) {
            /** @var SnapshotSchedule $schedule */
            $store = $schedule->store;

            if (! $store || ! $store->is_active) {
                $this->line("  ⏭  Store #{$schedule->store_id} is inactive — skipping");
                $skipped++;
                continue;
            }

            if (! $force && ! $schedule->isDue()) {
                $this->line("  ⏳ {$store->store_name} — next run at {$schedule->next_run_at}");
                $skipped++;
                continue;
            }

            $this->line("  📡 Capturing snapshot for {$store->store_name} ({$store->store_number})…");

            try {
                $count = $this->captureForStore($store, $yosmart);
                $schedule->markRanSuccessfully();
                $this->info("     ✅ {$count} device(s) captured");
                $captured++;
            } catch (\Throwable $e) {
                $schedule->markFailed($e->getMessage());
                $this->error("     ❌ Failed: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Done — captured: {$captured}, skipped: {$skipped}, failed: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Capture live sensor data for every device in a store.
     */
    private function captureForStore($store, YoSmartController $yosmart): int
    {
        $count = 0;

        foreach ($store->devices as $device) {
            /** @var StoreDevice $device */
            $method = $device->device_type . '.getState';

            $result = $yosmart->callApi($method, [
                'targetDevice' => $device->device_id,
                'token'        => $device->device_token,
            ]);

            $success = $result && ($result['code'] ?? null) === '000000';
            $data    = $result['data'] ?? [];
            $state   = $data['state'] ?? [];

            SensorReport::create([
                'store_id'         => $store->id,
                'store_device_id'  => $device->id,
                'device_id'        => $device->device_id,
                'device_type'      => $device->device_type,
                'device_name'      => $device->device_name,
                'online'           => $data['online'] ?? false,
                'temperature'      => $state['temperature'] ?? $state['temp'] ?? null,
                'temperature_unit' => $state['mode'] ?? null,
                'humidity'         => $state['humidity'] ?? null,
                'battery_level'    => $state['battery'] ?? null,
                'alarm'            => self::parseAlarm($state['alarm'] ?? false),
                'state'            => is_array($state) ? ($state['state'] ?? null) : $state,
                'raw_state'        => $success ? $data : ['error' => $result['desc'] ?? 'unknown'],
                'reported_at'      => isset($data['reportAt']) ? Carbon::parse($data['reportAt']) : null,
                'recorded_at'      => now(),
            ]);

            $count++;
        }

        return $count;
    }

    /**
     * Extract a boolean from the YoSmart alarm field
     * (may be bool, object with flags, or numeric).
     */
    private static function parseAlarm(mixed $alarm): bool
    {
        if (is_bool($alarm)) {
            return $alarm;
        }

        if (is_array($alarm)) {
            foreach ($alarm as $key => $val) {
                if ($key === 'code') {
                    continue;
                }
                if ($val === true) {
                    return true;
                }
            }

            return false;
        }

        return (bool) $alarm;
    }
}
