<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class WebhookTrigger extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = ['workflow_definition_id', 'webhook_token'];
}
