<?php

namespace App\Services;

use App\Services\Workflow\DagParser;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class AiWorkflowService
{
    protected DagParser $dagParser;
    protected string $apiKey;
    protected string $model;
    protected int $maxRetries = 3;
    protected int $maxDescriptionLength = 2000;

    public function __construct(DagParser $dagParser)
    {
        $this->dagParser = $dagParser;
        $this->apiKey = config('services.gemini.api_key', '');
        $this->model = config('services.gemini.model', 'gemini-2.0-flash');
    }

    /**
     * Generate a workflow DAG from a natural language description.
     *
     * @param string $description
     * @return array{name: string, description: string, dag: array}
     * @throws Exception
     */
    public function generateFromDescription(string $description): array
    {
        if (empty($this->apiKey)) {
            throw new Exception('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.');
        }

        // Truncate description if too long
        $description = $this->truncateDescription($description);

        $lastError = null;
        $errorContext = '';

        for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
            try {
                Log::info("AI Workflow Generation attempt {$attempt}/{$this->maxRetries}", [
                    'description' => substr($description, 0, 100) . '...',
                ]);

                $prompt = $this->buildPrompt($description, $errorContext);
                $rawResponse = $this->callGeminiApi($prompt);
                $parsed = $this->parseResponse($rawResponse);

                // Validate the DAG using existing DagParser
                $this->dagParser->validate($parsed['dag']);

                Log::info("AI Workflow Generation succeeded on attempt {$attempt}");

                return $parsed;

            } catch (Exception $e) {
                // If it's a rate limit error (429), don't bother retrying
                if (str_contains($e->getMessage(), '429')) {
                    throw $e;
                }

                $lastError = $e;
                $errorContext = "Previous attempt failed with error: {$e->getMessage()}. Please fix the issue and generate a valid DAG JSON.";
                
                Log::warning("AI Workflow Generation attempt {$attempt} failed", [
                    'error' => $e->getMessage(),
                ]);

                // Wait a bit before retrying (exponential-ish backoff)
                if ($attempt < $this->maxRetries) {
                    sleep($attempt); 
                }
            }
        }

        throw new Exception(
            "Failed to generate a valid workflow after {$this->maxRetries} attempts. Last error: " . 
            ($lastError ? $lastError->getMessage() : 'Unknown error')
        );
    }

    /**
     * Build the prompt for the Gemini API.
     */
    protected function buildPrompt(string $description, string $errorContext = ''): string
    {
        $systemPrompt = <<<'SYSTEM'
You are a workflow automation expert. Your task is to convert natural language descriptions into valid workflow DAG (Directed Acyclic Graph) JSON definitions for the FlowForge platform.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no explanations), with this exact structure:
{
  "name": "Short Workflow Name",
  "description": "Brief description of what the workflow does",
  "dag": {
    "nodes": [...],
    "edges": [...]
  }
}

RULES FOR THE DAG:
1. Each node must have: "id" (unique string, lowercase_with_underscores), "type" (one of: "http", "script", "delay"), "name" (human readable), "config" (object)
2. Optional node field: "retries" (integer, default 3 for http nodes)
3. Edges define execution order: {"source": "node_id_1", "target": "node_id_2"}
4. The DAG must NOT contain circular dependencies
5. All edge source/target must reference existing node IDs

NODE TYPE CONFIGS:
- "http" type config: {"url": "https://...", "method": "GET|POST|PUT|DELETE", "headers": {}, "body": {}}
- "script" type config: {"code": "return ['result' => 'value'];"}  (PHP code that can use $inputs variable containing outputs from parent nodes)
- "delay" type config: {"duration_seconds": 5}

EXAMPLES OF GOOD RESPONSES:
For "Fetch users from API and process them":
{
  "name": "Fetch & Process Users",
  "description": "Fetches user data from an API endpoint and processes the results",
  "dag": {
    "nodes": [
      {"id": "fetch_users", "type": "http", "name": "Fetch Users", "config": {"url": "https://api.example.com/users", "method": "GET"}, "retries": 3},
      {"id": "process_data", "type": "script", "name": "Process User Data", "config": {"code": "return ['processed' => true, 'count' => count($inputs)];"}}
    ],
    "edges": [
      {"source": "fetch_users", "target": "process_data"}
    ]
  }
}

For "Wait 10 seconds then call webhook":
{
  "name": "Delayed Webhook",
  "description": "Waits for 10 seconds before triggering a webhook endpoint",
  "dag": {
    "nodes": [
      {"id": "wait_step", "type": "delay", "name": "Wait 10 Seconds", "config": {"duration_seconds": 10}},
      {"id": "call_webhook", "type": "http", "name": "Trigger Webhook", "config": {"url": "https://hooks.example.com/notify", "method": "POST", "body": {"status": "ready"}}, "retries": 2}
    ],
    "edges": [
      {"source": "wait_step", "target": "call_webhook"}
    ]
  }
}

IMPORTANT: 
- Generate realistic, practical workflows based on the description
- Use descriptive node IDs and names
- Include appropriate retries for HTTP nodes
- If the description is vague, create a reasonable interpretation
- Always respond with ONLY the JSON object, nothing else
SYSTEM;

        $userMessage = "Generate a workflow DAG for the following description:\n\n\"{$description}\"";

        if (!empty($errorContext)) {
            $userMessage .= "\n\nIMPORTANT CORRECTION: {$errorContext}";
        }

        return json_encode([
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $systemPrompt . "\n\n---\n\n" . $userMessage]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'topP' => 0.95,
                'maxOutputTokens' => 4096,
                'responseMimeType' => 'application/json',
            ]
        ]);
    }

    /**
     * Call the Gemini API.
     */
    protected function callGeminiApi(string $prompt): string
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(30)
            ->withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->withBody($prompt, 'application/json')
            ->post($url);

        if (!$response->successful()) {
            $errorBody = $response->json();
            $errorMsg = $errorBody['error']['message'] ?? $response->body();
            throw new Exception("Gemini API error ({$response->status()}): {$errorMsg}");
        }

        $data = $response->json();

        // Extract text from Gemini response structure
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (empty($text)) {
            throw new Exception('Gemini API returned an empty response.');
        }

        return $text;
    }

    /**
     * Parse the raw LLM response into structured data.
     */
    protected function parseResponse(string $rawResponse): array
    {
        // Clean potential markdown code fences
        $cleaned = $rawResponse;
        $cleaned = preg_replace('/^```(?:json)?\s*\n?/i', '', $cleaned);
        $cleaned = preg_replace('/\n?```\s*$/i', '', $cleaned);
        $cleaned = trim($cleaned);

        $decoded = json_decode($cleaned, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('LLM response is not valid JSON: ' . json_last_error_msg());
        }

        if (!isset($decoded['dag']) || !is_array($decoded['dag'])) {
            throw new Exception('LLM response missing required "dag" field.');
        }

        if (!isset($decoded['dag']['nodes']) || !isset($decoded['dag']['edges'])) {
            throw new Exception('LLM response DAG missing "nodes" or "edges" array.');
        }

        return [
            'name' => $decoded['name'] ?? 'AI Generated Workflow',
            'description' => $decoded['description'] ?? 'Workflow generated by AI from natural language description.',
            'dag' => $decoded['dag'],
        ];
    }

    /**
     * Truncate description to prevent token overflow.
     */
    protected function truncateDescription(string $description): string
    {
        if (mb_strlen($description) > $this->maxDescriptionLength) {
            return mb_substr($description, 0, $this->maxDescriptionLength) . '...';
        }
        return $description;
    }
}
