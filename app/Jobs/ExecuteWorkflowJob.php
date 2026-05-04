<?php

namespace App\Jobs;

use App\Models\WorkflowRun;
use App\Models\StepRun;
use App\Events\RunCompleted;
use App\Services\Workflow\DagParser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ExecuteWorkflowJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public WorkflowRun $run;

    /**
     * Create a new job instance.
     */
    public function __construct(WorkflowRun $run)
    {
        $this->run = $run;
    }

    /**
     * Execute the job.
     */
    public function handle(DagParser $parser): void
    {
        $this->run->update(['status' => 'running', 'started_at' => now()]);

        $workflow = $this->run->workflowDefinition;
        $dag = is_string($workflow->dag_json) ? json_decode($workflow->dag_json, true) : $workflow->dag_json;

        try {
            // Validate DAG just in case
            $parser->validate($dag);

            // Get initial nodes
            $initialNodes = $parser->getInitialNodes($dag);

            // Initialize all step runs as pending to track overall progress
            foreach ($dag['nodes'] as $node) {
                StepRun::firstOrCreate([
                    'workflow_run_id' => $this->run->id,
                    'step_id' => $node['id']
                ], [
                    'status' => 'pending'
                ]);
            }

            // Dispatch a job for each initial node
            if (empty($initialNodes)) {
                // If there are nodes but no initial nodes, it might be a cycle (already caught by validate)
                // or just an empty workflow.
                if (count($dag['nodes']) === 0) {
                    $this->run->update(['status' => 'completed', 'completed_at' => now()]);
                    event(new RunCompleted($this->run->workflow_id, $this->run->id, $this->run->tenant_id, 'completed'));
                } else {
                    throw new \Exception("Workflow has nodes but no entry points found.");
                }
            } else {
                foreach ($initialNodes as $nodeId) {
                    ExecuteStepJob::dispatch($this->run, $nodeId);
                }
            }
        } catch (\Exception $e) {
            $this->run->update([
                'status' => 'failed',
                'completed_at' => now()
            ]);
            event(new RunCompleted($this->run->workflow_id, $this->run->id, $this->run->tenant_id, 'failed'));
            // Log error
            \App\Models\ExecutionLog::create([
                'workflow_run_id' => $this->run->id,
                'level' => 'error',
                'message' => "Workflow failed to start: " . $e->getMessage()
            ]);
        }
    }
}
