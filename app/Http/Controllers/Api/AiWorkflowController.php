<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiWorkflowService;
use App\Dto\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class AiWorkflowController extends Controller
{
    protected AiWorkflowService $aiService;

    public function __construct(AiWorkflowService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Generate a workflow DAG from a natural language description.
     *
     * POST /api/ai/generate-workflow
     * Body: { "description": "Send email when form submitted..." }
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'required|string|min:10|max:5000',
        ], [
            'description.required' => 'Please provide a workflow description.',
            'description.min' => 'Description must be at least 10 characters.',
            'description.max' => 'Description must not exceed 5000 characters.',
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Validation Error', $validator->errors(), 422)->toResponse();
        }

        try {
            $result = $this->aiService->generateFromDescription($request->input('description'));

            return ApiResponse::success([
                'name' => $result['name'],
                'description' => $result['description'],
                'dag' => $result['dag'],
            ], 'Workflow generated successfully')->toResponse();

        } catch (Exception $e) {
            return ApiResponse::error(
                'AI Generation Failed: ' . $e->getMessage(),
                null,
                422
            )->toResponse();
        }
    }
}
