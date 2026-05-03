<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\RunController;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:api')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Workflows
    Route::apiResource('workflows', WorkflowController::class);
    Route::post('workflows/{workflow}/trigger', [WorkflowController::class, 'trigger']);

    // Runs
    Route::get('runs', [RunController::class, 'index']);
    Route::get('runs/{run}', [RunController::class, 'show']);
    Route::post('runs/{run}/cancel', [RunController::class, 'cancel']);
    Route::get('runs/{run}/logs', [RunController::class, 'logs']);
});
