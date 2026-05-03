<?php

namespace Tests\Unit;

use App\Services\Workflow\DagParser;
use PHPUnit\Framework\TestCase;
use Exception;

class DagParserTest extends TestCase
{
    private DagParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new DagParser();
    }

    public function test_valid_dag_passes_validation()
    {
        $dag = [
            'nodes' => [
                ['id' => 'A'],
                ['id' => 'B'],
                ['id' => 'C']
            ],
            'edges' => [
                ['source' => 'A', 'target' => 'B'],
                ['source' => 'B', 'target' => 'C']
            ]
        ];

        $this->assertTrue($this->parser->validate($dag));
    }

    public function test_circular_dependency_throws_exception()
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage("DAG contains a circular dependency.");

        $dag = [
            'nodes' => [
                ['id' => 'A'],
                ['id' => 'B']
            ],
            'edges' => [
                ['source' => 'A', 'target' => 'B'],
                ['source' => 'B', 'target' => 'A'] // cycle
            ]
        ];

        $this->parser->validate($dag);
    }

    public function test_topological_sort_returns_correct_order()
    {
        $dag = [
            'nodes' => [
                ['id' => 'C'],
                ['id' => 'A'],
                ['id' => 'B']
            ],
            'edges' => [
                ['source' => 'A', 'target' => 'B'],
                ['source' => 'B', 'target' => 'C']
            ]
        ];

        $sorted = $this->parser->topologicalSort($dag);
        $this->assertEquals(['A', 'B', 'C'], $sorted);
    }

    public function test_get_initial_nodes()
    {
        $dag = [
            'nodes' => [
                ['id' => 'A'],
                ['id' => 'B'],
                ['id' => 'C']
            ],
            'edges' => [
                ['source' => 'A', 'target' => 'C'],
                ['source' => 'B', 'target' => 'C']
            ]
        ];

        $initial = $this->parser->getInitialNodes($dag);
        $this->assertContains('A', $initial);
        $this->assertContains('B', $initial);
        $this->assertCount(2, $initial);
    }
}
