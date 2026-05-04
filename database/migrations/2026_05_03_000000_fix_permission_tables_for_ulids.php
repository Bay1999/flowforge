<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columnNames = config('permission.column_names');
        $tableNames = config('permission.table_names');

        Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($columnNames) {
            $table->string($columnNames['model_morph_key'])->change();
        });

        Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($columnNames) {
            $table->string($columnNames['model_morph_key'])->change();
        });
    }

    public function down(): void
    {
        $columnNames = config('permission.column_names');
        $tableNames = config('permission.table_names');

        Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($columnNames) {
            $table->unsignedBigInteger($columnNames['model_morph_key'])->change();
        });

        Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($columnNames) {
            $table->unsignedBigInteger($columnNames['model_morph_key'])->change();
        });
    }
};
