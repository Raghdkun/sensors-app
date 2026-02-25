<?php

namespace App\Http\Controllers;

use App\Models\SnapshotSchedule;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    /**
     * GET /api/reports/schedules
     *
     * Return the single global schedule (creates it if it does not exist yet).
     */
    public function index(): JsonResponse
    {
        $schedule     = SnapshotSchedule::global();
        $activeStores = Store::where('is_active', true)->count();

        return response()->json([
            'success'      => true,
            'schedule'     => $schedule,
            'active_stores' => $activeStores,
        ]);
    }

    /**
     * POST /api/reports/schedules
     *
     * Update the global schedule settings (interval + active state).
     */
    public function upsert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_active'        => 'required|boolean',
            'interval_minutes' => 'required|integer|min:5|max:1440',
        ]);

        $schedule = SnapshotSchedule::global();

        $schedule->update([
            'is_active'        => $validated['is_active'],
            'interval_minutes' => $validated['interval_minutes'],
            // Seed next_run_at so the first tick fires immediately
            'next_run_at'      => $validated['is_active'] ? now() : null,
        ]);

        return response()->json([
            'success'  => true,
            'schedule' => $schedule->fresh(),
        ]);
    }

    /**
     * PATCH /api/reports/schedules/toggle
     *
     * Quick active / paused toggle.
     */
    public function toggle(): JsonResponse
    {
        $schedule = SnapshotSchedule::global();

        $schedule->update([
            'is_active'   => ! $schedule->is_active,
            'next_run_at' => ! $schedule->is_active ? now() : null,
        ]);

        return response()->json([
            'success'  => true,
            'schedule' => $schedule->fresh(),
        ]);
    }

    /**
     * POST /api/reports/schedules/run-now
     *
     * Force an immediate capture for ALL active stores right now.
     */
    public function runNow(): JsonResponse
    {
        $schedule = SnapshotSchedule::global();

        $activeStores = Store::where('is_active', true)->with('devices')->get();

        if ($activeStores->isEmpty()) {
            return response()->json([
                'success' => false,
                'error'   => 'No active stores found.',
            ], 422);
        }

        try {
            $reportController = app(ReportController::class);
            $total            = 0;
            $errors           = [];

            foreach ($activeStores as $store) {
                $fakeRequest = Request::create('/api/reports/snapshot', 'POST', [
                    'store_id' => $store->id,
                ]);

                $response = $reportController->snapshot($fakeRequest);
                $data     = json_decode($response->getContent(), true);

                if ($data['success'] ?? false) {
                    $total += $data['count'];
                } else {
                    $errors[] = "{$store->store_name}: " . ($data['error'] ?? 'failed');
                }
            }

            if (! empty($errors)) {
                $schedule->markFailed(implode('; ', $errors));

                return response()->json([
                    'success' => false,
                    'error'   => implode('; ', $errors),
                    'count'   => $total,
                ], 207);
            }

            $schedule->markRanSuccessfully();

            return response()->json([
                'success' => true,
                'message' => "Captured {$total} device(s) across {$activeStores->count()} stores.",
                'count'   => $total,
            ]);
        } catch (\Throwable $e) {
            $schedule->markFailed($e->getMessage());

            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
