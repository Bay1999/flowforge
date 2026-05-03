<?php

namespace App\Services\Workflow\Executors;

use Illuminate\Support\Facades\Http;
use Exception;

class HttpExecutor implements StepExecutorInterface
{
    public function execute(array $config, array $previousOutputs = []): array
    {
        $url = $config['url'] ?? null;
        $method = strtoupper($config['method'] ?? 'GET');
        $headers = $config['headers'] ?? [];
        $body = $config['body'] ?? [];

        if (!$url) {
            throw new Exception("HTTP Executor requires a 'url' configuration.");
        }

        try {
            $response = Http::withHeaders($headers)
                ->send($method, $url, [
                    'json' => $body
                ]);

            if ($response->failed()) {
                throw new Exception("HTTP request failed with status: " . $response->status());
            }

            return [
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ];
        } catch (\Throwable $e) {
            throw new Exception("HTTP Executor error: " . $e->getMessage());
        }
    }
}
