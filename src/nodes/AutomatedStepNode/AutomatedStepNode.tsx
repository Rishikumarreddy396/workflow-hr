import { Zap } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { AutomatedStepNodeType } from '../../types/nodes';

export function AutomatedStepNode({ id, data, selected }: AutomatedStepNodeType) {
  return (
    <BaseNode id={id} selected={selected} label={data.label || "Automation"} icon={<Zap className="w-5 h-5 text-yellow-500" />}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">Action:</span>
        <span className="font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md">
          {data.action?.replace('_', ' ') || 'None'}
        </span>
      </div>
    </BaseNode>
  );
}