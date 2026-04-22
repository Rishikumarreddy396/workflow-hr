import { User } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { TaskNodeType } from '../../types/nodes';

export function TaskNode({ id, data, selected }: TaskNodeType) {
  // Mock progress percentage for visual flair
  const progress = data.status === 'completed' ? 100 : data.status === 'in_progress' ? 65 : 0;

  return (
    <BaseNode 
      id={id} 
      selected={selected} 
      label={data.label || "Action Trigger"} 
      subLabel="Performing Tasks & Conditions"
      icon={<User className="w-4 h-4 text-slate-600" />}
      status={data.status === 'completed' ? 'success' : 'pending'}
    >
      <div className="flex flex-col gap-3">
        {/* Detail Row */}
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500 flex items-center gap-1">
            Assignee: <span className="font-semibold text-slate-700">{data.assignee || 'Unassigned'}</span>
          </span>
          <span className={`px-2 py-0.5 rounded font-medium ${
            data.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {data.priority || 'Normal'}
          </span>
        </div>

        {/* Mini Progress Bar mimicking the second image */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-medium">
            <span className="text-slate-500">Task Completion</span>
            <span className="text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </BaseNode>
  );
}