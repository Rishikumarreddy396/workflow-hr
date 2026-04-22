import { Handle, Position } from '@xyflow/react';
import { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';

interface BaseNodeProps {
  id: string;
  selected?: boolean;
  label: string;
  subLabel?: string;
  icon?: ReactNode;
  children?: ReactNode;
  isStart?: boolean;
  isEnd?: boolean;
  status?: 'success' | 'warning' | 'error' | 'pending';
}

export function BaseNode({ id, selected, label, subLabel, icon, children, isStart, isEnd, status = 'pending' }: BaseNodeProps) {
  // Status indicator colors based on the reference images
  const statusColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    pending: 'bg-slate-300'
  };

  return (
    <div className={`relative min-w-[280px] bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-200 transition-all ${
        selected ? 'ring-2 ring-indigo-500/50 border-indigo-500 shadow-lg' : 'hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Top Header Section */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-100">
        <div className="mt-0.5 flex-shrink-0 bg-slate-50 p-1.5 rounded-md border border-slate-100">
          {icon}
        </div>
        <div className="flex flex-col flex-grow">
          <div className="flex justify-between items-center w-full">
            <span className="font-semibold text-slate-800 text-[13px]">{label}</span>
            {/* Status dot */}
            <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          </div>
          {subLabel && <span className="text-[11px] text-slate-500 font-medium">{subLabel}</span>}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="px-4 py-3 text-sm text-slate-600 flex flex-col gap-3">
        {children}
      </div>

      {/* Footer Metrics (Mimicking the [11] [27] [41] pills from Image 1) */}
      <div className="px-4 py-2 bg-slate-50/50 rounded-b-xl border-t border-slate-100 flex items-center gap-3">
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
          <Clock className="w-3 h-3 text-slate-400" /> 12m
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 41
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
          <AlertCircle className="w-3 h-3 text-rose-500" /> 2
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm ml-auto">
          <Zap className="w-3 h-3 text-indigo-500" /> 99%
        </div>
      </div>

      {/* Handles */}
      {!isStart && (
        <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-slate-400 border-2 border-white" />
      )}
      {!isEnd && (
        <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-indigo-500 border-2 border-white" />
      )}
    </div>
  );
}