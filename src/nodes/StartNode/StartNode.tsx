import { PlayCircle, GitCommit } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { StartNodeType } from '../../types/nodes';

export function StartNode({ id, data, selected }: StartNodeType) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      label={data.label || "Initialize Data"}
      subLabel="Initializing for Automation"
      icon={<PlayCircle className="w-4 h-4 text-emerald-600" />}
      status="success"
      isStart
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500">Trigger Event</span>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 font-semibold rounded capitalize border border-emerald-100">
            {data.triggerEvent?.replace('_', ' ') || 'Manual'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
          <GitCommit className="w-3 h-3" /> Entry point configured
        </div>
      </div>
    </BaseNode>
  );
}