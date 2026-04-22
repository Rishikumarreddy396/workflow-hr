import { UserCheck, ShieldAlert } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { ApprovalNodeType } from '../../types/nodes';

export function ApprovalNode({ id, data, selected }: ApprovalNodeType) {
  const threshold = data.autoApproveThreshold || 80;

  return (
    <BaseNode
      id={id}
      selected={selected}
      label={data.label || "Data Validation"}
      subLabel="Ensuring Data Accuracy"
      icon={<UserCheck className="w-4 h-4 text-purple-600" />}
      status={data.outcome === 'approved' ? 'success' : data.outcome === 'rejected' ? 'error' : 'warning'}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500">Approver</span>
          <span className="font-semibold text-slate-700 truncate max-w-[120px]">
            {data.approverRole || 'Unassigned'}
          </span>
        </div>

        {/* Auto-approve threshold visualization bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-medium">
            <span className="text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3"/> Auto-Approve
            </span>
            <span className="text-purple-600">≥{threshold}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${threshold}%` }} />
          </div>
        </div>
      </div>
    </BaseNode>
  );
}