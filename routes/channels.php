<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('workflow.{workflow_id}', function ($user, $workflow_id) {
    // Check if the user's tenant owns the workflow
    $workflow = \App\Models\WorkflowDefinition::find($workflow_id);
    return $workflow && $workflow->tenant_id === $user->tenant_id;
});
