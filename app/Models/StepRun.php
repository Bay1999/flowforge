<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class StepRun extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'workflow_run_id', 
        'step_id', 
        'status', 
        'started_at', 
        'completed_at', 
        'retry_count', 
        'output', 
        'error'
    ];

    protected $casts = [
        'output' => 'array',
        'error' => 'array',
    ];
}
