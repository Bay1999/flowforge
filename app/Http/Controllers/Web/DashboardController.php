<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\WorkflowRun;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        
        $recentRuns = WorkflowRun::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();
            
        $active = WorkflowRun::where('tenant_id', $tenantId)->where('status', 'running')->count();
        $completed = WorkflowRun::where('tenant_id', $tenantId)->where('status', 'completed')->count();
        $failed = WorkflowRun::where('tenant_id', $tenantId)->where('status', 'failed')->count();
        $total = $active + $completed + $failed ?: 1; // Prevent div by zero
        
        $successRate = round(($completed / $total) * 100);

        return Inertia::render('Dashboard', [
            'recentRuns' => $recentRuns,
            'stats' => [
                'active' => $active,
                'success' => $completed,
                'failed' => $failed,
                'total' => $total,
            ],
            'successRate' => $successRate
        ]);
    }
}
