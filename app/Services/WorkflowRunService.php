<?php

namespace App\Services;

use App\Repositories\WorkflowRunRepository;

class WorkflowRunService
{
    protected WorkflowRunRepository $repository;

    public function __construct(WorkflowRunRepository $repository)
    {
        $this->repository = $repository;
    }

    public function getAll(int $perPage = 15)
    {
        return $this->repository->paginate($perPage);
    }

    public function getById($id)
    {
        return $this->repository->find($id);
    }

    public function cancel($id)
    {
        $run = $this->repository->find($id);
        if ($run && in_array($run->status, ['pending', 'running'])) {
            // Note: In a real distributed system, we would also need to signal running jobs to stop.
            // For now, we update the status, and ExecuteStepJob checks if status is cancelled.
            return $this->repository->update(['status' => 'cancelled'], $id);
        }
        return false;
    }
}
