import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { router, Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import WorkflowGraph from '../../Components/WorkflowGraph';
import { ArrowLeft, Play, Edit, History, RotateCcw } from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';
import Swal from 'sweetalert2';

const WorkflowsShow = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canEdit = hasRole(['Admin', 'Editor']);
  
  const workflowId = window.location.pathname.split('/')[2];
  const [activeTab, setActiveTab] = useState('dag'); // 'dag' or 'history'

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/workflows/${workflowId}`);
      return data.data;
    },
  });

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['workflowVersions', workflowId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/workflows/${workflowId}/versions`);
      return data.data;
    },
    enabled: activeTab === 'history',
  });

  const triggerMutation = useMutation({
    mutationFn: () => axios.post(`/api/workflows/${workflowId}/trigger`),
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Triggered',
        text: 'Workflow execution started!',
        timer: 2000,
        showConfirmButton: false
      });
    },
    onError: (e) => {
      Swal.fire('Error', e.response?.data?.message || 'Failed to trigger', 'error');
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: (versionId) => axios.post(`/api/workflows/${workflowId}/rollback`, { version_id: versionId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow', workflowId]);
      queryClient.invalidateQueries(['workflowVersions', workflowId]);
      Swal.fire('Restored!', 'Workflow has been rolled back successfully.', 'success');
      setActiveTab('dag');
    },
    onError: (e) => {
      Swal.fire('Error', e.response?.data?.message || 'Failed to rollback', 'error');
    },
  });

  const handleRollback = (versionId) => {
    Swal.fire({
      title: 'Rollback to this version?',
      text: "The current state will be saved as a new version.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Yes, rollback'
    }).then((result) => {
      if (result.isConfirmed) {
        rollbackMutation.mutate(versionId);
      }
    });
  };

  if (isLoading) return <Layout><div className="flex justify-center py-12">Loading workflow...</div></Layout>;
  if (!workflow) return <Layout><div className="flex justify-center py-12">Workflow not found</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.visit('/workflows')} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {workflow.name}
                <span className="ml-3 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-mono">
                  v{workflow.version}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">{workflow.description || 'No description provided'}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {canEdit && (
              <>
                <button 
                  onClick={() => triggerMutation.mutate()}
                  disabled={triggerMutation.isPending}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Trigger Run
                </button>
                <Link 
                  href={`/workflows/${workflow.id}/edit`}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Workflow
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dag')}
              className={`${
                activeTab === 'dag'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              Visual Editor
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <History className="w-4 h-4 mr-2" />
              Version History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dag' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex">
            {/* Visual DAG */}
            <div className="flex-1 bg-gray-50 relative border-r border-gray-200">
              <WorkflowGraph dag={workflow.dag_json} />
            </div>
            {/* Readonly JSON representation */}
            <div className="w-1/3 flex flex-col bg-gray-900">
               <div className="p-3 border-b border-gray-700 bg-gray-800 text-gray-300 text-xs font-bold uppercase tracking-wider">
                 DAG Source (Read-Only)
               </div>
               <div className="flex-1 overflow-auto p-4">
                 <pre className="text-xs text-green-400 font-mono">
                   {JSON.stringify(workflow.dag_json, null, 2)}
                 </pre>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saved At</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Current Active Version */}
                <tr className="bg-indigo-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-900">
                    v{workflow.version} (Current Active)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(workflow.updated_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className="text-indigo-600">Active</span>
                  </td>
                </tr>

                {/* History Versions */}
                {versionsLoading ? (
                  <tr><td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">Loading history...</td></tr>
                ) : !versions || versions.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No previous versions available.</td></tr>
                ) : (
                  versions.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        v{v.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(v.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canEdit && (
                          <button
                            onClick={() => handleRollback(v.id)}
                            disabled={rollbackMutation.isPending}
                            className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 border border-transparent rounded text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Rollback to v{v.version}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WorkflowsShow;
