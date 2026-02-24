<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'device_id',
        'device_token',
        'device_type',
        'device_name',
        'model_name',
        'is_hub',
    ];

    protected function casts(): array
    {
        return [
            'is_hub' => 'boolean',
        ];
    }

    /**
     * The store this device belongs to.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
