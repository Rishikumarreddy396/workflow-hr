import type {
  AutomationDefinition,
  SimulationLogEntry,
  SimulationResult,
  SimulationStatus,
} from "../types/simulation";
import type { WorkflowNodeType, WorkflowEdge } from "../types/nodes";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Resolves after `ms` milliseconds — simulates network latency. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Returns a random integer in [min, max]. */
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ─────────────────────────────────────────────────────────────────────────────
// Mock data catalogue
// ─────────────────────────────────────────────────────────────────────────────

const AUTOMATIONS_CATALOGUE: AutomationDefinition[] = [
  {
    id: "send_email",
    label: "Send Email",
    description: "Sends a templated email via the internal mail service.",
    category: "communication",
    params: [
      { key: "to", label: "Recipient (field or email)", type: "email", required: true },
      { key: "subject", label: "Subject", type: "string", required: true },
      { key: "templateId", label: "Email Template ID", type: "string", required: true },
      { key: "ccManager", label: "CC Direct Manager", type: "boolean", required: false },
    ],
  },
  {
    id: "send_slack",
    label: "Send Slack Message",
    description: "Posts a message to a Slack channel or DMs a user.",
    category: "communication",
    params: [
      { key: "channel", label: "Channel or @user", type: "string", required: true },
      { key: "message", label: "Message text", type: "string", required: true },
      { key: "mentionAssignee", label: "Mention Assignee", type: "boolean", required: false },
    ],
  },
  {
    id: "update_hris",
    label: "Update HRIS Record",
    description: "Writes a field update to the connected HRIS (e.g. Workday, BambooHR).",
    category: "data",
    params: [
      { key: "recordType", label: "Record Type", type: "select", required: true,
        options: [
          { value: "employee", label: "Employee" },
          { value: "position", label: "Position" },
          { value: "department", label: "Department" },
        ],
      },
      { key: "fieldName", label: "Field Name", type: "string", required: true },
      { key: "fieldValue", label: "New Value", type: "string", required: true },
    ],
  },
  {
    id: "create_jira_ticket",
    label: "Create Jira Ticket",
    description: "Opens a new issue in the specified Jira project.",
    category: "integration",
    params: [
      { key: "project", label: "Project Key", type: "string", required: true },
      { key: "issueType", label: "Issue Type", type: "select", required: true,
        options: [
          { value: "Task", label: "Task" },
          { value: "Story", label: "Story" },
          { value: "Bug", label: "Bug" },
        ],
      },
      { key: "summary", label: "Summary", type: "string", required: true },
      { key: "assignee", label: "Assignee (Jira username)", type: "string", required: false },
    ],
  },
  {
    id: "provision_access",
    label: "Provision System Access",
    description: "Grants access to a system or application via the IAM provider.",
    category: "provisioning",
    params: [
      { key: "systemId", label: "System ID", type: "string", required: true },
      { key: "role", label: "Role / Permission Level", type: "string", required: true },
      { key: "expiresInDays", label: "Expires After (days, 0 = never)", type: "number", required: false },
    ],
  },
  {
    id: "revoke_access",
    label: "Revoke System Access",
    description: "Removes a user's access from a system via the IAM provider.",
    category: "provisioning",
    params: [
      { key: "systemId", label: "System ID", type: "string", required: true },
      { key: "immediately", label: "Revoke Immediately (vs. end of day)", type: "boolean", required: false },
    ],
  },
  {
    id: "generate_document",
    label: "Generate Document",
    description: "Renders a PDF from a document template (offer letter, NDA, etc.).",
    category: "data",
    params: [
      { key: "templateId", label: "Document Template ID", type: "string", required: true },
      { key: "deliverTo", label: "Deliver To (email field)", type: "string", required: true },
      { key: "requireSignature", label: "Require e-Signature", type: "boolean", required: false },
    ],
  },
  {
    id: "webhook",
    label: "Call Webhook",
    description: "Fires an HTTP request to an arbitrary external endpoint.",
    category: "integration",
    params: [
      { key: "url", label: "Endpoint URL", type: "url", required: true },
      { key: "method", label: "HTTP Method", type: "select", required: true,
        options: [
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "PATCH", label: "PATCH" },
        ],
      },
      { key: "secretHeader", label: "Authorization Header Value", type: "string", required: false },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Simulated per-node-type durations (ms)  — realistic for HR processes
// ─────────────────────────────────────────────────────────────────────────────

const NODE_DURATION_RANGES: Record<string, [number, number]> = {
  start:          [50,   150],
  task:           [3_600_000, 86_400_000],  // 1 hr – 1 day
  approval:       [3_600_000, 172_800_000], // 1 hr – 2 days
  automated_step: [200,  2_000],
  end:            [50,   100],
};

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint 1 — GET /automations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates GET /automations
 * Returns the full catalogue of available automation actions and their
 * parameter schemas so the AutomatedStepNodeForm can build its UI dynamically.
 *
 * @returns AutomationDefinition[]
 */
export async function getAutomations(): Promise<AutomationDefinition[]> {
  await delay(randInt(120, 380));
  return structuredClone(AUTOMATIONS_CATALOGUE);
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint 2 — POST /simulate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates POST /simulate
 *
 * Accepts the current React Flow graph, traverses it from the Start node
 * using a queue-based BFS walk, and returns a structured execution log.
 *
 * Detections:
 *  • No Start node present
 *  • Multiple Start nodes (ambiguous entry point)
 *  • No End node present
 *  • Nodes with no outgoing edge (dead ends that aren't End nodes)
 *  • Nodes with no incoming edge (orphans that aren't Start nodes)
 *  • Approval nodes with no rejected-path edge
 *  • AutomatedStep nodes missing required actionConfig keys
 *  • Cycles (node visited twice → halts that branch)
 *
 * @param nodes  Current WorkflowNodeType[] from the Zustand store
 * @param edges  Current WorkflowEdge[] from the Zustand store
 */
export async function simulateWorkflow(
  nodes: WorkflowNodeType[],
  edges: WorkflowEdge[]
): Promise<SimulationResult> {
  // Simulate a plausible POST round-trip
  await delay(randInt(600, 1_400));

  const logs: SimulationLogEntry[] = [];
  const fatalErrors: string[] = [];
  let stepCounter = 0;
  let totalDurationMs = 0;

  // ── Pre-flight validation ──────────────────────────────────────────────────

  const startNodes = nodes.filter((n) => n.type === "start");
  const endNodes   = nodes.filter((n) => n.type === "end");

  if (startNodes.length === 0) {
    fatalErrors.push("No Start node found. A workflow must have exactly one Start node.");
  }
  if (startNodes.length > 1) {
    fatalErrors.push(
      `Found ${startNodes.length} Start nodes. A workflow must have exactly one entry point.`
    );
  }
  if (endNodes.length === 0) {
    fatalErrors.push("No End node found. A workflow must have at least one End node.");
  }

  // Build adjacency structures once — O(E) — used throughout traversal
  const outEdges  = new Map<string, WorkflowEdge[]>();
  const inDegree  = new Map<string, number>();
  const nodeById  = new Map<string, WorkflowNodeType>();

  for (const node of nodes) {
    outEdges.set(node.id, []);
    inDegree.set(node.id, 0);
    nodeById.set(node.id, node);
  }
  for (const edge of edges) {
    outEdges.get(edge.source)?.push(edge);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Orphan check — warn for every non-start node with no incoming edge
  for (const node of nodes) {
    if (node.type !== "start" && (inDegree.get(node.id) ?? 0) === 0) {
      logs.push(
        makeLog(++stepCounter, node, "warning",
          `Node "${node.data.label}" has no incoming connection and will never be reached.`,
          0
        )
      );
    }
  }

  if (fatalErrors.length > 0) {
    return { ok: false, totalDurationMs: 0, logs, fatalErrors };
  }

  // ── BFS traversal ─────────────────────────────────────────────────────────

  const startNode = startNodes[0];
  const visited   = new Set<string>();
  const queue: WorkflowNodeType[] = [startNode];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Cycle guard
    if (visited.has(current.id)) {
      logs.push(
        makeLog(++stepCounter, current, "warning",
          `Cycle detected — node "${current.data.label}" was already visited. This branch is halted.`,
          0
        )
      );
      continue;
    }
    visited.add(current.id);

    // Produce the execution log for this node
    const [logEntry, nodeDuration] = evaluateNode(++stepCounter, current, outEdges);
    logs.push(logEntry);
    totalDurationMs += nodeDuration;

    if (logEntry.status === "error") {
      // A hard error on this node — do not continue down its edges
      continue;
    }

    // Enqueue all downstream neighbours
    const nextEdges = outEdges.get(current.id) ?? [];

    if (current.type !== "end" && nextEdges.length === 0) {
      logs.push(
        makeLog(++stepCounter, current, "error",
          `Dead end — "${current.data.label}" has no outgoing connection but is not an End node.`,
          0
        )
      );
      continue;
    }

    for (const edge of nextEdges) {
      const nextNode = nodeById.get(edge.target);
      if (nextNode) queue.push(nextNode);
    }
  }

  // ── Unreachable node check ─────────────────────────────────────────────────
  // Any node that was never visited (but passed orphan check) is in a
  // disconnected sub-graph — surface it as a warning.
  for (const node of nodes) {
    if (!visited.has(node.id) && (inDegree.get(node.id) ?? 0) > 0) {
      logs.push(
        makeLog(++stepCounter, node, "warning",
          `Node "${node.data.label}" was never reached during traversal. Check for broken paths.`,
          0
        )
      );
    }
  }

  const ok = !logs.some((l) => l.status === "error") && fatalErrors.length === 0;

  return { ok, totalDurationMs, logs, fatalErrors };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns [SimulationLogEntry, durationMs] for a single node.
 * Each node type has its own evaluation logic.
 */
function evaluateNode(
  step: number,
  node: WorkflowNodeType,
  outEdges: Map<string, WorkflowEdge[]>
): [SimulationLogEntry, number] {
  const [min, max] = NODE_DURATION_RANGES[node.type ?? "task"] ?? [500, 5000];
  const duration   = randInt(min, max);

  switch (node.type) {
    case "start": {
      const d = node.data;
      return [
        makeLog(step, node, "success",
          `Workflow triggered via "${d.triggerEvent ?? "manual"}" event.`,
          duration,
          { triggerEvent: d.triggerEvent, initiators: d.allowedInitiators?.join(", ") ?? "any" }
        ),
        duration,
      ];
    }

    case "task": {
      const d = node.data;
      const missing: string[] = [];
      if (!d.assignee) missing.push("assignee");
      if (!d.dueDate)  missing.push("dueDate");

      if (missing.length > 0) {
        return [
          makeLog(step, node, "error",
            `Task "${d.label}" is missing required fields: ${missing.join(", ")}.`,
            0
          ),
          0,
        ];
      }

      const dueDateStr =
        d.dueDate.type === "relative"
          ? `${d.dueDate.businessDays} business day(s) from start`
          : d.dueDate.isoDate;

      return [
        makeLog(step, node, "success",
          `Task assigned to "${d.assignee}" — due ${dueDateStr}. Priority: ${d.priority}.`,
          duration,
          { assignee: d.assignee, priority: d.priority, subtasks: d.subtasks?.length ?? 0 }
        ),
        duration,
      ];
    }

    case "approval": {
      const d = node.data;
      if (!d.approverRole) {
        return [
          makeLog(step, node, "error",
            `Approval node "${d.label}" has no approver role configured.`,
            0
          ),
          0,
        ];
      }

      // Check that at least one edge exists for a rejection path
      const edges = outEdges.get(node.id) ?? [];
      const hasRejectionPath = edges.length >= 2;
      const status: SimulationStatus = hasRejectionPath ? "success" : "warning";
      const message = hasRejectionPath
        ? `Awaiting approval from "${d.approverRole}". Auto-approve threshold: ${d.autoApproveThreshold}%. Escalates after ${d.escalationAfterDays} day(s).`
        : `Awaiting approval from "${d.approverRole}" — only one outgoing path found. Consider adding a rejection branch.`;

      return [
        makeLog(step, node, status, message, duration, {
          approverRole:          d.approverRole,
          autoApproveThreshold:  `${d.autoApproveThreshold}%`,
          escalationAfterDays:   d.escalationAfterDays,
          escalationPolicy:      d.escalationPolicy,
          outgoingPaths:         edges.length,
        }),
        duration,
      ];
    }

    case "automated_step": {
      const d = node.data;
      if (!d.action) {
        return [
          makeLog(step, node, "error",
            `Automated Step "${d.label}" has no action configured.`,
            0
          ),
          0,
        ];
      }

      // Validate that actionConfig is not empty
      const configKeys = Object.keys(d.actionConfig ?? {});
      if (configKeys.length === 0) {
        return [
          makeLog(step, node, "warning",
            `Automated Step "${d.label}" action "${d.action}" has no parameters set. It may fail at runtime.`,
            duration,
            { action: d.action }
          ),
          duration,
        ];
      }

      return [
        makeLog(step, node, "success",
          `Executing automation "${d.action}". Failure policy: ${d.failurePolicy}. Retries: ${d.retryCount}.`,
          duration,
          { action: d.action, configKeys: configKeys.join(", "), retryCount: d.retryCount }
        ),
        duration,
      ];
    }

    case "end": {
      const d = node.data;
      return [
        makeLog(step, node, "success",
          `Workflow reached terminal state with outcome: "${d.outcome}". Notifying ${d.notifyList?.length ?? 0} recipient(s).`,
          duration,
          {
            outcome:               d.outcome,
            recipients:            d.notifyList?.join(", ") ?? "none",
            generateSummaryReport: d.generateSummaryReport,
          }
        ),
        duration,
      ];
    }

    default: {
      return [
        makeLog(step, node, "warning",
          `Unknown node type "${(node as any).type}". Skipping.`,
          0
        ),
        0,
      ];
    }
  }
}

/** Pure factory — keeps log-creation DRY across every case above. */
function makeLog(
  step: number,
  node: WorkflowNodeType,
  status: SimulationStatus,
  message: string,
  durationMs: number,
  detail?: Record<string, string | number | boolean>
): SimulationLogEntry {
  return {
    step,
    nodeId:    node.id,
    nodeLabel: node.data?.label ?? node.id,
    nodeType:  node.type ?? "unknown",
    status,
    message,
    durationMs,
    ...(detail ? { detail } : {}),
  };
}