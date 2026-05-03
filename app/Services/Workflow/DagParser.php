<?php

namespace App\Services\Workflow;

use Exception;

class DagParser
{
    /**
     * Memvalidasi struktur JSON DAG.
     *
     * @param array $dag
     * @return bool
     * @throws Exception
     */
    public function validate(array $dag): bool
    {
        if (!isset($dag['nodes']) || !is_array($dag['nodes'])) {
            throw new Exception("DAG must contain 'nodes' array.");
        }

        if (!isset($dag['edges']) || !is_array($dag['edges'])) {
            throw new Exception("DAG must contain 'edges' array.");
        }

        $nodeIds = [];
        foreach ($dag['nodes'] as $node) {
            if (!isset($node['id'])) {
                throw new Exception("Each node must have an 'id'.");
            }
            if (in_array($node['id'], $nodeIds)) {
                throw new Exception("Duplicate node id found: " . $node['id']);
            }
            $nodeIds[] = $node['id'];
        }

        foreach ($dag['edges'] as $edge) {
            if (!isset($edge['source']) || !isset($edge['target'])) {
                throw new Exception("Each edge must have 'source' and 'target'.");
            }
            if (!in_array($edge['source'], $nodeIds)) {
                throw new Exception("Edge source node not found: " . $edge['source']);
            }
            if (!in_array($edge['target'], $nodeIds)) {
                throw new Exception("Edge target node not found: " . $edge['target']);
            }
        }

        // Validate cycle via topological sort
        $this->topologicalSort($dag);

        return true;
    }

    /**
     * Kahn's Algorithm untuk Topological Sort.
     * Mengembalikan urutan eksekusi node yang aman, atau throw Exception jika ada cycle.
     *
     * @param array $dag
     * @return array
     * @throws Exception
     */
    public function topologicalSort(array $dag): array
    {
        $inDegree = [];
        $adjList = [];
        $nodes = [];

        foreach ($dag['nodes'] as $node) {
            $inDegree[$node['id']] = 0;
            $adjList[$node['id']] = [];
            $nodes[$node['id']] = $node;
        }

        foreach ($dag['edges'] as $edge) {
            $source = $edge['source'];
            $target = $edge['target'];
            
            $adjList[$source][] = $target;
            $inDegree[$target]++;
        }

        $queue = [];
        foreach ($inDegree as $nodeId => $degree) {
            if ($degree === 0) {
                $queue[] = $nodeId;
            }
        }

        $sortedNodeIds = [];
        while (!empty($queue)) {
            $u = array_shift($queue);
            $sortedNodeIds[] = $u;

            foreach ($adjList[$u] as $v) {
                $inDegree[$v]--;
                if ($inDegree[$v] === 0) {
                    $queue[] = $v;
                }
            }
        }

        if (count($sortedNodeIds) !== count($dag['nodes'])) {
            throw new Exception("DAG contains a circular dependency.");
        }

        return $sortedNodeIds;
    }

    /**
     * Mendapatkan node-node awal (tanpa incoming edges) yang siap dijalankan.
     *
     * @param array $dag
     * @return array
     */
    public function getInitialNodes(array $dag): array
    {
        $inDegree = [];
        foreach ($dag['nodes'] as $node) {
            $inDegree[$node['id']] = 0;
        }

        foreach ($dag['edges'] as $edge) {
            $inDegree[$edge['target']]++;
        }

        $initialNodes = [];
        foreach ($inDegree as $nodeId => $degree) {
            if ($degree === 0) {
                $initialNodes[] = $nodeId;
            }
        }

        return $initialNodes;
    }

    /**
     * Mendapatkan node yang langsung bergantung pada node tertentu.
     *
     * @param array $dag
     * @param string $nodeId
     * @return array
     */
    public function getNextNodes(array $dag, string $nodeId): array
    {
        $nextNodes = [];
        foreach ($dag['edges'] as $edge) {
            if ($edge['source'] === $nodeId) {
                $nextNodes[] = $edge['target'];
            }
        }
        return $nextNodes;
    }

    /**
     * Mendapatkan semua parent dari sebuah node.
     *
     * @param array $dag
     * @param string $nodeId
     * @return array
     */
    public function getParentNodes(array $dag, string $nodeId): array
    {
        $parentNodes = [];
        foreach ($dag['edges'] as $edge) {
            if ($edge['target'] === $nodeId) {
                $parentNodes[] = $edge['source'];
            }
        }
        return $parentNodes;
    }
}
