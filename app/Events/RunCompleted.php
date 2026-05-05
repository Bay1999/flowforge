<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RunCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $workflow_id;
    public $run_id;
    public $tenant_id;
    public $status;

    public function __construct($workflow_id, $run_id, $tenant_id, $status = 'completed')
    {
        $this->workflow_id = $workflow_id;
        $this->run_id = $run_id;
        $this->tenant_id = $tenant_id;
        $this->status = $status;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('workflow.' . $this->workflow_id);
    }

    public function broadcastAs()
    {
        return 'RunCompleted';
    }
}
