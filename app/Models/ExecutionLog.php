<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class ExecutionLog extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'workflow_run_id', 
        'step_run_id', 
        'level', 
        'message', 
        'context'
    ];

    protected $casts = [
        'context' => 'array',
    ];
}
