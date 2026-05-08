<?php

namespace App\Services\Workflow\Executors;

use Illuminate\Support\Facades\Http;
use App\Traits\HandlesInterpolation;
use Exception;

class HttpExecutor implements StepExecutorInterface
{
    use HandlesInterpolation;

    public function execute(array $config, array $previousOutputs = []): array
    {
        $context = ['inputs' => $previousOutputs];

        $url = $this->interpolate($config['url'] ?? null, $context);
        $method = strtoupper($config['method'] ?? 'GET');
        $headers = $this->interpolate($config['headers'] ?? [], $context);
        $body = $this->interpolate($config['body'] ?? [], $context);

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
