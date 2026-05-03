<?php

namespace App\Repositories;

use App\Models\WorkflowDefinition;

class WorkflowDefinitionRepository extends BaseRepository
{
    public function __construct(WorkflowDefinition $model)
    {
        parent::__construct($model);
    }
}
