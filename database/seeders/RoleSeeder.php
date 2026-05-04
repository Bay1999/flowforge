<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Give the first user the Admin role directly via the column
        $firstUser = User::first();
        if ($firstUser) {
            $firstUser->update(['role' => 'Admin']);
        }
    }
}
