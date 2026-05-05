<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\WorkflowDefinition;
use App\Services\Workflow\WorkflowExecutionService;
use Cron\CronExpression;

class RunScheduledWorkflows extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'workflows:run-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run workflows that are scheduled to execute now via cron expression';

    /**
     * Execute the console command.
     */
    public function handle(WorkflowExecutionService $executionService)
    {
        $this->info('Checking for scheduled workflows...');

        $workflows = WorkflowDefinition::where('is_active', true)
            ->where('trigger_type', 'scheduled')
            ->get();

        $count = 0;

        foreach ($workflows as $workflow) {
            $config = $workflow->trigger_config ?? [];
            $cron = $config['cron'] ?? null;

            if (!$cron) {
                continue;
            }

            try {
                $cronExpression = new CronExpression($cron);
                
                // Check if it's due exactly now (within this minute)
                if ($cronExpression->isDue()) {
                    $executionService->trigger($workflow, 'scheduled');
                    $this->info("Triggered workflow: {$workflow->id} ({$workflow->name})");
                    $count++;
                }
            } catch (\Exception $e) {
                $this->error("Invalid cron expression for workflow {$workflow->id}: " . $e->getMessage());
            }
        }

        $this->info("Completed checking. Triggered $count workflows.");
    }
}
