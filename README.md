# HR Workflow Designer

> A visual, node-based workflow automation tool for HR processes —
> built as a full-stack engineering assessment prototype for Tredence.

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Node Type Reference](#node-type-reference)
- [Mock API Layer](#mock-api-layer)
- [Assumptions Made](#assumptions-made)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Project Overview

The **HR Workflow Designer** is an interactive, canvas-based tool that lets HR teams visually design, configure, and simulate multi-step employee lifecycle workflows — without writing any code.

A workflow is modelled as a **directed graph**. Each node represents a discrete business process step: a manual task assigned to a team member, a human approval gate, an automated system action (send an email, provision access, call a webhook), or a terminal outcome. Edges between nodes represent transitions and can carry conditional labels such as *Approved* or *Rejected*.

### Core Capabilities

| Feature | Description |
|---|---|
| **Visual Canvas** | Drag, drop, pan, and zoom to compose workflows on a React Flow canvas |
| **5 Node Types** | Start, Task, Approval, Automated Step, and End — each with a dedicated configuration form |
| **Type-Safe State** | Zustand + Immer store with full undo/redo support powered by `zundo` |
| **Simulation Engine** | BFS graph traversal that validates workflow structure and produces a step-by-step execution log |
| **Mock API Layer** | Simulated network latency, an automation catalogue endpoint, and a simulation endpoint |

The prototype was deliberately scoped to demonstrate **frontend architecture quality, TypeScript discipline, and product thinking** — not backend persistence.

---

## Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Build tooling | **Vite** | 5.x | Near-instant HMR and ESM-native dev server — no Webpack config overhead |
| UI framework | **React** | 18 | Component model maps naturally to node-based canvas UIs |
| Language | **TypeScript** | 5.x | Strict typing eliminates entire classes of graph-state bugs at compile time |
| Canvas / graph | **React Flow** (`@xyflow/react`) | latest | Production-grade node-edge rendering with built-in handles, minimap, and viewport controls |
| Global state | **Zustand** | 4.x | Minimal boilerplate; selector-based subscriptions prevent re-renders unrelated to the changed slice |
| Immutable updates | **Immer** | latest | Write readable mutating logic (e.g. "delete node + all its edges") without error-prone spread chains |
| Undo / Redo | **Zundo** | latest | Temporal middleware wrapping the Zustand store — undo/redo added with zero manual history management |
| Styling | **Tailwind CSS** | **v4** | Utility-first CSS via the new first-party Vite plugin; `@theme` directive replaces `tailwind.config.js` entirely |

---

## Getting Started

### Prerequisites

- **Node.js** `>= 18.x`
- **npm** `>= 9.x`

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/hr-workflow-designer.git
cd hr-workflow-designer

# 2. Install all dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Type-check + production bundle  →  /dist
npm run preview      # Serve the production build locally
npm run typecheck    # Run tsc --noEmit (type validation, no emit)
npm run lint         # ESLint across all TypeScript source files
```

---

## Project Structure

```
src/
├── app/
│   └── main.tsx                    # Application entry point, React root
│
├── canvas/                         # React Flow canvas layer — no node business logic
│   ├── WorkflowCanvas.tsx          # Root canvas: wires React Flow callbacks to Zustand
│   ├── hooks/
│   │   ├── useCanvasHandlers.ts    # onConnect, onNodesChange, onEdgesChange
│   │   └── useLayoutEngine.ts      # Dagre auto-layout helpers
│   └── controls/
│       ├── CanvasToolbar.tsx       # Node palette, undo/redo buttons
│       └── MiniMapPanel.tsx
│
├── nodes/                          # One sub-folder per node type
│   ├── registry.ts                 # Maps type string → React component (single source of truth)
│   ├── BaseNode.tsx                # Shared chrome: connection handles, selection ring, label
│   ├── StartNode/
│   │   ├── StartNode.tsx
│   │   └── StartNodeForm.tsx
│   ├── TaskNode/
│   │   ├── TaskNode.tsx
│   │   └── TaskNodeForm.tsx
│   ├── ApprovalNode/
│   │   ├── ApprovalNode.tsx
│   │   └── ApprovalNodeForm.tsx
│   ├── AutomatedStepNode/
│   │   ├── AutomatedStepNode.tsx
│   │   └── AutomatedStepNodeForm.tsx
│   └── EndNode/
│       ├── EndNode.tsx
│       └── EndNodeForm.tsx
│
├── store/
│   ├── workflowStore.ts            # Primary graph state + all graph actions
│   └── uiStore.ts                  # Sidebar open/closed, selected node ID, active panel
│
├── types/
│   ├── nodes.ts                    # All node data interfaces, union types, NodeDataByType<T>
│   ├── simulation.ts               # SimulationResult, SimulationLogEntry, AutomationDefinition
│   └── workflow.ts                 # Workflow-level metadata (name, status, version)
│
├── api/
│   ├── mockApi.ts                  # Simulated GET /automations and POST /simulate
│   └── hooks/
│       ├── useWorkflowQuery.ts     # React Query wrappers for save/load
│       └── useSimulation.ts        # Simulation trigger hook + result state
│
└── lib/
    ├── nodeFactory.ts              # createNode(type) → node with validated defaults
    └── workflowValidator.ts        # Pre-save checks: orphan nodes, missing End, etc.
```

The guiding organisational principle is **separation by concern, not by file type**. Canvas logic, node logic, state logic, and API logic each live in their own top-level directory. Adding a sixth node type requires creating one folder under `nodes/` and one line in `registry.ts` — no other file changes.

---

## Architecture & Design Decisions

### 1. Zustand over Redux or React Context

Redux adds significant ceremony (action types, reducers, selectors, middleware wiring) that is disproportionate for a prototype of this scope. React Context is worse: it re-renders *every* consumer on any state change — untenable for a canvas where dozens of node positions update per animation frame during a drag event.

Zustand's selector pattern means each node component re-renders only when *its own data slice* changes:

```typescript
// This component is completely immune to position changes on other nodes
const label = useWorkflowStore(
  useCallback((s) => selectNodeById(nodeId)(s)?.data.label, [nodeId])
);
```

### 2. Immer for Readable Graph Mutation

Removing a node requires filtering the nodes array *and* removing every edge that references it. Writing this correctly with immutable spread operators is verbose and easy to get wrong. With Immer, the intent is immediately clear:

```typescript
removeNode: (nodeId) =>
  set((state) => {
    state.nodes = state.nodes.filter((n) => n.id !== nodeId);
    state.edges = state.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    if (state.selectedNodeId === nodeId) state.selectedNodeId = null;
  }),
```

Immer produces a correct structural clone behind the scenes. No mutation ever escapes the `set` callback, and the business logic reads like pseudocode.

### 3. Zundo for Time-Travel Undo / Redo

`zundo` is applied as temporal middleware directly around the Zustand store. It records a structural diff on every `set` call, making undo/redo available to any component — no manual history stack, no action replay, no boilerplate:

```typescript
const { undo, redo, clear } = useWorkflowStore.temporal.getState();
```

Critically, it intercepts *all* state changes automatically — including those produced by React Flow's internal `applyNodeChanges` — without requiring any instrumentation inside individual action handlers.

### 4. Generic `updateNodeData<T>` for Type-Safe Form Submissions

Each node type has a distinct, non-overlapping data schema. A single untyped `updateNode` action would allow any form to silently write incorrect fields to the wrong node. The generic action enforces correctness at compile time:

```typescript
// TypeScript rejects this — 'assignee' does not exist on ApprovalNodeData
updateNodeData<"approval">(id, { assignee: "user_42" }); // ✗ Compile error

// Correct — field name and value type are both statically validated
updateNodeData<"approval">(id, { approverRole: "hr_manager" }); // ✓ OK
```

This is powered by the `NodeDataByType<T>` conditional type in `src/types/nodes.ts`, which resolves `NodeDataByType<"task">` to `TaskNodeData` at the type level, turning what would be silent runtime bugs into build-time errors.

### 5. Simulation Engine: BFS over DFS

The simulation engine uses **Breadth-First Search** rather than depth-first for two deliberate reasons:

- **Execution order mirrors real workflow orchestrators.** BFS surfaces each "layer" of concurrent steps together in the log. If two Task nodes both follow a Start node, they appear as adjacent steps — not buried inside a nested branch. This matches the scheduling model of tools like Temporal.io and AWS Step Functions.
- **Cycle safety without stack risk.** BFS with a `visited` set prevents infinite loops on cyclic graphs naturally. A recursive DFS would risk a call-stack overflow on a sufficiently deep or looping workflow.

The traversal is a **pure function over `(nodes, edges)`** with no side effects, making it independently unit-testable without mounting any React component.

### 6. Canvas Logic Isolated from Node Logic

React Flow's `onNodesChange` / `onEdgesChange` handlers are confined to `canvas/hooks/useCanvasHandlers.ts`, not embedded in node components. Node components only read their own data slice from the store and emit `updateNodeData` calls. This separation means:

- Node components are **fully portable** — renderable in a side-panel form, a preview card, or a headless test without any canvas context.
- The canvas rendering layer can be replaced (e.g. with a different graph library) without touching any node component, form, or store action.

### 7. Tailwind CSS v4

This project adopts Tailwind CSS v4 with the new `@tailwindcss/vite` plugin. The `tailwind.config.js` file is eliminated entirely — CSS custom properties, theme tokens, and content scanning are declared in `src/styles/global.css` using the new `@theme` directive. This yields a leaner build pipeline with no PostCSS configuration and faster cold-start times in development.

---

## Node Type Reference

| Node | Role | Key Configuration Fields |
|---|---|---|
| **Start** | Workflow entry point; exactly one per graph | `triggerEvent`, `allowedInitiators` |
| **Task** | Manual work item assigned to a named person or role | `assignee`, `dueDate` (relative or absolute), `priority`, `subtasks[]` |
| **Approval** | Human approval gate with auto-escalation logic | `approverRole`, `autoApproveThreshold` (0–100 %), `escalationAfterDays`, `escalationPolicy` |
| **Automated Step** | System action that runs without human input | `action`, `actionConfig` (dynamic key-value map), `failurePolicy`, `retryCount` |
| **End** | Terminal state; multiple allowed for different outcomes | `outcome`, `notifyList[]`, `generateSummaryReport` |

All node data types extend a shared `BaseNodeData` interface that enforces `label`, `description`, `createdAt`, and `updatedAt` timestamps on every node — ensuring the store always has enough information to render a meaningful execution log entry without reaching into type-specific fields.

---

## Mock API Layer

Two `async` functions in `src/api/mockApi.ts` simulate network I/O with randomised latency. No service worker, no MSW setup, no external dependency — just a `setTimeout`-backed `delay()` helper.

### `getAutomations() → Promise<AutomationDefinition[]>`

Simulates `GET /automations`. Returns a catalogue of **8 automation actions**, each with a `params` array describing its configuration schema (field key, label, input type, required flag, and options for `select` fields). The `AutomatedStepNodeForm` consumes this array to render its fields dynamically — adding a new automation to the catalogue automatically exposes it in the UI with zero additional code changes.

### `simulateWorkflow(nodes, edges) → Promise<SimulationResult>`

Simulates `POST /simulate`. Runs a full BFS traversal and returns a structured `SimulationResult`:

| Field | Type | Description |
|---|---|---|
| `ok` | `boolean` | `true` if the workflow passed all validations |
| `logs` | `SimulationLogEntry[]` | One entry per visited node: `status`, `message`, `detail`, `durationMs` |
| `fatalErrors` | `string[]` | Pre-flight errors that blocked traversal entirely |
| `totalDurationMs` | `number` | Aggregate simulated duration — surfaceable as "estimated completion time" |

**Validation matrix:**

| Scenario | Severity | Behaviour |
|---|---|---|
| No Start node | `fatal` | Traversal never begins |
| Multiple Start nodes | `fatal` | Traversal never begins |
| No End node | `fatal` | Traversal never begins |
| Task missing `assignee` or `dueDate` | `error` | Branch halts; downstream nodes skipped |
| Automated Step with no `action` | `error` | Branch halts; downstream nodes skipped |
| Dead-end non-End node | `error` | Branch halts |
| Approval with only one outgoing path | `warning` | Logged; traversal continues |
| Automated Step with empty `actionConfig` | `warning` | Logged; traversal continues |
| Node with no incoming edge (orphan) | `warning` | Caught in pre-flight; logged before traversal |
| Node unreachable from Start | `warning` | Caught in post-flight pass |
| Cycle detected | `warning` | Branch halts to prevent infinite loop |

---

## Assumptions Made

The following scoping decisions were made explicitly to keep the prototype focused on demonstrating architecture quality.

1. **No backend persistence.** Workflow state lives entirely in the Zustand store. There is no database, server, or authentication layer. A production implementation would persist via `POST /workflows` and restore via `GET /workflows/:id`.

2. **Single workflow per session.** The prototype manages one active workflow at a time. A production tool would include a workflow dashboard with save history and versioning.

3. **Non-deterministic API latency is intentional.** Random delay ranges (e.g. 120–380 ms for `getAutomations`) make loading states visible and realistic during a review without requiring a live server.

4. **Simulation is structural, not behavioural.** The engine validates graph topology and configuration completeness. It does not evaluate conditional edge expressions or invoke real integrations — that requires a backend orchestration runtime.

5. **Node positions are managed by React Flow.** Position data is stored inside the `nodes` array and updated through React Flow's `applyNodeChanges` on every drag event. No separate position store is necessary.

6. **The `zundo` undo/redo is wired at the state layer only.** The temporal store is fully operational but UI affordances (toolbar buttons) were deferred — see Future Improvements.

---

## Known Limitations

- **No automated test suite.** The simulation engine and node factory are pure functions and are the highest-priority targets for a first round of unit tests. Form components warrant integration tests with React Testing Library.
- **No keyboard accessibility audit.** The canvas interaction model is pointer-centric by design. A production tool would require custom keyboard navigation, focus management, and ARIA roles on node cards.
- **Edge condition expressions are not evaluated.** Edges expose a `conditionExpression` field in their data schema, but the simulation engine currently traverses all outgoing edges unconditionally. Evaluation logic would require a DSL parser or JSONLogic integration.

---

## Future Improvements

Listed in rough order of estimated product impact.

### Short Term

- **Undo / Redo toolbar buttons.** The `zundo` temporal store is already running. Surfacing it in the UI is a single line: `useWorkflowStore.temporal.getState().undo()`. This is first on the list because it is *already built* — it just needs a button.
- **Export / Import JSON.** Serialise the full `{ nodes, edges }` graph to a downloadable `.json` file. Import reconstructs the Zustand store state exactly, enabling workflow sharing without a backend.
- **Edge condition labels.** Surface the `conditionExpression` field in a click-to-edit edge popover so branching logic (Approved / Rejected / Escalated) is explicit in the diagram rather than implicit in node count.

### Medium Term

- **Workflow node templates.** Pre-built sub-graphs for common HR processes (e.g. "Standard Onboarding", "Performance Improvement Plan") that users drag onto the canvas and customise in place.
- **Auto-layout engine.** A one-click Dagre or ELK.js layout pass to arrange nodes into a clean top-down hierarchy — essential once workflows exceed ~10 nodes.
- **Unit + integration test suite.** Priority targets: `simulateWorkflow` BFS traversal logic, all `workflowStore` action reducers, and each `NodeForm` component's validation behaviour.
- **React Query for API state.** Replace the current `useState` + `useEffect` data-fetching pattern with `useQuery` / `useMutation` for consistent loading, error, and cache-invalidation handling.

### Long Term

- **Backend persistence layer.** A REST or GraphQL API (Node.js + PostgreSQL) to save, version, and publish workflows. The Zustand store would use optimistic updates to keep the UI responsive during saves.
- **Real-time collaboration.** Multi-cursor canvas editing via WebSockets (Liveblocks or PartyKit), with store actions broadcast to all connected sessions and last-write-wins conflict resolution at the edge level.
- **Live execution engine integration.** Wire the "Run Simulation" action to a real orchestrator (Temporal.io, AWS Step Functions) for live execution with persistent audit logs, retry visibility, and SLA tracking.
- **Role-based access control.** Restrict view, edit, and publish permissions by HR department and seniority level, enforced at both the API layer and the component level.

---

## Author

Built by **[Your Name]** as part of the Tredence Full Stack Engineering Intern assessment.

- **GitHub:** [@your-username](https://github.com/your-username)
- **LinkedIn:** [linkedin.com/in/your-profile](https://linkedin.com/in/your-profile)

---

<p align="center">
  <sub>Every architectural decision documented above was made deliberately. The code reflects it.</sub>
</p>