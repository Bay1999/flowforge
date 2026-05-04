import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

// Custom Node Component to look a bit nicer and show type
const CustomNode = ({ data, selected }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-indigo-500' : 'border-gray-200'}`}>
      <div className="flex flex-col">
        <div className="font-bold text-sm text-gray-800">{data.label}</div>
        <div className="text-xs text-gray-500 uppercase mt-1">{data.type}</div>
      </div>
      {/* Target Handle (Input) */}
      <div className="absolute top-1/2 -left-2 w-3 h-3 bg-indigo-400 rounded-full border-2 border-white" style={{ transform: 'translateY(-50%)' }} />
      {/* Source Handle (Output) */}
      <div className="absolute top-1/2 -right-2 w-3 h-3 bg-indigo-400 rounded-full border-2 border-white" style={{ transform: 'translateY(-50%)' }} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const Sidebar = () => {
  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 flex flex-col h-full overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Nodes Palette</h3>
        <p className="text-xs text-gray-500 mt-1">Drag nodes to the canvas</p>
      </div>
      <div className="space-y-3">
        <div 
          className="p-3 border-2 border-indigo-200 bg-white rounded-md cursor-grab hover:border-indigo-400 transition-colors shadow-sm" 
          onDragStart={(event) => onDragStart(event, 'script', 'Script Task')} 
          draggable
        >
          <div className="font-semibold text-sm text-gray-800">Script Task</div>
          <div className="text-xs text-gray-500">Execute custom code</div>
        </div>
        <div 
          className="p-3 border-2 border-green-200 bg-white rounded-md cursor-grab hover:border-green-400 transition-colors shadow-sm" 
          onDragStart={(event) => onDragStart(event, 'http', 'HTTP Request')} 
          draggable
        >
          <div className="font-semibold text-sm text-gray-800">HTTP Request</div>
          <div className="text-xs text-gray-500">Make an API call</div>
        </div>
        <div 
          className="p-3 border-2 border-yellow-200 bg-white rounded-md cursor-grab hover:border-yellow-400 transition-colors shadow-sm" 
          onDragStart={(event) => onDragStart(event, 'delay', 'Delay / Wait')} 
          draggable
        >
          <div className="font-semibold text-sm text-gray-800">Delay</div>
          <div className="text-xs text-gray-500">Pause execution</div>
        </div>
      </div>
    </aside>
  );
};

let idCounter = 1;
const getId = () => `node_${idCounter++}_${uuidv4().substring(0, 4)}`;

const WorkflowBuilderFlow = ({ initialDag, onChange }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Initialize from DAG JSON
  useEffect(() => {
    if (initialDag && initialDag.nodes) {
      const rfNodes = initialDag.nodes.map((n, i) => ({
        id: n.id,
        type: 'custom',
        position: n.position || { x: 250, y: i * 150 + 50 },
        data: { label: n.name || n.id, type: n.type, config: n.config || {} },
      }));

      const rfEdges = (initialDag.edges || []).map((e, i) => ({
        id: `e_${e.source}_${e.target}_${i}`,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
      
      // Attempt to set counter higher than existing nodes
      idCounter = rfNodes.length + 1;
    }
  }, []); // Run only once on mount

  // Sync to parent when nodes/edges change
  useEffect(() => {
    // Prevent firing on initial empty state if it hasn't loaded yet
    if (nodes.length === 0 && (!initialDag || !initialDag.nodes)) return;

    const dag = {
      nodes: nodes.map(n => {
        // Build final node structure expected by backend
        const out = {
          id: n.id,
          name: n.data.label,
          type: n.data.type,
          config: n.data.config || {},
          position: n.position,
        };
        // Add retries if set and valid
        if (n.data.retries !== undefined && n.data.retries !== null && n.data.retries !== '') {
          out.retries = parseInt(n.data.retries, 10);
        }
        return out;
      }),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
      }))
    };
    onChange(dag);
  }, [nodes, edges]); // Don't put onChange in dependency array if it changes on every render

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
    }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // reactFlowInstance.project was renamed to reactFlowInstance.screenToFlowPosition
      // and we don't need the reactFlowBounds here
      // check if screenToFlowPosition is available (v11+)
      let position;
      if (reactFlowInstance.screenToFlowPosition) {
          position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
      } else {
          // fallback for older xyflow versions
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          position = reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          });
      }

      const newNode = {
        id: getId(),
        type: 'custom',
        position,
        data: { label: `${label}`, type: type, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNode(nodes.length > 0 ? nodes[0] : null);
  }, []);

  const handleNodeConfigChange = (key, value) => {
    if (!selectedNode) return;
    
    // Some fields need JSON parsing if they are objects, but we handle string->json manually or use simple inputs.
    // For headers and body, users will input JSON string, and we try to parse it, but if it fails we keep the string to let them type.
    // Actually, to make it exactly match the example where headers/body are objects:
    let finalValue = value;
    if (key === 'headers' || key === 'body') {
        try {
            finalValue = JSON.parse(value);
        } catch(e) {
            finalValue = value; // keep as string if invalid json, validation handles it later
        }
    }
    if (key === 'duration_seconds') {
        finalValue = parseInt(value, 10);
    }

    setNodes((nds) => 
      nds.map(n => n.id === selectedNode.id ? { 
        ...n, 
        data: { 
          ...n.data, 
          config: { ...n.data.config, [key]: finalValue } 
        } 
      } : n)
    );
  };

  const handleNodeDataChange = (key, value) => {
    if (!selectedNode) return;
    setNodes((nds) => 
      nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: value } } : n)
    );
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter(n => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  // Helper to safely stringify objects for textarea
  const stringifyForEditor = (val) => {
      if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val, null, 2);
      }
      return val || '';
  };

  return (
    <div className="flex h-[600px] w-full border border-gray-200 rounded-xl overflow-hidden bg-white relative">
      <Sidebar />
      <div className="flex-1 relative h-full flex flex-col" ref={reactFlowWrapper}>
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background color="#f8fafc" gap={16} />
          </ReactFlow>
        </div>
        
        {/* Simple Properties Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-white shadow-xl border border-gray-200 rounded-lg p-4 z-10 max-h-[90%] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-sm text-gray-800">Node Properties</h3>
              <button onClick={deleteNode} className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded bg-red-50">Delete</button>
            </div>
            
            <div className="space-y-4">
              {/* General Settings */}
              <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ID</label>
                  <div className="text-xs font-mono bg-white p-1.5 rounded border border-gray-200 truncate">{selectedNode.id}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Label (Name)</label>
                  <input 
                    type="text" 
                    value={selectedNode.data.label}
                    onChange={(e) => handleNodeDataChange('label', e.target.value)}
                    className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 p-1.5 border"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                    <div className="text-sm font-bold text-gray-800 uppercase bg-white p-1.5 rounded border border-gray-200 text-center">{selectedNode.data.type}</div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Retries</label>
                    <input 
                      type="number" 
                      min="0"
                      value={selectedNode.data.retries ?? ''}
                      onChange={(e) => handleNodeDataChange('retries', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 p-1.5 border text-center"
                      placeholder="e.g. 3"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Config Settings */}
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Configuration</h4>
                
                {selectedNode.data.type === 'http' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">URL <span className="text-red-500">*</span></label>
                      <input 
                        type="url" 
                        value={selectedNode.data.config?.url || ''}
                        onChange={(e) => handleNodeConfigChange('url', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded p-1.5 border"
                        placeholder="https://api.example.com/data"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Method</label>
                      <select 
                        value={selectedNode.data.config?.method || 'GET'}
                        onChange={(e) => handleNodeConfigChange('method', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded p-1.5 border bg-white"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Headers (JSON)</label>
                      <textarea 
                        value={typeof selectedNode.data.config?.headers === 'object' ? JSON.stringify(selectedNode.data.config.headers, null, 2) : selectedNode.data.config?.headers || ''}
                        onChange={(e) => handleNodeConfigChange('headers', e.target.value)}
                        className="w-full text-xs font-mono border-gray-300 rounded p-1.5 border h-20"
                        placeholder='{"Accept": "application/json"}'
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Body (JSON)</label>
                      <textarea 
                        value={typeof selectedNode.data.config?.body === 'object' ? JSON.stringify(selectedNode.data.config.body, null, 2) : selectedNode.data.config?.body || ''}
                        onChange={(e) => handleNodeConfigChange('body', e.target.value)}
                        className="w-full text-xs font-mono border-gray-300 rounded p-1.5 border h-24"
                        placeholder='{"title": "Workflow Completed"}'
                      />
                    </div>
                  </>
                )}

                {selectedNode.data.type === 'script' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">PHP Code</label>
                    <textarea 
                      value={selectedNode.data.config?.code || ''}
                      onChange={(e) => handleNodeConfigChange('code', e.target.value)}
                      className="w-full text-xs font-mono border-gray-300 rounded p-1.5 border bg-gray-900 text-green-400 h-48"
                      placeholder="return $inputs;"
                      spellCheck="false"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Variables available: <code className="bg-gray-100 px-1 rounded">$inputs</code> (array of previous outputs).</p>
                  </div>
                )}

                {selectedNode.data.type === 'delay' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (Seconds) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      min="0"
                      value={selectedNode.data.config?.duration_seconds ?? ''}
                      onChange={(e) => handleNodeConfigChange('duration_seconds', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded p-1.5 border"
                      placeholder="10"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WorkflowBuilder = ({ initialDag, onChange }) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderFlow initialDag={initialDag} onChange={onChange} />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder;
