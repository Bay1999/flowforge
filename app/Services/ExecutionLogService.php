<?php

namespace App\Services;

use App\Repositories\ExecutionLogRepository;

class ExecutionLogService
{
    protected ExecutionLogRepository $repository;

    public function __construct(ExecutionLogRepository $repository)
    {
        $this->repository = $repository;
    }

    public function getLogsForRun(string $runId, int $perPage = 50)
    {
        return $this->repository->query()
            ->where('workflow_run_id', $runId)
            ->orderBy('timestamp', 'asc')
            ->paginate($perPage);
    }
}
