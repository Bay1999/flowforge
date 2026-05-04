<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class WorkflowDefinition extends Model
{
    use HasFactory, Tenantable, HasUlids;

    protected $fillable = [
        'tenant_id', 
        'name', 
        'description', 
        'dag_json', 
        'version',
        'trigger_type',
        'trigger_config',
        'is_active', 
        'created_by'
    ];

    protected $casts = [
        'dag_json' => 'array',
        'trigger_config' => 'array',
        'is_active' => 'boolean',
    ];

    public function runs()
    {
        return $this->hasMany(WorkflowRun::class);
    }

    public function versions()
    {
        return $this->hasMany(WorkflowVersion::class);
    }
}
