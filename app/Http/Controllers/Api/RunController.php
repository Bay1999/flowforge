<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WorkflowRunService;
use App\Services\ExecutionLogService;
use App\Dto\ApiResponse;
use Illuminate\Http\Request;

class RunController extends Controller
{
    protected WorkflowRunService $service;
    protected ExecutionLogService $logService;

    public function __construct(WorkflowRunService $service, ExecutionLogService $logService)
    {
        $this->service = $service;
        $this->logService = $logService;
    }

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        return ApiResponse::success($this->service->getAll($perPage))->toResponse();
    }

    public function show($id)
    {
        $run = $this->service->getById($id);
        if (!$run) {
            return ApiResponse::error('Run not found', null, 404)->toResponse();
        }
        $run->load(['stepRuns', 'executionLogs']);
        return ApiResponse::success($run)->toResponse();
    }

    public function cancel($id)
    {
        $cancelled = $this->service->cancel($id);
        if (!$cancelled) {
            return ApiResponse::error('Unable to cancel run. It may not exist or is already finished.', null, 400)->toResponse();
        }
        return ApiResponse::success(null, 'Run cancelled successfully.')->toResponse();
    }

    public function logs(Request $request, $id)
    {
        $perPage = $request->input('per_page', 50);
        return ApiResponse::success($this->logService->getLogsForRun($id, $perPage))->toResponse();
    }
}
