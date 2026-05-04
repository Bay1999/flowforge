import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import WorkflowGraph from '../../Components/WorkflowGraph';
import { 
  Save, ArrowLeft, Clock, Zap, MousePointer2, 
  FileJson, Info, AlertCircle, Copy, Code, Globe, Hourglass 
} from 'lucide-react';
import Swal from 'sweetalert2';

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

const WorkflowsEdit = () => {
  const queryClient = useQueryClient();
  const workflowId = window.location.pathname.split('/')[2];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'manual',
    trigger_config: {},
  });

  const [jsonInput, setJsonInput] = useState('{}');
  const [parsedDag, setParsedDag] = useState({ nodes: [], edges: [] });
  const [jsonError, setJsonError] = useState(null);

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/workflows/${workflowId}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name || '',
        description: workflow.description || '',
        trigger_type: workflow.trigger_type || 'manual',
        trigger_config: workflow.trigger_config || {},
      });
      const dag = workflow.dag_json || { nodes: [], edges: [] };
      setJsonInput(JSON.stringify(dag, null, 2));
      setParsedDag(dag);
    }
  }, [workflow]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedDag(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  }, [jsonInput]);

  const updateMutation = useMutation({
    mutationFn: (data) => axios.put(`/api/workflows/${workflowId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      queryClient.invalidateQueries(['workflow', workflowId]);
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Workflow updated successfully. A new version has been created.',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        router.visit(`/workflows/${workflowId}`);
      });
    },
    onError: (e) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.response?.data?.message || 'Failed to update workflow'
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jsonError) return;
    updateMutation.mutate({
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

  if (isLoading) return <Layout><div className="flex justify-center py-12">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.visit(`/workflows/${workflowId}`)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Workflow</h1>
              <p className="text-sm text-gray-500">Modify your automation logic</p>
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={updateMutation.isPending || !!jsonError}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
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
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
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

                  {formData.trigger_type === 'scheduled' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-indigo-900 uppercase">Cron Expression</label>
                      <input 
                        type="text" 
                        value={formData.trigger_config.cron || ''}
                        onChange={(e) => handleTriggerConfigChange('cron', e.target.value)}
                        className="w-full rounded-lg border-indigo-200 focus:ring-indigo-500 text-sm p-2"
                      />
                    </div>
                  )}
                  {formData.trigger_type === 'webhook' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-indigo-900 uppercase">Secret Token</label>
                      <input 
                        type="text" 
                        value={formData.trigger_config.secret || ''}
                        onChange={(e) => handleTriggerConfigChange('secret', e.target.value)}
                        className="w-full rounded-lg border-indigo-200 focus:ring-indigo-500 text-sm p-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <FileJson className="h-4 w-4 mr-2 text-indigo-500" />
                  Workflow Definition
                </h2>
                {jsonError ? (
                  <span className="text-red-600 text-xs font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Syntax Error
                  </span>
                ) : (
                  <span className="text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center">
                    Valid JSON
                  </span>
                )}
              </div>
              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-[500px] font-mono text-sm p-6 bg-[#1e1e1e] text-[#d4d4d4] outline-none resize-none leading-relaxed"
                spellCheck="false"
              />
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <Code className="h-4 w-4 mr-2 text-indigo-500" />
                  JSON Reference
                </h3>
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {Object.entries(JSON_EXAMPLES).map(([key, example]) => (
                  <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="p-3 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center space-x-2 font-bold text-xs text-gray-700 uppercase">
                        {example.icon}
                        <span>{example.title}</span>
                      </div>
                      <button onClick={() => addNodeToEditor(key)} className="p-1 hover:bg-indigo-100 rounded text-indigo-600">
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

export default WorkflowsEdit;
