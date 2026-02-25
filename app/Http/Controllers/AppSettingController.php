<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppSettingController extends Controller
{
    /**
     * GET /api/settings/temperature-unit
     */
    public function temperatureUnit(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'unit'    => AppSetting::temperatureUnit(),
        ]);
    }

    /**
     * PUT /api/settings/temperature-unit
     */
    public function updateTemperatureUnit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit' => 'required|string|in:C,F',
        ]);

        AppSetting::setValue('temperature_unit', $validated['unit']);

        return response()->json([
            'success' => true,
            'unit'    => $validated['unit'],
        ]);
    }
}
