<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SnapshotSchedule extends Model
{
    protected $fillable = [
        'store_id',
        'is_active',
        'interval_minutes',
        'last_run_at',
        'next_run_at',
        'total_runs',
        'consecutive_failures',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'is_active'             => 'boolean',
            'interval_minutes'      => 'integer',
            'last_run_at'           => 'datetime',
            'next_run_at'           => 'datetime',
            'total_runs'            => 'integer',
            'consecutive_failures'  => 'integer',
        ];
    }

    // ── Relationships ─────────────────────────────────────────────

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    // ── Scopes ────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDue($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('next_run_at')
              ->orWhere('next_run_at', '<=', now());
        });
    }

    // ── Helpers ───────────────────────────────────────────────────

    public function markRanSuccessfully(): void
    {
        $this->update([
            'last_run_at'           => now(),
            'next_run_at'           => now()->addMinutes($this->interval_minutes),
            'total_runs'            => $this->total_runs + 1,
            'consecutive_failures'  => 0,
            'last_error'            => null,
        ]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'last_run_at'           => now(),
            'next_run_at'           => now()->addMinutes($this->interval_minutes),
            'total_runs'            => $this->total_runs + 1,
            'consecutive_failures'  => $this->consecutive_failures + 1,
            'last_error'            => $error,
        ]);
    }

    public function isDue(): bool
    {
        return $this->is_active
            && ($this->next_run_at === null || $this->next_run_at->lte(now()));
    }
}
