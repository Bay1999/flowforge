<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Dto\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tenant_name' => 'required|string|max:255',
            'user_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Validation Error', $validator->errors(), 422)->toResponse();
        }

        $result = $this->authService->registerTenantAndUser($request->all());

        return ApiResponse::success([
            'user' => $result['user'],
            'tenant' => $result['tenant'],
            'access_token' => $result['token'],
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60
        ], 'Successfully registered', 201)->toResponse();
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Validation Error', $validator->errors(), 422)->toResponse();
        }

        $token = $this->authService->login($request->only('email', 'password'));

        if (!$token) {
            return ApiResponse::error('Unauthorized', null, 401)->toResponse();
        }

        $user = auth()->user();

        return ApiResponse::success([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60
        ], 'Login success')->toResponse();
    }

    public function me()
    {
        $user = auth()->user();
        return ApiResponse::success($user)->toResponse();
    }

    public function logout()
    {
        auth()->logout();
        return ApiResponse::success(null, 'Successfully logged out')->toResponse();
    }
}
