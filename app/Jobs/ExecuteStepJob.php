<?php

namespace App\Jobs;

use App\Models\WorkflowRun;
use App\Models\StepRun;
use App\Models\ExecutionLog;
use App\Events\StepStarted;
use App\Events\StepCompleted;
use App\Events\StepFailed;
use App\Events\RunCompleted;
use App\Services\Workflow\DagParser;
use App\Services\Workflow\Executors\HttpExecutor;
use App\Services\Workflow\Executors\DelayExecutor;
use App\Services\Workflow\Executors\ScriptExecutor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Exception;

class ExecuteStepJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public WorkflowRun $run;
    public string $stepId;

    public $tries = 3;
    public $backoff = [10, 30, 60]; // Exponential backoff in seconds

    /**
     * Create a new job instance.
     */
    public function __construct(WorkflowRun $run, string $stepId)
    {
        $this->run = $run;
        $this->stepId = $stepId;
    }

    /**
     * Execute the job.
     */
    public function handle(DagParser $parser): void
    {
        $stepRun = StepRun::where('workflow_run_id', $this->run->id)
            ->where('step_id', $this->stepId)
            ->first();

        if (!$stepRun || $stepRun->status === 'completed') {
            return;
        }

        $stepRun->update(['status' => 'running', 'started_at' => now(), 'retry_count' => $this->attempts() - 1]);
        event(new StepStarted($this->run->workflow_id, $this->run->id, $this->stepId, $this->run->tenant_id));

        $workflow = $this->run->workflowDefinition;
        $dag = is_string($workflow->dag_json) ? json_decode($workflow->dag_json, true) : $workflow->dag_json;

        // Find node config
        $nodeConfig = null;
        foreach ($dag['nodes'] as $node) {
            if ($node['id'] === $this->stepId) {
                $nodeConfig = $node;
                break;
            }
        }

        if (!$nodeConfig) {
            $this->failStep($stepRun, "Node configuration not found in DAG.");
            return;
        }

        // Apply custom retries from config if set
        if (isset($nodeConfig['retries'])) {
            $this->tries = $nodeConfig['retries'];
        }

        try {
            // Get executor
            $executor = $this->getExecutor($nodeConfig['type']);

            // Get previous outputs to pass along (simplified)
            $previousOutputs = $this->getPreviousOutputs($parser, $dag);

            // Execute
            $output = $executor->execute($nodeConfig['config'] ?? [], $previousOutputs);

            // Success
            $stepRun->update([
                'status' => 'completed',
                'completed_at' => now(),
                'output' => $output
            ]);
            event(new StepCompleted($this->run->workflow_id, $this->run->id, $this->stepId, $this->run->tenant_id));

            ExecutionLog::create([
                'workflow_run_id' => $this->run->id,
                'step_run_id' => $stepRun->id,
                'level' => 'info',
                'message' => "Step completed successfully."
            ]);

            // Dispatch next eligible steps
            $this->dispatchNextSteps($parser, $dag);

        } catch (Exception $e) {
            ExecutionLog::create([
                'workflow_run_id' => $this->run->id,
                'step_run_id' => $stepRun->id,
                'level' => 'error',
                'message' => "Step execution failed: " . $e->getMessage()
            ]);

            // If we have exhausted retries, or if we decide not to retry
            if ($this->attempts() >= $this->tries) {
                $this->failStep($stepRun, $e->getMessage());
            } else {
                // Laravel will automatically retry based on $this->tries and $this->backoff
                $stepRun->update(['status' => 'failed', 'error' => $e->getMessage()]);
                event(new StepFailed($this->run->workflow_id, $this->run->id, $this->stepId, $this->run->tenant_id, $e->getMessage()));
                throw $e; // Throwing triggers the retry
            }
        }
    }

    private function getExecutor(string $type)
    {
        return match ($type) {
            'http' => new HttpExecutor(),
            'delay' => new DelayExecutor(),
            'script' => new ScriptExecutor(),
            default => throw new Exception("Unknown step type: {$type}"),
        };
    }

    private function getPreviousOutputs(DagParser $parser, array $dag): array
    {
        $outputs = [];
        
        // Fetch all completed step runs for the current workflow run
        $completedRuns = StepRun::where('workflow_run_id', $this->run->id)
            ->where('status', 'completed')
            ->get();

        foreach ($completedRuns as $run) {
            if ($run->output !== null) {
                $outputs[$run->step_id] = $run->output;
            }
        }

        return $outputs;
    }

    private function dispatchNextSteps(DagParser $parser, array $dag): void
    {
        $nextNodes = $parser->getNextNodes($dag, $this->stepId);

        foreach ($nextNodes as $nextNodeId) {
            // Check if all dependencies of next node are met
            $parentNodes = $parser->getParentNodes($dag, $nextNodeId);
            $allParentsCompleted = true;
            foreach ($parentNodes as $parentId) {
                $parentStatus = StepRun::where('workflow_run_id', $this->run->id)
                    ->where('step_id', $parentId)
                    ->value('status');
                if ($parentStatus !== 'completed') {
                    $allParentsCompleted = false;
                    break;
                }
            }

            if ($allParentsCompleted) {
                ExecuteStepJob::dispatch($this->run, $nextNodeId);
            }
        }

        // Check if entire workflow is completed
        // A workflow is completed when all its steps are 'completed'
        // We use a refresh() to ensure we have the latest status from the database
        if ($this->run->refresh()->status !== 'running') {
            return;
        }

        $hasIncompleteSteps = StepRun::where('workflow_run_id', $this->run->id)
            ->where('status', '!=', 'completed')
            ->exists();
        
        if (!$hasIncompleteSteps) {
            $this->run->update([
                'status' => 'completed',
                'completed_at' => now()
            ]);
            event(new RunCompleted($this->run->workflow_id, $this->run->id, $this->run->tenant_id, 'completed'));
        }
    }

    private function failStep(StepRun $stepRun, string $error): void
    {
        $stepRun->update([
            'status' => 'failed',
            'completed_at' => now(),
            'error' => $error
        ]);
        event(new StepFailed($this->run->workflow_id, $this->run->id, $this->stepId, $this->run->tenant_id, $error));

        $this->run->update([
            'status' => 'failed',
            'completed_at' => now()
        ]);
        event(new RunCompleted($this->run->workflow_id, $this->run->id, $this->run->tenant_id, 'failed'));
    }
}
