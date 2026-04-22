import { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../store/workflowStore';
import { nodeTypes } from '../nodes/registry';
import { Sidebar } from './controls/Sidebar';
import type { WorkflowNodeType } from '../types/nodes';
import { PropertiesPanel } from './controls/PropertiesPanel';
import { SimulationPanel } from './controls/SimulationPanel';
import { CanvasToolbar } from './controls/CanvasToolbar';

function CanvasArea() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode, addNode } = useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Scaffold a basic default node to satisfy TS until we build the Form panel
      const newNode: WorkflowNodeType = {
        id: `${type}-${Date.now()}`,
        type: type as any,
        position,
        data: { 
          label: `${type} Node`, 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString() 
        } as any,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div className="flex-grow h-full relative" onDrop={onDrop} onDragOver={onDragOver}>
      <CanvasToolbar />
      {/* Simulation Panel inserted here */}
      <SimulationPanel />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        defaultEdgeOptions={{ 
          type: 'smoothstep', 
          style: { stroke: '#6366f1', strokeWidth: 2 } // Indigo colored edges
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => selectNode(null)}
        onNodeClick={(_, node) => selectNode(node.id)}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <div className="w-full h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar />
      <ReactFlowProvider>
        <CanvasArea />
      </ReactFlowProvider>

      {/* Properties Panel for editing nodes */}
      <PropertiesPanel />
    </div>
  );
}