import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";

import type {
  WorkflowNodeType,
  WorkflowNodeData,
  WorkflowEdge,
  NodeDataByType,
} from "../types/nodes";

// ─────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────
interface WorkflowState {
  nodes: WorkflowNodeType[];
  edges: WorkflowEdge[];
  /** ID of the node currently open in the side-panel editor */
  selectedNodeId: string | null;
}

// ─────────────────────────────────────────────
// Actions shape
// ─────────────────────────────────────────────
interface WorkflowActions {
  // ── React Flow wiring ──────────────────────
  onNodesChange: (changes: NodeChange<WorkflowNodeType>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  // ── Node CRUD ──────────────────────────────
  addNode: (node: WorkflowNodeType) => void;
  removeNode: (nodeId: string) => void;

  /**
   * Patch any subset of a node's data payload.
   * The generic T ties the update shape to the correct node type,
   * giving you type-safe form submissions.
   *
   * Usage:
   *   updateNodeData<"task">(id, { assignee: "user_42", priority: "high" })
   */
  updateNodeData: <T extends WorkflowNodeType["type"]>(
    nodeId: string,
    patch: Partial<NodeDataByType<T>>
  ) => void;

  // ── Selection ──────────────────────────────
  selectNode: (nodeId: string | null) => void;

  // ── Bulk operations ────────────────────────
  /** Replace the entire graph — used when loading a saved workflow */
  loadWorkflow: (nodes: WorkflowNodeType[], edges: WorkflowEdge[]) => void;
  clearWorkflow: () => void;
}

type WorkflowStore = WorkflowState & WorkflowActions;

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────
export const useWorkflowStore = create<WorkflowStore>()(
  // temporal() wraps the store with undo/redo — zundo tracks diffs automatically
  temporal(
    // immer() lets us write mutating logic; it produces the correct immutable update
    immer((set) => ({
      // ── Initial state ──────────────────────
      nodes: [],
      edges: [],
      selectedNodeId: null,

      // ── React Flow wiring ──────────────────
      onNodesChange: (changes) =>
        set((state) => {
          // applyNodeChanges handles move / select / remove diffs from React Flow
          state.nodes = applyNodeChanges(
            changes,
            state.nodes
          ) as WorkflowNodeType[];
        }),

      onEdgesChange: (changes) =>
        set((state) => {
          state.edges = applyEdgeChanges(
            changes,
            state.edges
          ) as WorkflowEdge[];
        }),

      onConnect: (connection) =>
        set((state) => {
          state.edges = addEdge(
            {
              ...connection,
              // Attach metadata scaffold — fill in condition expressions later
              data: { label: "", conditionExpression: "" },
            },
            state.edges
          ) as WorkflowEdge[];
        }),

      // ── Node CRUD ──────────────────────────
      addNode: (node) =>
        set((state) => {
          state.nodes.push(node);
        }),

      removeNode: (nodeId) =>
        set((state) => {
          // Remove the node AND any edges that reference it
          state.nodes = state.nodes.filter((n) => n.id !== nodeId);
          state.edges = state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          );
          if (state.selectedNodeId === nodeId) {
            state.selectedNodeId = null;
          }
        }),

      updateNodeData: (nodeId, patch) =>
        set((state) => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node) return;

          // Merge the patch and stamp updatedAt — cast is safe because
          // the generic T constrains callers to pass the right shape
          node.data = {
            ...node.data,
            ...(patch as Partial<WorkflowNodeData>),
            updatedAt: new Date().toISOString(),
          };
        }),

      // ── Selection ──────────────────────────
      selectNode: (nodeId) =>
        set((state) => {
          state.selectedNodeId = nodeId;
        }),

      // ── Bulk operations ────────────────────
      loadWorkflow: (nodes, edges) =>
        set((state) => {
          state.nodes = nodes;
          state.edges = edges;
          state.selectedNodeId = null;
        }),

      clearWorkflow: () =>
        set((state) => {
          state.nodes = [];
          state.edges = [];
          state.selectedNodeId = null;
        }),
    }))
  )
);

// ─────────────────────────────────────────────
// Granular selectors — import these in components
// to avoid full-store re-renders
// ─────────────────────────────────────────────

/** Returns the full data object for a single node by ID */
export const selectNodeById =
  (id: string) => (state: WorkflowStore) =>
    state.nodes.find((n) => n.id === id);

/** Returns the currently selected node (panel editor) */
export const selectActiveNode = (state: WorkflowStore) =>
  state.nodes.find((n) => n.id === state.selectedNodeId) ?? null;

/** Expose undo/redo from the temporal middleware */
export const useWorkflowHistory = () =>
  useWorkflowStore.temporal.getState();