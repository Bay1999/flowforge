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
        Schema::table('workflow_definitions', function (Blueprint $table) {
            $table->string('trigger_type')->default('manual')->after('dag_json');
            $table->json('trigger_config')->nullable()->after('trigger_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_definitions', function (Blueprint $table) {
            $table->dropColumn('trigger_type');
            $table->dropColumn('trigger_config');
        });
    }
};
