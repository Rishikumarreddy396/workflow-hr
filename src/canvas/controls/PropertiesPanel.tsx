import { useWorkflowStore } from '../../store/workflowStore';

export function PropertiesPanel() {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const nodes = useWorkflowStore((state) => state.nodes);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const node = nodes.find((n) => n.id === selectedNodeId);

  // If no node is selected, show the empty state
  if (!node) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Properties</h2>
        <p className="text-sm text-gray-500">Select a node on the canvas to edit its properties.</p>
      </div>
    );
  }

  // Generic helper to update the node's data in the Zustand store
  const updateData = (field: string, value: string | number | boolean) => {
    updateNodeData(node.id, { [field]: value });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col gap-5 overflow-y-auto h-full shadow-lg z-10 relative">
      <div>
        <h2 className="text-lg font-bold text-gray-800 capitalize">{node.type} Node</h2>
        <p className="text-xs text-gray-400 font-mono mt-1">ID: {node.id}</p>
      </div>
      
      {/* ── COMMON FIELD: Title ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</label>
        <input 
          type="text" 
          value={node.data.label || ''} 
          onChange={(e) => updateData('label', e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          placeholder="e.g., Collect Documents"
        />
      </div>

      {/* ── START NODE FIELDS ── */}
      {node.type === 'start' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Trigger Event</label>
          <select 
            value={(node.data as any).triggerEvent || 'manual'}
            onChange={(e) => updateData('triggerEvent', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="manual">Manual Trigger</option>
            <option value="new_hire">New Hire Onboarding</option>
            <option value="offboarding">Employee Offboarding</option>
            <option value="promotion">Promotion Workflow</option>
          </select>
        </div>
      )}

      {/* ── TASK NODE FIELDS ── */}
      {node.type === 'task' && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Assignee</label>
            <input 
              type="text" 
              value={(node.data as any).assignee || ''} 
              onChange={(e) => updateData('assignee', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. HR Manager or user_123"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</label>
            <select 
              value={(node.data as any).status || 'pending'}
              onChange={(e) => updateData('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </>
      )}

      {/* ── APPROVAL NODE FIELDS ── */}
      {node.type === 'approval' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Approver Role</label>
          <input 
            type="text" 
            value={(node.data as any).approverRole || ''} 
            onChange={(e) => updateData('approverRole', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Director of Engineering"
          />
        </div>
      )}

      {/* ── AUTOMATED STEP NODE FIELDS ── */}
      {node.type === 'automated_step' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Automated Action</label>
          <select 
            value={(node.data as any).action || ''}
            onChange={(e) => updateData('action', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select an action...</option>
            <option value="send_email">Send Email</option>
            <option value="generate_document">Generate PDF Document</option>
            <option value="update_hris">Update HRIS System</option>
            <option value="send_slack">Send Slack Notification</option>
          </select>
        </div>
      )}

      {/* ── END NODE FIELDS ── */}
      {node.type === 'end' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Workflow Outcome</label>
          <select 
            value={(node.data as any).outcome || 'completed'}
            onChange={(e) => updateData('outcome', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="completed">Success / Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}
    </div>
  );
}