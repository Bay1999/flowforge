<?php

namespace App\Services\Workflow\Executors;

use Exception;

class ScriptExecutor implements StepExecutorInterface
{
    public function execute(array $config, array $previousOutputs = []): array
    {
        $code = $config['code'] ?? null;

        if (!$code) {
            throw new Exception("Script Executor requires a 'code' configuration.");
        }

        // Pass previous outputs to the script context
        $inputs = $previousOutputs;

        try {
            // Using eval to execute PHP code. 
            // In a production environment, this is extremely dangerous and should be sandboxed or restricted.
            // Expected that $code contains something like:
            // return ['result' => 'some data'];
            
            // We prepend a space just in case it starts with <?php which eval doesn't like directly
            $result = eval($code);
            
            return is_array($result) ? $result : ['result' => $result];
        } catch (\Throwable $e) {
            throw new Exception("Script execution failed: " . $e->getMessage());
        }
    }
}
