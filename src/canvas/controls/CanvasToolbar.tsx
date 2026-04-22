import { Undo2, Redo2, Download, Upload } from 'lucide-react';
import { useWorkflowStore, useWorkflowHistory } from '../../store/workflowStore';

export function CanvasToolbar() {
  const { nodes, edges, loadWorkflow } = useWorkflowStore();
  const { undo, redo } = useWorkflowHistory();

  // Export logic: Download current state as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "workflow-export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import logic: Read JSON and load into store
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (content.nodes && content.edges) {
          loadWorkflow(content.nodes, content.edges);
        } else {
          alert("Invalid workflow file format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md border border-slate-200">
      <button onClick={() => undo()} className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Undo">
        <Undo2 className="w-4 h-4" />
      </button>
      <button onClick={() => redo()} className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Redo">
        <Redo2 className="w-4 h-4" />
      </button>
      
      <div className="w-px h-5 bg-slate-200 mx-1" />
      
      <button onClick={handleExport} className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors flex items-center gap-1 text-[12px] font-medium" title="Export JSON">
        <Download className="w-4 h-4" /> Export
      </button>
      
      <label className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors flex items-center gap-1 text-[12px] font-medium cursor-pointer" title="Import JSON">
        <Upload className="w-4 h-4" /> Import
        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
      </label>
    </div>
  );
}