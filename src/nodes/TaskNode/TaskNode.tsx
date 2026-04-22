import { ClipboardList } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { TaskNodeType } from '../../types/nodes';

export function TaskNode({ id, data, selected }: TaskNodeType) {
  return (
    <BaseNode id={id} selected={selected} label={data.label || "Task"} icon={<ClipboardList className="w-5 h-5 text-blue-500" />}>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Assignee:</span>
          <span className="font-medium truncate max-w-[100px]">{data.assignee || 'Unassigned'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className="font-medium capitalize">{data.status || 'pending'}</span>
        </div>
      </div>
    </BaseNode>
  );
}