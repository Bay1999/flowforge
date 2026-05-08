import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import WorkflowGraph from '../../Components/WorkflowGraph';
import AiWorkflowBuilder from '../../Components/AiWorkflowBuilder';
import { 
  Save, ArrowLeft, Clock, Zap, MousePointer2, 
  FileJson, Info, AlertCircle, Copy, Code, Globe, Hourglass, Sparkles 
} from 'lucide-react';
import Swal from 'sweetalert2';

const DEFAULT_DAG = {
  nodes: [
    {
      id: "start_node",
      type: "http",
      name: "Initial Fetch",
      config: {
        url: "https://api.example.com/data",
        method: "GET"
      },
      retries: 3
    }
  ],
  edges: []
};

const JSON_EXAMPLES = {
  http: {
    title: "HTTP Request",
    icon: <Globe className="h-4 w-4 text-blue-500" />,
    json: {
      id: "http_node",
      type: "http",
      name: "Fetch Data",
      config: {
        url: "https://api.example.com/data",
        method: "GET",
        headers: { "Authorization": "Bearer token" },
        body: { "key": "value" }
      },
      retries: 3
    }
  },
  script: {
    title: "PHP Script",
    icon: <Code className="h-4 w-4 text-green-500" />,
    json: {
      id: "script_node",
      type: "script",
      name: "Process Data",
      config: {
        code: "return ['status' => 'ok', 'count' => count($inputs)];"
      }
    }
  },
  delay: {
    title: "Delay / Wait",
    icon: <Hourglass className="h-4 w-4 text-orange-500" />,
    json: {
      id: "delay_node",
      type: "delay",
      name: "Wait 5s",
      config: {
        duration_seconds: 5
      }
    }
  }
};

const WorkflowsCreate = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'manual',
    trigger_config: {},
  });

  const [jsonInput, setJsonInput] = useState(JSON.stringify(DEFAULT_DAG, null, 2));
  const [parsedDag, setParsedDag] = useState(DEFAULT_DAG);
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedDag(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  }, [jsonInput]);

  const createMutation = useMutation({
    mutationFn: (data) => axios.post('/api/workflows', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Workflow created successfully',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        router.visit('/workflows');
      });
    },
    onError: (e) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.response?.data?.message || 'Failed to create workflow'
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jsonError) return;
    createMutation.mutate({
      ...formData,
      dag_json: parsedDag
    });
  };

  const handleTriggerConfigChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      trigger_config: { ...prev.trigger_config, [key]: value }
    }));
  };

  const addNodeToEditor = (type) => {
    try {
      const current = JSON.parse(jsonInput);
      const template = JSON_EXAMPLES[type].json;
      const newNode = { ...template, id: `${type}_${Date.now().toString().slice(-4)}` };
      current.nodes.push(newNode);
      setJsonInput(JSON.stringify(current, null, 2));
    } catch (e) {
      alert("Cannot add node: Invalid JSON in editor");
    }
  };

  const handleAiApply = (result) => {
    // Apply AI-generated DAG to the JSON editor
    setJsonInput(JSON.stringify(result.dag, null, 2));
    // Auto-fill name and description
    setFormData(prev => ({
      ...prev,
      name: result.name || prev.name,
      description: result.description || prev.description,
    }));
    Swal.fire({
      icon: 'success',
      title: 'AI Workflow Applied!',
      text: `"${result.name}" has been loaded into the editor.`,
      timer: 2500,
      showConfirmButton: false,
    });
  };

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.visit('/workflows')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create New Workflow</h1>
              <p className="text-sm text-gray-500">Define your automation steps and triggers</p>
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || !!jsonError}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Workflow
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Configuration (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <Info className="h-4 w-4 mr-2 text-indigo-500" />
                  Basic Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Workflow Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    placeholder="e.g. Daily Data Sync"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    placeholder="Short summary of this workflow"
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all p-2"
                  />
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-5">
                  <label className="block text-xs font-bold text-indigo-900 uppercase mb-4">Trigger Configuration</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {['manual', 'scheduled', 'webhook'].map((type) => (
                      <button 
                        key={type}
                        onClick={() => setFormData({...formData, trigger_type: type})}
                        className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          formData.trigger_type === type 
                          ? 'border-indigo-600 bg-white text-indigo-600 shadow-sm' 
                          : 'border-transparent bg-white/50 text-gray-500 hover:bg-white hover:border-indigo-200'
                        }`}
                      >
                        {type === 'manual' && <MousePointer2 className="h-4 w-4 mr-2" />}
                        {type === 'scheduled' && <Clock className="h-4 w-4 mr-2" />}
                        {type === 'webhook' && <Zap className="h-4 w-4 mr-2" />}
                        <span className="font-bold text-sm capitalize">{type}</span>
                      </button>
                    ))}
                  </div>

                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    {formData.trigger_type === 'scheduled' && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-indigo-900 uppercase">Cron Expression</label>
                          <span className="text-[10px] text-indigo-400">*/5 * * * *</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="e.g. */5 * * * *"
                          value={formData.trigger_config.cron || ''}
                          onChange={(e) => handleTriggerConfigChange('cron', e.target.value)}
                          className="w-full rounded-lg border-indigo-200 focus:ring-indigo-500 text-sm p-2"
                        />
                      </div>
                    )}
                    {formData.trigger_type === 'webhook' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-900 uppercase">Secret Token (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. my-secure-token"
                          value={formData.trigger_config.secret || ''}
                          onChange={(e) => handleTriggerConfigChange('secret', e.target.value)}
                          className="w-full rounded-lg border-indigo-200 focus:ring-indigo-500 text-sm p-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Workflow Builder */}
            <AiWorkflowBuilder onApply={handleAiApply} />

            {/* JSON Editor Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <FileJson className="h-4 w-4 mr-2 text-indigo-500" />
                  Workflow Definition
                </h2>
                {jsonError ? (
                  <span className="flex items-center text-red-600 text-xs font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Syntax Error
                  </span>
                ) : (
                  <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    Valid JSON
                  </span>
                )}
              </div>
              <div className="p-0">
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-[500px] font-mono text-sm p-6 bg-[#1e1e1e] text-[#d4d4d4] outline-none resize-none border-none leading-relaxed"
                  spellCheck="false"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <div className="xl:col-span-4 space-y-6">
            {/* Live Preview Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                  Live Preview
                </h3>
              </div>
              <div className="h-[400px]">
                <WorkflowGraph dag={parsedDag} />
              </div>
            </div>

            {/* Reference Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <Code className="h-4 w-4 mr-2 text-indigo-500" />
                  JSON Reference
                </h3>
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                <p className="text-xs text-gray-500">Quickly add nodes to your definition:</p>
                {Object.entries(JSON_EXAMPLES).map(([key, example]) => (
                  <div key={key} className="group border border-gray-100 rounded-xl overflow-hidden hover:border-indigo-200 transition-all">
                    <div className="p-3 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center space-x-2 font-bold text-xs text-gray-700 uppercase">
                        {example.icon}
                        <span>{example.title}</span>
                      </div>
                      <button 
                        onClick={() => addNodeToEditor(key)}
                        className="p-1.5 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                        title="Add to editor"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="p-3 bg-gray-50/30">
                      <pre className="text-[10px] font-mono text-gray-600 bg-white p-2 rounded border border-gray-100 overflow-x-auto">
                        {JSON.stringify(example.json, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkflowsCreate;
