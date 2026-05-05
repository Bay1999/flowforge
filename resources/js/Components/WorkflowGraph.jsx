import { useState, useEffect, useCallback } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const WorkflowGraph = ({ dag }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!dag || !dag.nodes) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Convert our internal DAG structure to React Flow structure
    const rfNodes = dag.nodes.map((node, index) => {
      // Use position if it exists, otherwise stack vertically
      const position = node.position || { x: 250, y: index * 120 + 50 };
      
      return {
        id: node.id,
        position,
        data: { 
          label: (
            <div className="flex flex-col text-left">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">{node.id}</span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                  {node.type}
                </span>
              </div>
              {node.name && <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">{node.name}</div>}
              {node.retries && <div className="text-[10px] text-orange-600 font-medium mt-1">Retries: {node.retries}</div>}
            </div>
          )
        },
        style: {
          background: '#fff',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px',
          minWidth: '180px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }
      };
    });

    const rfEdges = (dag.edges || []).map((edge, index) => ({
      id: `e-${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
        width: 20,
        height: 20
      },
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [dag, setNodes, setEdges]);

  return (
    <div className="w-full h-full min-h-[400px] bg-gray-50 rounded-xl overflow-hidden border border-gray-200 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default WorkflowGraph;
