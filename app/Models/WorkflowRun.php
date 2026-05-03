<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class WorkflowRun extends Model
{
    use HasFactory, Tenantable, HasUlids;

    protected $fillable = [
        'workflow_definition_id', 
        'tenant_id', 
        'status', 
        'triggered_by', 
        'started_at', 
        'completed_at'
    ];

    public function workflowDefinition()
    {
        return $this->belongsTo(WorkflowDefinition::class);
    }

    public function stepRuns()
    {
        return $this->hasMany(StepRun::class);
    }

    public function executionLogs()
    {
        return $this->hasMany(ExecutionLog::class);
    }
}
