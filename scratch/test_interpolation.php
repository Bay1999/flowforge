<?php
/* scratch/test_interpolation.php */

require_once __DIR__ . '/../vendor/autoload.php';

// Bootstrap minimal Laravel components if needed, or just mock Arr
use Illuminate\Support\Arr;

// Mock the trait usage
class Tester {
    use App\Traits\HandlesInterpolation;
    
    public function test($content, $context) {
        return $this->interpolate($content, $context);
    }
}

$tester = new Tester();

$context = [
    'inputs' => [
        'fetch_posts' => [
            'status' => 200,
            'body' => [
                ['id' => 1, 'title' => 'Post 1'],
                ['id' => 2, 'title' => 'Post 2'],
            ]
        ],
        'filter_posts' => [
            ['id' => 1, 'title' => 'Post 1']
        ]
    ]
];

// Test 1: Simple interpolation
$content1 = 'URL: {{ $inputs.fetch_posts.status }}';
echo "Test 1: " . $tester->test($content1, $context) . "\n";
// Expected: URL: 200

// Test 2: Nested array interpolation
$content2 = [
    'body' => [
        'results' => '{{ $inputs.filter_posts }}'
    ]
];
$result2 = $tester->test($content2, $context);
echo "Test 2: " . json_encode($result2) . "\n";
// Expected: {"body":{"results":"[{\"id\":1,\"title\":\"Post 1\"}]"}}

// Test 3: Multiple placeholders
$content3 = 'Check {{ $inputs.fetch_posts.status }} and data {{ $inputs.filter_posts.0.title }}';
echo "Test 3: " . $tester->test($content3, $context) . "\n";
// Expected: Check 200 and data Post 1
