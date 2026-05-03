<?php

namespace App\Repositories;

use App\Models\StepRun;

class StepRunRepository extends BaseRepository
{
    public function __construct(StepRun $model)
    {
        parent::__construct($model);
    }
}
