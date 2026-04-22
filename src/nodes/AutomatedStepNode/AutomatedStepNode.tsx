import { Zap, Activity } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { AutomatedStepNodeType } from '../../types/nodes';

export function AutomatedStepNode({ id, data, selected }: AutomatedStepNodeType) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      label={data.label || "Trigger Automation"}
      subLabel="Workflows on Triggers"
      icon={<Zap className="w-4 h-4 text-amber-500" />}
      status={data.lastRunStatus === 'failure' ? 'error' : 'pending'}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500">Action</span>
          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 font-semibold rounded border border-amber-100">
            {data.action?.replace('_', ' ') || 'None'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Retries: {data.retryCount || 0}</span>
          <span className="capitalize text-slate-500">{data.failurePolicy || 'halt'} on fail</span>
        </div>
      </div>
    </BaseNode>
  );
}