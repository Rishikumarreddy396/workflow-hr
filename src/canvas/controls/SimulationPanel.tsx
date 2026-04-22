import { useState } from 'react';
import { Play, X, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { simulateWorkflow } from '../../api/mockApi';
import type { SimulationResult } from '../../types/simulation';

export function SimulationPanel() {
  const { nodes, edges } = useWorkflowStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const runSimulation = async () => {
    setIsOpen(true);
    setLoading(true);
    const res = await simulateWorkflow(nodes, edges);
    setResult(res);
    setLoading(false);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    if (min > 0) return `${min}m ${sec % 60}s`;
    return `${sec}s`;
  };

  return (
    <>
      {/* Floating Run Button */}
      <button
        onClick={runSimulation}
        className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md font-medium transition-all"
      >
        <Play className="w-4 h-4 fill-current" />
        Run Simulation
      </button>

      {/* Slide-up Results Panel */}
      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white border-t border-gray-200 shadow-2xl z-40 flex flex-col transform transition-transform">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Execution Logs
              {result && !loading && (
                <span className={`text-xs px-2 py-1 rounded-full ${result.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {result.ok ? 'Success' : 'Failed'} ({formatDuration(result.totalDurationMs)})
                </span>
              )}
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-grow overflow-y-auto p-6 bg-gray-50/50">
            {loading ? (
              <div className="flex justify-center items-center h-full text-gray-400 gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                Running simulation...
              </div>
            ) : (
              <div className="max-w-4xl mx-auto flex flex-col gap-4">
                {/* Fatal Errors */}
                {result?.fatalErrors.map((err, i) => (
                  <div key={`fatal-${i}`} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                    <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium">{err}</p>
                  </div>
                ))}

                {/* Timeline Logs */}
                {result?.logs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        log.status === 'success' ? 'bg-green-100 text-green-600' :
                        log.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {log.status === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {log.status === 'warning' && <AlertTriangle className="w-5 h-5" />}
                        {log.status === 'error' && <XCircle className="w-5 h-5" />}
                      </div>
                      {i !== result.logs.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1"></div>}
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex-grow mb-2 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-800 text-sm">Step {log.step}: {log.nodeLabel}</span>
                        <span className="text-xs text-gray-400 font-mono">{formatDuration(log.durationMs)}</span>
                      </div>
                      <p className={`text-sm ${
                        log.status === 'success' ? 'text-gray-600' :
                        log.status === 'warning' ? 'text-yellow-700' :
                        'text-red-600 font-medium'
                      }`}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}