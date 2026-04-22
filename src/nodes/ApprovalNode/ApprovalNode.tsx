import { UserCheck } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { ApprovalNodeType } from '../../types/nodes';

export function ApprovalNode({ id, data, selected }: ApprovalNodeType) {
  return (
    <BaseNode id={id} selected={selected} label={data.label || "Approval"} icon={<UserCheck className="w-5 h-5 text-purple-500" />}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">Role:</span>
        <span className="font-medium truncate max-w-[120px]">{data.approverRole || 'Unassigned'}</span>
      </div>
    </BaseNode>
  );
}