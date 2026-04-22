import { PlayCircle } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import type { StartNodeType } from '../../types/nodes';

export function StartNode({ id, data, selected }: StartNodeType) {
  return (
    <BaseNode 
      id={id} 
      selected={selected} 
      label={data.label || "Start Workflow"} 
      icon={<PlayCircle className="w-5 h-5 text-green-500" />}
      isStart
    >
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">Trigger:</span>
        <span className="font-medium bg-green-100 text-green-700 px-2 py-1 rounded-md capitalize">
          {/* THE FIX IS HERE: Add the ? before .replace and a fallback */}
          {data.triggerEvent?.replace('_', ' ') || 'Manual'}
        </span>
      </div>
    </BaseNode>
  );
}