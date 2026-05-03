<?php

namespace App\Jobs;

use App\Models\WorkflowRun;
use App\Models\StepRun;
use App\Models\ExecutionLog;
use App\Services\Workflow\DagParser;
use App\Services\Workflow\Executors\HttpExecutor;
use App\Services\Workflow\Executors\DelayExecutor;
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
                throw $e; // Throwing triggers the retry
            }
        }
    }

    private function getExecutor(string $type)
    {
        return match ($type) {
            'http' => new HttpExecutor(),
            'delay' => new DelayExecutor(),
            default => throw new Exception("Unknown step type: {$type}"),
        };
    }

    private function getPreviousOutputs(DagParser $parser, array $dag): array
    {
        $parentNodes = $parser->getParentNodes($dag, $this->stepId);
        $outputs = [];
        foreach ($parentNodes as $parentId) {
            $parentRun = StepRun::where('workflow_run_id', $this->run->id)
                ->where('step_id', $parentId)
                ->first();
            if ($parentRun && $parentRun->output) {
                $outputs[$parentId] = $parentRun->output;
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
        $totalSteps = count($dag['nodes']);
        $completedSteps = StepRun::where('workflow_run_id', $this->run->id)
            ->where('status', 'completed')
            ->count();

        if ($totalSteps === $completedSteps) {
            $this->run->update([
                'status' => 'completed',
                'completed_at' => now()
            ]);
        }
    }

    private function failStep(StepRun $stepRun, string $error): void
    {
        $stepRun->update([
            'status' => 'failed',
            'completed_at' => now(),
            'error' => $error
        ]);

        $this->run->update([
            'status' => 'failed',
            'completed_at' => now()
        ]);
    }
}
