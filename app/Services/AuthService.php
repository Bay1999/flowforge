<?php

namespace App\Services;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthService
{
    /**
     * Register a new tenant and an admin user.
     */
    public function registerTenantAndUser(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $tenant = Tenant::create([
                'name' => $data['tenant_name'],
                'slug' => \Illuminate\Support\Str::slug($data['tenant_name']) . '-' . uniqid(),
            ]);

            $user = User::create([
                'name' => $data['user_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'tenant_id' => $tenant->id,
            ]);

            $token = auth()->login($user);

            return [
                'user' => $user,
                'tenant' => $tenant,
                'token' => $token
            ];
        });
    }

    /**
     * Login user and return token.
     */
    public function login(array $credentials): ?string
    {
        if (!$token = auth()->attempt($credentials)) {
            return null;
        }

        return $token;
    }
}
