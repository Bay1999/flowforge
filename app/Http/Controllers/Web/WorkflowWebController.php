<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\WorkflowDefinitionService;
use App\Services\Workflow\WorkflowExecutionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkflowWebController extends Controller
{
    protected WorkflowDefinitionService $service;
    protected WorkflowExecutionService $executionService;

    public function __construct(WorkflowDefinitionService $service, WorkflowExecutionService $executionService)
    {
        $this->service = $service;
        $this->executionService = $executionService;
    }

    public function index()
    {
        $workflows = $this->service->getAll(100); // Pagination simplified for now
        return Inertia::render('Workflows/Index', [
            'workflows' => $workflows
        ]);
    }

    public function show($id)
    {
        $workflow = $this->service->getById($id);
        if (!$workflow) {
            abort(404);
        }
        return Inertia::render('Workflows/Show', [
            'workflow' => $workflow
        ]);
    }

    public function destroy($id)
    {
        $this->service->delete($id);
        return redirect()->route('workflows.index');
    }

    public function trigger($id)
    {
        $workflow = $this->service->getById($id);
        if ($workflow) {
            $this->executionService->trigger($workflow, 'manual');
        }
        return back()->with('message', 'Workflow triggered');
    }
}
