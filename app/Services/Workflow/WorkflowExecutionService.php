<?php

namespace App\Services\Workflow;

use App\Models\WorkflowRun;
use App\Models\WorkflowDefinition;
use App\Jobs\ExecuteWorkflowJob;
use Illuminate\Support\Facades\Log;

class WorkflowExecutionService
{
    /**
     * Trigger a workflow execution.
     *
     * @param WorkflowDefinition $workflow
     * @param string $triggeredBy manual, schedule, webhook
     * @return WorkflowRun
     */
    public function trigger(WorkflowDefinition $workflow, string $triggeredBy = 'manual'): WorkflowRun
    {
        Log::info("Triggering workflow: {$workflow->id}");

        $run = WorkflowRun::create([
            'workflow_definition_id' => $workflow->id,
            'tenant_id' => $workflow->tenant_id,
            'status' => 'pending',
            'triggered_by' => $triggeredBy,
        ]);

        ExecuteWorkflowJob::dispatch($run);

        return $run;
    }
}
