<?php

use App\Http\Controllers\Api\PublicStoreController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
|
| These routes are stateless and have no auth by default.
| A middleware (e.g. API key validation) can be added here later.
|
*/

Route::prefix('stores')->group(function () {
    // GET /api/stores/{storeNumber}/sensors
    Route::get('{storeNumber}/sensors', [PublicStoreController::class, 'sensors'])
        ->name('api.stores.sensors');
});
