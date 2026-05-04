<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Inertia acts as SPA router, no auth middleware here. Auth is handled by React components using API.
Route::get('/login', fn() => Inertia::render('Auth/Login'))->name('login');
Route::get('/', fn() => Inertia::render('Dashboard'))->name('dashboard');
Route::get('/workflows', fn() => Inertia::render('Workflows/Index'))->name('workflows.index');
Route::get('/workflows/create', fn() => Inertia::render('Workflows/Create'))->name('workflows.create');
Route::get('/workflows/{id}', fn() => Inertia::render('Workflows/Show'))->name('workflows.show');
Route::get('/workflows/{id}/edit', fn() => Inertia::render('Workflows/Edit'))->name('workflows.edit');
Route::get('/runs', fn() => Inertia::render('Runs/Index'))->name('runs.index');

// Wildcard fallback to let React Router handle 404s if needed, or just let Laravel throw 404
Route::fallback(function() {
    return Inertia::render('Dashboard'); // Simplistic fallback
});
