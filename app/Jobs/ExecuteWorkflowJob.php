<?php

namespace App\Jobs;

use App\Models\WorkflowRun;
use App\Models\StepRun;
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
            foreach ($initialNodes as $nodeId) {
                ExecuteStepJob::dispatch($this->run, $nodeId);
            }
        } catch (\Exception $e) {
            $this->run->update([
                'status' => 'failed',
                'completed_at' => now()
            ]);
            // Log error
            \App\Models\ExecutionLog::create([
                'workflow_run_id' => $this->run->id,
                'level' => 'error',
                'message' => "Workflow failed to start: " . $e->getMessage()
            ]);
        }
    }
}
