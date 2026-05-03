<?php

namespace App\Repositories;

use App\Models\WorkflowRun;

class WorkflowRunRepository extends BaseRepository
{
    public function __construct(WorkflowRun $model)
    {
        parent::__construct($model);
    }
}
