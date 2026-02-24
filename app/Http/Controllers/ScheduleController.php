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
     * List all snapshot schedules with their stores.
     */
    public function index(): JsonResponse
    {
        $schedules = SnapshotSchedule::with('store:id,store_number,store_name,is_active')
            ->orderBy('store_id')
            ->get();

        return response()->json([
            'success'   => true,
            'schedules' => $schedules,
        ]);
    }

    /**
     * POST /api/reports/schedules
     *
     * Create or update a schedule for a store.
     */
    public function upsert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id'         => 'required|integer|exists:stores,id',
            'is_active'        => 'required|boolean',
            'interval_minutes' => 'required|integer|min:5|max:1440',
        ]);

        $schedule = SnapshotSchedule::updateOrCreate(
            ['store_id' => $validated['store_id']],
            [
                'is_active'        => $validated['is_active'],
                'interval_minutes' => $validated['interval_minutes'],
                // When activating, seed next_run_at so it runs on the next scheduler tick
                'next_run_at'      => $validated['is_active'] ? now() : null,
            ],
        );

        $schedule->load('store:id,store_number,store_name,is_active');

        return response()->json([
            'success'  => true,
            'schedule' => $schedule,
        ]);
    }

    /**
     * PATCH /api/reports/schedules/{schedule}/toggle
     *
     * Quick toggle on/off.
     */
    public function toggle(SnapshotSchedule $schedule): JsonResponse
    {
        $schedule->update([
            'is_active'   => ! $schedule->is_active,
            'next_run_at' => ! $schedule->is_active ? now() : null,
        ]);

        $schedule->load('store:id,store_number,store_name,is_active');

        return response()->json([
            'success'  => true,
            'schedule' => $schedule,
        ]);
    }

    /**
     * DELETE /api/reports/schedules/{schedule}
     */
    public function destroy(SnapshotSchedule $schedule): JsonResponse
    {
        $schedule->delete();

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * POST /api/reports/schedules/{schedule}/run-now
     *
     * Force an immediate capture regardless of schedule timing.
     */
    public function runNow(SnapshotSchedule $schedule): JsonResponse
    {
        $store = $schedule->store;

        if (! $store || ! $store->is_active) {
            return response()->json([
                'success' => false,
                'error'   => 'Store is inactive.',
            ], 422);
        }

        try {
            // Reuse the snapshot logic from ReportController
            $reportController = app(ReportController::class);

            $fakeRequest = Request::create('/api/reports/snapshot', 'POST', [
                'store_id' => $store->id,
            ]);

            $response    = $reportController->snapshot($fakeRequest);
            $data        = json_decode($response->getContent(), true);

            if ($data['success'] ?? false) {
                $schedule->markRanSuccessfully();

                return response()->json([
                    'success' => true,
                    'message' => "Captured {$data['count']} device(s).",
                    'count'   => $data['count'],
                ]);
            }

            $schedule->markFailed($data['error'] ?? 'Unknown error');

            return response()->json([
                'success' => false,
                'error'   => $data['error'] ?? 'Snapshot failed.',
            ], 500);
        } catch (\Throwable $e) {
            $schedule->markFailed($e->getMessage());

            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
