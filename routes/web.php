<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('stores', function () {
    return Inertia::render('stores');
})->middleware(['auth', 'verified'])->name('stores');

// YoSmart API Routes
Route::middleware(['auth', 'verified'])->prefix('api/yosmart')->group(function () {
    Route::get('/devices', [App\Http\Controllers\YoSmartController::class, 'listDevices'])->name('yosmart.devices.list');
    Route::get('/home', [App\Http\Controllers\YoSmartController::class, 'homeInfo'])->name('yosmart.home.info');
    Route::post('/device/state', [App\Http\Controllers\YoSmartController::class, 'deviceState'])->name('yosmart.device.state');
    Route::get('/device/states', [App\Http\Controllers\YoSmartController::class, 'allDeviceStates'])->name('yosmart.device.states.all');
    Route::post('/device/control', [App\Http\Controllers\YoSmartController::class, 'controlDevice'])->name('yosmart.device.control');
    Route::get('/health', [App\Http\Controllers\YoSmartController::class, 'health'])->name('yosmart.health');
});

// Store Management Routes (admin, behind auth)
Route::middleware(['auth', 'verified'])->prefix('api/stores')->group(function () {
    Route::get('/', [App\Http\Controllers\StoreController::class, 'index'])->name('stores.index');
    Route::post('/', [App\Http\Controllers\StoreController::class, 'store'])->name('stores.store');
    Route::get('/available-devices', [App\Http\Controllers\StoreController::class, 'availableDevices'])->name('stores.devices.available');
    Route::get('/{store}', [App\Http\Controllers\StoreController::class, 'show'])->name('stores.show');
    Route::put('/{store}', [App\Http\Controllers\StoreController::class, 'update'])->name('stores.update');
    Route::delete('/{store}', [App\Http\Controllers\StoreController::class, 'destroy'])->name('stores.destroy');
    Route::post('/{store}/devices', [App\Http\Controllers\StoreController::class, 'linkDevices'])->name('stores.devices.link');
    Route::delete('/{store}/devices/{device}', [App\Http\Controllers\StoreController::class, 'unlinkDevice'])->name('stores.devices.unlink');
});

require __DIR__.'/settings.php';
