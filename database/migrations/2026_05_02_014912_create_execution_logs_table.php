<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('execution_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('workflow_run_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('step_run_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('level')->default('info');
            $table->text('message');
            $table->timestamp('timestamp')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('execution_logs');
    }
};
