import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { useAuth } from '../../Context/AuthContext';
import { Play, Plus, Trash2, Edit, Eye, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';

const fetchWorkflows = async () => {
  const { data } = await axios.get('/api/workflows');
  return data.data; // data from pagination
};

const WorkflowsIndex = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = hasRole(['Admin', 'Editor']);

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  });

  const triggerMutation = useMutation({
    mutationFn: (id) => axios.post(`/api/workflows/${id}/trigger`),
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Triggered',
        text: 'Workflow execution started successfully!',
        timer: 2000,
        showConfirmButton: false
      });
    },
    onError: (e) => {
      Swal.fire('Error', e.response?.data?.message || 'Failed to trigger', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/api/workflows/${id}`),
    onSuccess: () => {
      Swal.fire('Deleted!', 'Workflow has been deleted.', 'success');
      queryClient.invalidateQueries(['workflows']);
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ workflowId, versionId }) => 
      axios.post(`/api/workflows/${workflowId}/rollback`, { version_id: versionId }),
    onSuccess: () => {
      Swal.fire('Restored!', 'Workflow has been rolled back.', 'success');
      queryClient.invalidateQueries(['workflows']);
    },
    onError: (e) => {
      Swal.fire('Error', e.response?.data?.message || 'Failed to rollback', 'error');
    },
  });

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleRollback = async (workflow) => {
    try {
      Swal.fire({
        title: 'Loading versions...',
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false
      });

      const { data: response } = await axios.get(`/api/workflows/${workflow.id}/versions`);
      const versions = response.data;

      if (!versions || versions.length === 0) {
        Swal.fire('No History', 'There are no previous versions to rollback to.', 'info');
        return;
      }

      const inputOptions = {};
      versions.forEach(v => {
        inputOptions[v.id] = `Version v${v.version} (Saved ${new Date(v.created_at).toLocaleString()})`;
      });

      Swal.fire({
        title: 'Rollback Workflow',
        text: `Select a version to restore for "${workflow.name}"`,
        input: 'select',
        inputOptions: inputOptions,
        inputPlaceholder: 'Select a version',
        showCancelButton: true,
        confirmButtonText: 'Rollback',
        confirmButtonColor: '#f59e0b',
        inputValidator: (value) => {
          if (!value) return 'You need to select a version!';
        }
      }).then((result) => {
        if (result.isConfirmed) {
          rollbackMutation.mutate({ workflowId: workflow.id, versionId: result.value });
        }
      });
    } catch (e) {
      Swal.fire('Error', 'Failed to load workflow versions', 'error');
    }
  };

  const handleTrigger = (id) => {
    triggerMutation.mutate(id);
  };

  if (isLoading) return <Layout><div className="flex justify-center py-12">Loading workflows...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          {canEdit && (
            <Link 
              href="/workflows/create"
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!workflows?.data || workflows.data.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No workflows found.
                  </td>
                </tr>
              ) : (
                workflows.data.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/workflows/${workflow.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        {workflow.name}
                      </Link>
                      <div className="text-xs text-gray-500">{workflow.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      v{workflow.version || '1.0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/workflows/${workflow.id}`}
                        className="text-gray-600 hover:text-gray-900 mx-2"
                        title="View Detail"
                      >
                        <Eye className="h-4 w-4 inline" />
                      </Link>
                      {canEdit ? (
                        <>
                          <button 
                            onClick={() => handleTrigger(workflow.id)}
                            disabled={triggerMutation.isPending}
                            className="text-green-600 hover:text-green-900 mx-2 disabled:opacity-50"
                            title="Trigger"
                          >
                            <Play className="h-4 w-4 inline" />
                          </button>
                          <Link href={`/workflows/${workflow.id}/edit`} className="text-blue-600 hover:text-blue-900 mx-2" title="Edit">
                            <Edit className="h-4 w-4 inline" />
                          </Link>
                          <button 
                            onClick={() => handleRollback(workflow)}
                            disabled={rollbackMutation.isPending}
                            className="text-amber-600 hover:text-amber-900 mx-2 disabled:opacity-50"
                            title="Rollback"
                          >
                            <RotateCcw className="h-4 w-4 inline" />
                          </button>
                          <button 
                            onClick={() => handleDelete(workflow.id)}
                            className="text-red-600 hover:text-red-900 mx-2" 
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 inline" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 mx-2">Read Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default WorkflowsIndex;
