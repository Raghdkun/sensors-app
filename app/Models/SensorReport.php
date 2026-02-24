<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SensorReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'store_device_id',
        'device_id',
        'device_type',
        'device_name',
        'online',
        'temperature',
        'temperature_unit',
        'humidity',
        'battery_level',
        'alarm',
        'state',
        'raw_state',
        'reported_at',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'online'       => 'boolean',
            'temperature'  => 'decimal:2',
            'humidity'     => 'decimal:2',
            'alarm'        => 'boolean',
            'raw_state'    => 'array',
            'reported_at'  => 'datetime',
            'recorded_at'  => 'datetime',
        ];
    }

    /**
     * The store this report belongs to.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * The device that generated this report.
     */
    public function storeDevice(): BelongsTo
    {
        return $this->belongsTo(StoreDevice::class);
    }

    // ── Query Scopes ────────────────────────────────────────────────

    /**
     * Scope: reports for a given store.
     */
    public function scopeForStore($query, int $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    /**
     * Scope: reports for a specific device.
     */
    public function scopeForDevice($query, string $deviceId)
    {
        return $query->where('device_id', $deviceId);
    }

    /**
     * Scope: reports within a date range.
     */
    public function scopeBetween($query, $from, $to)
    {
        return $query->whereBetween('recorded_at', [$from, $to]);
    }

    /**
     * Scope: only temperature/humidity sensors.
     */
    public function scopeThSensors($query)
    {
        return $query->where('device_type', 'THSensor');
    }

    /**
     * Scope: today's reports.
     */
    public function scopeToday($query)
    {
        return $query->whereDate('recorded_at', now()->toDateString());
    }

    /**
     * Scope: this week's reports.
     */
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('recorded_at', [
            now()->startOfWeek(),
            now()->endOfWeek(),
        ]);
    }

    /**
     * Scope: this month's reports.
     */
    public function scopeThisMonth($query)
    {
        return $query->whereBetween('recorded_at', [
            now()->startOfMonth(),
            now()->endOfMonth(),
        ]);
    }
}
