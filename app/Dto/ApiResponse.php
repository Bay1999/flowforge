<?php

namespace App\Dto;

use Illuminate\Contracts\Support\Arrayable;
use JsonSerializable;

class ApiResponse implements Arrayable, JsonSerializable
{
    public function __construct(
        public bool $success,
        public string $message,
        public mixed $data = null,
        public mixed $errors = null,
        public int $statusCode = 200
    ) {}

    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200): self
    {
        return new self(true, $message, $data, null, $statusCode);
    }

    public static function error(string $message = 'Error', mixed $errors = null, int $statusCode = 400): self
    {
        return new self(false, $message, null, $errors, $statusCode);
    }

    public function toArray(): array
    {
        return array_filter([
            'success' => $this->success,
            'message' => $this->message,
            'data' => $this->data,
            'errors' => $this->errors,
        ], fn($value) => !is_null($value) || $value === null);
    }

    public function jsonSerialize(): mixed
    {
        return $this->toArray();
    }

    public function toResponse()
    {
        return response()->json($this->toArray(), $this->statusCode);
    }
}
