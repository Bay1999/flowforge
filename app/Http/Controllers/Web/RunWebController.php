<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\WorkflowRun;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RunWebController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $runs = WorkflowRun::where('tenant_id', $tenantId)
            ->with('workflowDefinition')
            ->orderBy('created_at', 'desc')
            ->paginate(50);
            
        return Inertia::render('Runs/Index', [
            'runs' => $runs
        ]);
    }
}
