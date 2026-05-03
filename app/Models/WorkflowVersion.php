<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class WorkflowVersion extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = ['workflow_definition_id', 'version', 'dag_json', 'created_by'];

    protected $casts = [
        'dag_json' => 'array',
    ];
}
