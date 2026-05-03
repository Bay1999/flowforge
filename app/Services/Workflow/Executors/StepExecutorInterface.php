<?php

namespace App\Services\Workflow\Executors;

interface StepExecutorInterface
{
    /**
     * Execute the given step logic.
     *
     * @param array $config
     * @param array $previousOutputs
     * @return array
     */
    public function execute(array $config, array $previousOutputs = []): array;
}
