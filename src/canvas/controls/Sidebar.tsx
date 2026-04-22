import { PlayCircle, ClipboardList, UserCheck, Zap, StopCircle } from 'lucide-react';

const availableNodes = [
  { type: 'start', label: 'Start Node', icon: <PlayCircle className="w-5 h-5 text-green-500" /> },
  { type: 'task', label: 'Task Node', icon: <ClipboardList className="w-5 h-5 text-blue-500" /> },
  { type: 'approval', label: 'Approval Node', icon: <UserCheck className="w-5 h-5 text-purple-500" /> },
  { type: 'automated_step', label: 'Automated Step', icon: <Zap className="w-5 h-5 text-yellow-500" /> },
  { type: 'end', label: 'End Node', icon: <StopCircle className="w-5 h-5 text-red-500" /> },
];

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-3">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Workflow Nodes</h2>
      <p className="text-xs text-gray-500 mb-2">Drag and drop nodes onto the canvas.</p>
      
      {availableNodes.map((node) => (
        <div
          key={node.type}
          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:border-blue-500 hover:shadow-sm bg-gray-50 transition-all"
          onDragStart={(e) => onDragStart(e, node.type)}
          draggable
        >
          {node.icon}
          <span className="text-sm font-medium text-gray-700">{node.label}</span>
        </div>
      ))}
    </div>
  );
}