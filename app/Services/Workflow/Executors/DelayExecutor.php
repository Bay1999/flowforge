<?php

namespace App\Services\Workflow\Executors;

use Exception;

class DelayExecutor implements StepExecutorInterface
{
    public function execute(array $config, array $previousOutputs = []): array
    {
        $duration = $config['duration_seconds'] ?? 0;

        if (!is_numeric($duration) || $duration < 0) {
            throw new Exception("Delay Executor requires a valid positive numeric 'duration_seconds' configuration.");
        }

        // Simulating delay for synchronous execution, though usually delay is handled by releasing the job back to queue.
        // For simplicity in execution, if called synchronously, it will sleep.
        // In a real robust system, the job would use `$job->release($duration)` instead of sleep.
        sleep((int)$duration);

        return [
            'delayed_seconds' => $duration
        ];
    }
}
