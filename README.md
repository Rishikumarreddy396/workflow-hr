# HR Workflow Designer

> A visual, node-based workflow automation tool for HR processes — built as a full-stack engineering assessment prototype for Tredence.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Node Type Reference](#node-type-reference)
- [Mock API Layer](#mock-api-layer)
- [Assumptions Made](#assumptions-made)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Project Overview

The **HR Workflow Designer** is an interactive, canvas-based tool that lets HR teams visually design, configure, and simulate multi-step employee lifecycle workflows — without writing code.

A workflow is modelled as a directed graph. Each node in the graph represents a discrete step in a business process: a manual task assigned to a team member, a human approval gate, an automated system action (send an email, provision access, call a webhook), or a terminal outcome. Edges between nodes represent transitions, which can carry conditional labels (e.g. *Approved / Rejected*).

**Core capabilities delivered in this prototype:**

- **Visual canvas** — drag, drop, pan, and zoom to build workflows using React Flow
- **Five configurable node types** — each with its own data schema and edit form
- **Type-safe state management** — Zustand + Immer store with full undo/redo support via `zundo`
- **Workflow simulation engine** — BFS graph traversal that validates structure and produces a step-by-step execution log
- **Mock API layer** — simulated network latency, automation catalogue endpoint, and simulation endpoint

The prototype was scoped to demonstrate frontend architecture quality, TypeScript discipline, and product thinking — not backend persistence.

---

## Live Demo

> _If deployed, add your Vercel / Netlify URL here._

```
https://hr-workflow-designer.vercel.app
```

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Build tooling | **Vite 5** | Near-instant HMR and ESM-native dev server |
| UI framework | **React 18** | Component model is a natural fit for node-based UIs |
| Language | **TypeScript 5** | Strict typing prevents entire classes of graph-state bugs |
| Canvas / graph | **React Flow (`@xyflow/react`)** | Production-grade node-edge rendering with built-in handles, minimap, and controls |
| Global state | **Zustand** | Minimal boilerplate; selector-based subscriptions prevent unnecessary re-renders |
| Immutable updates | **Immer** | Write mutating logic (e.g. "remove node + all its edges") as readable imperative code |
| Undo / redo | **Zundo** | Wraps the Zustand store with a temporal diff layer — undo/redo is one function call |
| Styling | **Tailwind CSS** | Utility-first; co-located styles scale better than CSS modules for component-heavy UIs |

---

## Getting Started

### Prerequisites

- Node.js `>= 18.x`
- npm `>= 9.x`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/hr-workflow-designer.git
cd hr-workflow-designer

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Additional Scripts

```bash
npm run build        # Production build (output: /dist)
npm run preview      # Serve the production build locally
npm run typecheck    # Run tsc --noEmit for type validation
npm run lint         # ESLint across all TypeScript source files
```

---

## Project Structure

```
src/
├── app/
│   └── main.tsx                  # Application entry point
│
├── canvas/                       # React Flow canvas layer
│   ├── WorkflowCanvas.tsx        # Root canvas: wires RF to Zustand store
│   ├── hooks/
│   │   ├── useCanvasHandlers.ts  # onConnect, onNodesChange, onEdgesChange
│   │   └── useLayoutEngine.ts    # Dagre auto-layout helpers
│   └── controls/
│       ├── CanvasToolbar.tsx     # Add-node palette, undo/redo buttons
│       └── MiniMapPanel.tsx
│
├── nodes/                        # One sub-folder per node type
│   ├── registry.ts               # Maps type string → React component
│   ├── BaseNode.tsx              # Shared chrome: handles, selection ring
│   ├── StartNode/
│   ├── EndNode/
│   ├── TaskNode/
│   ├── ApprovalNode/
│   └── AutomatedStepNode/        # Each folder: NodeComponent + NodeForm
│
├── store/
│   ├── workflowStore.ts          # Primary graph state + actions
│   └── uiStore.ts                # Sidebar visibility, active panel, etc.
│
├── types/
│   ├── nodes.ts                  # All node data interfaces + union types
│   ├── simulation.ts             # SimulationResult, SimulationLogEntry
│   └── workflow.ts               # Workflow-level metadata
│
├── api/
│   ├── mockApi.ts                # Simulated GET /automations, POST /simulate
│   └── hooks/
│       ├── useWorkflowQuery.ts   # React Query wrappers (save/load)
│       └── useSimulation.ts      # Simulation trigger + result state
│
└── lib/
    ├── nodeFactory.ts            # createNode(type) → node with sane defaults
    └── workflowValidator.ts      # Pre-save validation (orphan check, etc.)
```

The key organisational principle is **separation by concern, not by file type**. Canvas logic, node logic, state logic, and API logic each live in their own top-level directory. Adding a new node type means adding one folder under `nodes/` and one entry in `registry.ts` — nothing else changes.

---

## Architecture & Design Decisions

### 1. Zustand over Redux (or React Context)

Redux adds significant boilerplate for a prototype of this scope. React Context re-renders every consumer on any state change — untenable for a graph where hundreds of node positions update on every drag event.

Zustand's selector API means a node component only re-renders when *its own data* changes:

```typescript
// This component is immune to position changes on other nodes
const label = useWorkflowStore(
  useCallback((s) => selectNodeById(nodeId)(s)?.data.label, [nodeId])
);
```

### 2. Immer for Graph Mutation

Removing a node requires splicing the nodes array *and* filtering every edge that references it. Doing this immutably with spread operators is error-prone and hard to read. With Immer, the intent is immediately clear:

```typescript
removeNode: (nodeId) =>
  set((state) => {
    state.nodes = state.nodes.filter((n) => n.id !== nodeId);
    state.edges = state.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
  }),
```

Immer produces the correct structural clone under the hood — no mutation ever escapes the `set` callback.

### 3. Zundo for Time-Travel State (Undo / Redo)

`zundo` wraps the Zustand store as a temporal middleware. It records a diff on every `set` call, making undo/redo trivially available to any component:

```typescript
const { undo, redo, clear } = useWorkflowStore.temporal.getState();
```

This was chosen over a manual history stack because it operates at the middleware layer — it catches *all* state changes automatically, including those from React Flow's internal `applyNodeChanges`.

### 4. Generic `updateNodeData<T>` for Type-Safe Forms

Each node type has a distinct data schema. Rather than a single untyped `updateNode` action, the store exposes a generic that ties the update shape to the correct interface at compile time:

```typescript
// TypeScript will reject this at compile time —
// 'assignee' does not exist on ApprovalNodeData
updateNodeData<"approval">(id, { assignee: "user_42" }); // ✗ Error

// Correct — both field and value are validated
updateNodeData<"approval">(id, { approverRole: "hr_manager" }); // ✓ OK
```

This turns what would be runtime bugs (wrong fields written to the wrong node) into build-time errors.

### 5. Simulation Engine: BFS over DFS

The simulation engine uses a **Breadth-First Search** traversal rather than depth-first for two reasons:

- **Execution order** — BFS produces a log where each "layer" of parallel steps appears together. This mirrors how a real workflow engine would schedule concurrent branches (e.g. two parallel task assignments).
- **Cycle safety** — BFS with a `visited` set naturally prevents infinite loops on cyclic graphs without needing a recursion call stack.

The traversal is a pure function over `(nodes, edges)` — it has no side effects and is trivially unit-testable.

### 6. Separating Canvas Logic from Node Logic

React Flow's `onNodesChange` / `onEdgesChange` handlers live in `canvas/hooks/useCanvasHandlers.ts`, not inside individual node components. Node components only read their own data slice from the store and emit `updateNodeData` calls. This means:

- Node components are **completely portable** — they can be rendered in a form panel, a preview thumbnail, or a test harness without a canvas
- The canvas can be swapped out (e.g. for a different graph library) without touching any node component

---

## Node Type Reference

| Node | Purpose | Key Fields |
|---|---|---|
| **Start** | Workflow entry point | `triggerEvent`, `allowedInitiators` |
| **Task** | Manual work item assigned to a person | `assignee`, `dueDate`, `priority`, `subtasks` |
| **Approval** | Human approval gate with escalation | `approverRole`, `autoApproveThreshold`, `escalationAfterDays`, `escalationPolicy` |
| **Automated Step** | System action requiring no human input | `action`, `actionConfig`, `failurePolicy`, `retryCount` |
| **End** | Terminal state | `outcome`, `notifyList`, `generateSummaryReport` |

All node data types extend a shared `BaseNodeData` interface that enforces `label`, `description`, `createdAt`, and `updatedAt` on every node.

---

## Mock API Layer

Two async functions in `src/api/mockApi.ts` simulate network I/O with randomised latency. No service worker or external dependency is required.

### `getAutomations(): Promise<AutomationDefinition[]>`

Simulates `GET /automations`. Returns a catalogue of 8 automation actions, each with a `params` array describing the configuration schema. The `AutomatedStepNodeForm` consumes this to render its fields dynamically — adding a new automation to the catalogue automatically adds it to the UI.

### `simulateWorkflow(nodes, edges): Promise<SimulationResult>`

Simulates `POST /simulate`. Performs a full BFS traversal and returns a `SimulationResult` containing:

- `ok: boolean` — whether the workflow passed all validations
- `logs: SimulationLogEntry[]` — one entry per visited node with `status`, `message`, `detail`, and `durationMs`
- `fatalErrors: string[]` — pre-flight errors that blocked traversal entirely
- `totalDurationMs: number` — sum of all simulated step durations (useful for "estimated completion time")

**Validation coverage:**

```
✗  No Start node                   → fatal error (traversal blocked)
✗  Multiple Start nodes            → fatal error (traversal blocked)
✗  No End node                     → fatal error (traversal blocked)
✗  Task missing assignee/dueDate   → error log (branch halts)
✗  AutomatedStep with no action    → error log (branch halts)
✗  Dead-end non-End node           → error log (branch halts)
⚠  Approval with one outgoing path → warning log (traversal continues)
⚠  AutomatedStep with empty config → warning log (traversal continues)
⚠  Orphan node (no incoming edge)  → warning log (pre-flight)
⚠  Unreachable node                → warning log (post-flight)
⚠  Cycle detected                  → warning log (branch halts)
```

---

## Assumptions Made

The following explicit assumptions were made to scope the prototype appropriately for a case study assessment.

1. **No backend persistence.** Workflow state lives entirely in the Zustand store. There is no database, no authentication, and no server. A real implementation would persist to a backend via `POST /workflows` and `GET /workflows/:id`.

2. **Single workflow per session.** The prototype manages one workflow at a time. A production tool would have a dashboard listing saved workflows with versioning.

3. **Simulated API latency is non-deterministic by design.** Random delay ranges (e.g. 120–380 ms for `getAutomations`) make the loading states visible during review without needing a real network.

4. **Workflow simulation is structural, not behavioural.** The engine validates graph structure and node configuration completeness. It does not evaluate conditional edge expressions or run actual integrations — that would require a backend execution engine (e.g. Temporal, Airflow).

5. **Tailwind CSS is used without a custom design system.** The colour palette and spacing are intentionally plain to keep the focus on architecture. A production tool would use a design token system (e.g. Radix UI Themes, shadcn/ui).

6. **Node positions are managed by React Flow's internal state.** Position data is persisted within the `nodes` array via React Flow's `applyNodeChanges` — no separate position store was needed.

---

## Known Limitations

- **No unit or integration tests.** Given the time constraint of a case study, tests were not written. The simulation engine (`src/api/mockApi.ts`) and the node factory (`src/lib/nodeFactory.ts`) are pure functions and are the highest-priority targets for a test suite.
- **No keyboard accessibility audit.** The canvas interaction model (drag-and-drop, click-to-select) is inherently pointer-centric. Accessibility would require custom keyboard navigation and ARIA roles on node cards.
- **Undo/redo is wired in state only.** The `zundo` middleware is fully operational, but UI buttons to trigger `undo()` / `redo()` were not added to the toolbar in this prototype pass.

---

## Future Improvements

Listed in rough order of product impact:

**Short term (next sprint)**

- **Undo / Redo toolbar buttons** — The `zundo` temporal store is already wired. This is a one-line integration: `useWorkflowStore.temporal.getState().undo()`.
- **Export / Import JSON** — Serialise the full `{ nodes, edges }` graph to a JSON file for sharing and version control. Import reconstructs the store state.
- **Conditional edge labels** — Allow edges out of Approval and Decision nodes to carry a `conditionExpression` that the simulation engine evaluates.

**Medium term**

- **Node templates / snippets** — Pre-built sub-graphs for common HR processes (e.g. "Standard Onboarding", "PIP Process") that a user can drag onto the canvas and customise.
- **Auto-layout engine** — A Dagre or ELK.js pass to automatically arrange nodes into a clean top-down hierarchy when the workflow is first loaded or when the user requests it.
- **Unit test suite** — Jest + React Testing Library. Priority targets: `simulateWorkflow` BFS logic, `workflowStore` action reducers, and each `NodeForm` validation.

**Long term**

- **Backend persistence layer** — A REST or GraphQL API (e.g. Node.js + PostgreSQL) to save, version, and publish workflows. Optimistic updates in the Zustand store would keep the UI snappy.
- **Real-time collaboration** — Multi-cursor canvas editing via WebSockets (Liveblocks or PartyKit), with Zustand actions broadcast to all connected sessions.
- **Execution engine integration** — Connect the "Run Simulation" action to a real workflow orchestrator (Temporal.io, AWS Step Functions) for live execution with audit logs.
- **Role-based access control** — Restrict who can view, edit, or publish a workflow based on HR department and seniority level.

---

## Author

Built by **[Your Name]** as part of the Tredence Full Stack Engineering Intern assessment.

- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [linkedin.com/in/your-profile](https://linkedin.com/in/your-profile)

---

<p align="center">
  <sub>Designed and built with care. Every architectural decision documented above was made intentionally.</sub>
</p>