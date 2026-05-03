<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Models\ExecutionLog;

class ExecutionLogRepository extends BaseRepository
{
    public function __construct(ExecutionLog $model)
    {
        parent::__construct($model);
    }
}
