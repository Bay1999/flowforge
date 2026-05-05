<?php

namespace App\Services;

use App\Repositories\WorkflowDefinitionRepository;
use App\Services\Workflow\DagParser;
use Illuminate\Support\Facades\Auth;
use App\Models\WorkflowVersion;
use Exception;

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

        $data['dag_json'] = $dag;
        $data['created_by'] = Auth::id();

        return $this->repository->create($data);
    }

    public function getById($id)
    {
        return $this->repository->find($id);
    }

    public function update($id, array $data)
    {
        $workflow = $this->repository->find($id);
        if (!$workflow) {
            return null;
        }

        if (isset($data['dag_json'])) {
            $dag = is_string($data['dag_json']) ? json_decode($data['dag_json'], true) : $data['dag_json'];
            $this->dagParser->validate($dag);
            
            // Check if dag actually changed
            $currentDag = is_string($workflow->dag_json) ? json_decode($workflow->dag_json, true) : $workflow->dag_json;
            if (json_encode($dag) !== json_encode($currentDag)) {
                // Save current state as version
                WorkflowVersion::create([
                    'workflow_definition_id' => $workflow->id,
                    'version' => $workflow->version,
                    'dag_json' => $workflow->dag_json,
                ]);

                $data['dag_json'] = $dag;
                $data['version'] = $workflow->version + 1;
            } else {
                // Dag didn't change, just format it
                $data['dag_json'] = $dag;
            }
        }
        
        return $this->repository->update($data, $id);
    }

    public function getVersions($id)
    {
        return WorkflowVersion::where('workflow_definition_id', $id)
            ->orderBy('version', 'desc')
            ->get();
    }

    public function rollback($id, $versionId)
    {
        $workflow = $this->repository->find($id);
        $version = WorkflowVersion::find($versionId);

        if (!$workflow || !$version) {
            throw new Exception("Workflow or Version not found");
        }

        if ($version->workflow_definition_id !== $workflow->id) {
            throw new Exception("Version does not belong to this workflow");
        }

        // Save current state as a new version
        WorkflowVersion::create([
            'workflow_definition_id' => $workflow->id,
            'version' => $workflow->version,
            'dag_json' => $workflow->dag_json,
        ]);

        // Revert to old dag_json and increment version
        return $this->repository->update([
            'dag_json' => $version->getRawOriginal('dag_json'), // Keep json string
            'version' => $workflow->version + 1,
        ], $id);
    }

    public function delete($id)
    {
        return $this->repository->delete($id);
    }
}
