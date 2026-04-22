import { Handle, Position } from '@xyflow/react';
import { ReactNode } from 'react';

interface BaseNodeProps {
  id: string;
  selected?: boolean;
  label: string;
  icon?: ReactNode;
  children?: ReactNode;
  isStart?: boolean;
  isEnd?: boolean;
}

export function BaseNode({ selected, label, icon, children, isStart, isEnd }: BaseNodeProps) {
  return (
    <div className={`relative min-w-[200px] bg-white rounded-xl shadow-sm border-2 transition-all ${
        selected ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        {icon && <div className="text-gray-500">{icon}</div>}
        <span className="font-semibold text-gray-700 text-sm">{label}</span>
      </div>

      {/* Body */}
      <div className="p-4 text-sm text-gray-600 flex flex-col gap-2">
        {children}
      </div>

      {/* Input Handle (Hide if Start Node) */}
      {!isStart && (
        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      )}
      
      {/* Output Handle (Hide if End Node) */}
      {!isEnd && (
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
      )}
    </div>
  );
}