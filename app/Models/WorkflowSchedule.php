<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class WorkflowSchedule extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = ['workflow_definition_id', 'cron_expression', 'is_active'];
}
