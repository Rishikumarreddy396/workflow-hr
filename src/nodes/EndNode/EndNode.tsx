import { StopCircle } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { EndNodeType } from '../../types/nodes';

export function EndNode({ id, data, selected }: EndNodeType) {
  return (
    <BaseNode id={id} selected={selected} label={data.label || "End Workflow"} icon={<StopCircle className="w-5 h-5 text-red-500" />} isEnd>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">Outcome:</span>
        <span className="font-medium bg-red-100 text-red-700 px-2 py-1 rounded-md capitalize">
          {data.outcome || 'completed'}
        </span>
      </div>
    </BaseNode>
  );
}