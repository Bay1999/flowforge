<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkflowDefinition;
use App\Services\Workflow\WorkflowExecutionService;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function handle(Request $request, string $id, WorkflowExecutionService $executionService)
    {
        // Find workflow
        $workflow = WorkflowDefinition::where('id', $id)
            ->where('is_active', true)
            ->first();

        if (!$workflow) {
            return response()->json(['message' => 'Workflow not found or inactive'], 404);
        }

        // Check if webhook is enabled for this workflow
        if ($workflow->trigger_type !== 'webhook') {
            return response()->json(['message' => 'Webhook trigger is not enabled for this workflow'], 400);
        }

        // Validate secret if configured
        $config = $workflow->trigger_config ?? [];
        if (!empty($config['secret'])) {
            $providedSecret = $request->header('X-Webhook-Secret') ?? $request->query('secret');
            
            if ($providedSecret !== $config['secret']) {
                return response()->json(['message' => 'Invalid webhook secret'], 401);
            }
        }

        // Trigger execution
        // We could also pass $request->all() as initial payload if supported by engine
        $run = $executionService->trigger($workflow, 'webhook');

        return response()->json([
            'message' => 'Workflow triggered successfully via webhook',
            'run_id' => $run->id
        ], 202);
    }
}
