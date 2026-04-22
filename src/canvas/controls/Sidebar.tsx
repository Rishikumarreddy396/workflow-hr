import { PlayCircle, User, UserCheck, Zap, StopCircle, LayoutDashboard, Shield, Calendar, BarChart3, Settings, HelpCircle } from 'lucide-react';

const nodeCategories = [
  {
    title: 'Automation Nodes',
    items: [
      { type: 'start', label: 'Initialize Data', icon: <PlayCircle className="w-4 h-4 text-emerald-600" /> },
      { type: 'task', label: 'User Task', icon: <User className="w-4 h-4 text-indigo-600" /> },
      { type: 'approval', label: 'Data Validation', icon: <UserCheck className="w-4 h-4 text-purple-600" /> },
      { type: 'automated_step', label: 'Trigger Action', icon: <Zap className="w-4 h-4 text-amber-500" /> },
      { type: 'end', label: 'Finalize Output', icon: <StopCircle className="w-4 h-4 text-rose-500" /> },
    ]
  }
];

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-2">
        <div className="w-6 h-6 bg-rose-600 rounded-md flex items-center justify-center">
          <Zap className="w-3 h-3 text-white fill-current" />
        </div>
        <span className="font-bold text-slate-800 tracking-tight">CodeAuto</span>
      </div>

      {/* Fake Top Nav matching image 1 */}
      <div className="p-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">General</span>
        <div className="mt-2 flex flex-col gap-0.5">
          <div className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium bg-rose-50 text-rose-700 rounded-lg">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <Shield className="w-4 h-4" /> Compliance
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-3">
        {nodeCategories.map((cat, idx) => (
          <div key={idx} className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              {cat.title}
            </span>
            <div className="flex flex-col gap-1.5">
              {cat.items.map((node) => (
                <div
                  key={node.type}
                  className="flex items-center gap-3 p-2.5 border border-slate-200 rounded-lg cursor-grab hover:border-indigo-500 hover:shadow-sm bg-white transition-all group"
                  onDragStart={(e) => onDragStart(e, node.type)}
                  draggable
                >
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                    {node.icon}
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700">{node.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Nav */}
      <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer">
          <Settings className="w-4 h-4" /> Settings
        </div>
        <div className="flex items-center gap-3 px-2 py-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer">
          <HelpCircle className="w-4 h-4" /> Help & Support
        </div>
      </div>
    </div>
  );
}