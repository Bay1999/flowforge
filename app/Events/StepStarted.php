<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StepStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $workflow_id;
    public $run_id;
    public $step_id;
    public $tenant_id;

    public function __construct($workflow_id, $run_id, $step_id, $tenant_id)
    {
        $this->workflow_id = $workflow_id;
        $this->run_id = $run_id;
        $this->step_id = $step_id;
        $this->tenant_id = $tenant_id;
    }

    public function broadcastOn()
    {
        // Broadcast on a private channel for the workflow or tenant
        return new PrivateChannel('workflow.' . $this->workflow_id);
    }

    public function broadcastAs()
    {
        return 'StepStarted';
    }
}
