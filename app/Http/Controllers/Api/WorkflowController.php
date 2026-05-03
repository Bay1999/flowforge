<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WorkflowDefinitionService;
use App\Services\Workflow\WorkflowExecutionService;
use App\Dto\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class WorkflowController extends Controller
{
    protected WorkflowDefinitionService $service;
    protected WorkflowExecutionService $executionService;

    public function __construct(WorkflowDefinitionService $service, WorkflowExecutionService $executionService)
    {
        $this->service = $service;
        $this->executionService = $executionService;
    }

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        return ApiResponse::success($this->service->getAll($perPage))->toResponse();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'dag_json' => 'required|array',
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Validation Error', $validator->errors(), 422)->toResponse();
        }

        try {
            $workflow = $this->service->create($request->all());
            return ApiResponse::success($workflow, 'Workflow created successfully', 201)->toResponse();
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 400)->toResponse();
        }
    }

    public function show($id)
    {
        $workflow = $this->service->getById($id);
        if (!$workflow) {
            return ApiResponse::error('Workflow not found', null, 404)->toResponse();
        }
        return ApiResponse::success($workflow)->toResponse();
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'dag_json' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Validation Error', $validator->errors(), 422)->toResponse();
        }

        try {
            $workflow = $this->service->update($id, $request->all());
            if (!$workflow) {
                return ApiResponse::error('Workflow not found', null, 404)->toResponse();
            }
            return ApiResponse::success($workflow, 'Workflow updated successfully')->toResponse();
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 400)->toResponse();
        }
    }

    public function destroy($id)
    {
        $deleted = $this->service->delete($id);
        if (!$deleted) {
            return ApiResponse::error('Workflow not found', null, 404)->toResponse();
        }
        return ApiResponse::success(null, 'Deleted successfully')->toResponse();
    }

    public function trigger($id)
    {
        $workflow = $this->service->getById($id);
        if (!$workflow) {
            return ApiResponse::error('Workflow not found', null, 404)->toResponse();
        }

        try {
            $run = $this->executionService->trigger($workflow, 'manual');
            return ApiResponse::success($run, 'Workflow triggered successfully', 202)->toResponse();
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 500)->toResponse();
        }
    }
}
