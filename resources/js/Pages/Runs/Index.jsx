import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Layout from '../../Components/Layout';
import { FileText, X, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const fetchRuns = async () => {
  const { data } = await axios.get('/api/runs');
  return data?.data; 
};

const fetchRunLogs = async (runId) => {
  if (!runId) return null;
  const { data } = await axios.get(`/api/runs/${runId}/logs`);
  return data?.data;
};

const fetchRunDetails = async (runId) => {
  if (!runId) return null;
  const { data } = await axios.get(`/api/runs/${runId}`);
  return data?.data;
};

const StatusBadge = ({ status }) => {
  const configs = {
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
    running: { color: 'bg-blue-100 text-blue-800', icon: Clock },
    pending: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status?.toUpperCase()}
    </span>
  );
};

const RunsIndex = () => {
  const [selectedRun, setSelectedRun] = useState(null);

  const { data: runs, isLoading, isError } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
    refetchInterval: 3000, // Poll every 3 seconds for live updates
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['runLogs', selectedRun],
    queryFn: () => fetchRunLogs(selectedRun),
    enabled: !!selectedRun,
  });

  const { data: runDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['runDetails', selectedRun],
    queryFn: () => fetchRunDetails(selectedRun),
    enabled: !!selectedRun,
  });

  const getStepInfo = (stepId) => {
    if (!runDetails?.workflow_definition?.dag_json) return stepId;
    
    const dag = runDetails.workflow_definition.dag_json;
    const steps = Array.isArray(dag) ? dag : (dag.steps || dag.nodes || []);
    const step = steps.find(s => s.id === stepId);
    const stepName = step?.name || step?.label || stepId;

    const stepRun = runDetails.step_runs?.find(sr => sr.step_id === stepId);
    const status = stepRun?.status ? stepRun.status.toUpperCase() : 'UNKNOWN';

    return `${stepName} [${status}]`;
  };

  if (isLoading) return <Layout><div className="flex justify-center py-12 text-gray-500">Loading execution history...</div></Layout>;
  if (isError) return <Layout><div className="flex justify-center py-12 text-red-500">Failed to load run history. Please try again.</div></Layout>;

  // Detect if response is paginated or direct array
  const runsList = Array.isArray(runs) ? runs : (runs?.data || []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Run History</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Execution Time</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {runsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No runs found for this tenant.</td>
                </tr>
              ) : (
                runsList.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">#{run.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{run.workflow_definition?.name || 'Deleted Workflow'}</div>
                      <div className="text-xs text-gray-500">By {run.triggered_by}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{run.started_at ? new Date(run.started_at).toLocaleString() : '-'}</div>
                      <div className="text-[10px] text-gray-400">
                        {run.completed_at 
                          ? `Duration: ${Math.round((new Date(run.completed_at) - new Date(run.started_at)) / 1000)}s`
                          : (run.status === 'running' ? 'Running...' : '-')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedRun(run.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-100 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        Run Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Log Modal */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Execution Details</h3>
                <p className="text-xs text-gray-500 font-mono">Run ID: {selectedRun}</p>
              </div>
              <button onClick={() => setSelectedRun(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50">
              {/* Sidebar Step List */}
              <div className="w-full md:w-64 bg-white border-r border-gray-100 overflow-y-auto p-4 space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Step Status</h4>
                {detailsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
                  </div>
                ) : runDetails?.step_runs?.map((sr) => {
                  const dag = runDetails?.workflow_definition?.dag_json;
                  const steps = Array.isArray(dag) ? dag : (dag?.steps || dag?.nodes || []);
                  const step = steps.find(s => s.id === sr.step_id);
                  return (
                    <div key={sr.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-50 bg-gray-50/50">
                      <span className="text-xs font-medium text-gray-700 truncate mr-2">{step?.name || step?.label || sr.step_id}</span>
                      <StatusBadge status={sr.status} />
                    </div>
                  );
                })}
              </div>

              {/* Main Log Console */}
              <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
                <div className="p-4 bg-gray-800/50 border-b border-gray-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Console Output</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 font-mono text-sm">
                  {logsLoading || detailsLoading ? (
                    <div className="text-gray-500 animate-pulse">Streaming logs from engine...</div>
                  ) : !logs?.data || (Array.isArray(logs.data) ? logs.data.length === 0 : true) ? (
                    <div className="text-gray-600 italic py-10 text-center">No output logs recorded for this run.</div>
                  ) : (
                    (Array.isArray(logs.data) ? logs.data : []).map((log) => (
                      <div key={log.id} className="mb-1.5 flex gap-4 hover:bg-white/5 py-1 rounded px-2 group">
                        <span className="text-gray-600 shrink-0 tabular-nums">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                        <span className={`font-bold shrink-0 min-w-[50px] ${
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warn' ? 'text-yellow-400' : 'text-emerald-400'
                        }`}>
                          {log.level?.toUpperCase()}
                        </span>
                        <span className="text-indigo-400 shrink-0 font-bold opacity-80 group-hover:opacity-100">
                          [{getStepInfo(log.step_id)}]
                        </span>
                        <span className="text-gray-300 break-words">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default RunsIndex;
