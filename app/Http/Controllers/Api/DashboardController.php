<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkflowRun;
use App\Dto\ApiResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        
        $recentRuns = WorkflowRun::where('tenant_id', $tenantId)
            ->with('workflowDefinition')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();
            
        $active = WorkflowRun::where('tenant_id', $tenantId)->where('status', 'running')->count();
        $completed = WorkflowRun::where('tenant_id', $tenantId)->where('status', 'completed')->count();
        $failed = WorkflowRun::where('tenant_id', $tenantId)->where('status', 'failed')->count();
        $total = $active + $completed + $failed ?: 1; // Prevent div by zero
        
        $successRate = round(($completed / $total) * 100);

        $chartData = collect(range(6, 0))->map(function ($daysAgo) use ($tenantId) {
            $date = \Carbon\Carbon::today()->subDays($daysAgo);
            $runs = WorkflowRun::where('tenant_id', $tenantId)
                ->whereDate('created_at', $date)
                ->count();
                
            return [
                'name' => $date->format('D'),
                'runs' => $runs,
            ];
        })->values()->all();

        return ApiResponse::success([
            'recentRuns' => $recentRuns,
            'stats' => [
                'active' => $active,
                'success' => $completed,
                'failed' => $failed,
                'total' => $total,
            ],
            'successRate' => $successRate,
            'chartData' => $chartData,
        ])->toResponse();
    }
}
