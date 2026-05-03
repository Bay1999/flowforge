<?php

namespace App\Services;

use App\Repositories\WorkflowDefinitionRepository;
use App\Services\Workflow\DagParser;
use Illuminate\Support\Facades\Auth;

class WorkflowDefinitionService
{
    protected WorkflowDefinitionRepository $repository;
    protected DagParser $dagParser;

    public function __construct(WorkflowDefinitionRepository $repository, DagParser $dagParser)
    {
        $this->repository = $repository;
        $this->dagParser = $dagParser;
    }

    public function getAll(int $perPage = 15)
    {
        return $this->repository->paginate($perPage);
    }

    public function create(array $data)
    {
        // Parse JSON string if it's a string
        $dag = is_string($data['dag_json']) ? json_decode($data['dag_json'], true) : $data['dag_json'];

        // Validate DAG structure
        $this->dagParser->validate($dag);

        $data['dag_json'] = json_encode($dag);
        $data['created_by'] = Auth::id();

        return $this->repository->create($data);
    }

    public function getById($id)
    {
        return $this->repository->find($id);
    }

    public function update($id, array $data)
    {
        if (isset($data['dag_json'])) {
            $dag = is_string($data['dag_json']) ? json_decode($data['dag_json'], true) : $data['dag_json'];
            $this->dagParser->validate($dag);
            $data['dag_json'] = json_encode($dag);
        }
        
        return $this->repository->update($data, $id);
    }

    public function delete($id)
    {
        return $this->repository->delete($id);
    }
}
