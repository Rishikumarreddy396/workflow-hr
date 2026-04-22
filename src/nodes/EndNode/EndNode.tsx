import { StopCircle, Flag } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { EndNodeType } from '../../types/nodes';

export function EndNode({ id, data, selected }: EndNodeType) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      label={data.label || "Action Completion"}
      subLabel="Automation Complete"
      icon={<StopCircle className="w-4 h-4 text-rose-500" />}
      status={data.outcome === 'completed' ? 'success' : 'error'}
      isEnd
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500">Outcome</span>
          <span className={`px-2 py-0.5 rounded font-semibold border ${
            data.outcome === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
          } capitalize`}>
            {data.outcome || 'completed'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
          <Flag className="w-3 h-3" /> {data.notifyList?.length || 0} notifications
        </div>
      </div>
    </BaseNode>
  );
}