import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────
// Shared base data every node carries
// ─────────────────────────────────────────────
export interface BaseNodeData extends Record<string, unknown> {
  /** Human-readable label rendered on the canvas card */
  label: string;
  /** Optional longer description shown in the edit form */
  description?: string;
  /** ISO 8601 timestamp — set by the store when the node is created */
  createdAt: string;
  /** ISO 8601 timestamp — updated by the store on every data patch */
  updatedAt: string;
}

// ─────────────────────────────────────────────
// START NODE
// ─────────────────────────────────────────────
export interface StartNodeData extends BaseNodeData {
  /** The HR event that kicks off this workflow */
  triggerEvent:
    | "new_hire"
    | "resignation"
    | "promotion"
    | "performance_review"
    | "offboarding"
    | "manual";
  /** If triggerEvent === 'manual', who is allowed to trigger it */
  allowedInitiators?: string[]; // user IDs or role slugs
}

export type StartNodeType = Node<StartNodeData, "start">;

// ─────────────────────────────────────────────
// TASK NODE
// ─────────────────────────────────────────────
export type Priority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface TaskNodeData extends BaseNodeData {
  /** Employee ID or role slug responsible for completing the task */
  assignee: string;
  /** Relative due offset in business days from workflow start, or absolute ISO date */
  dueDate: { type: "relative"; businessDays: number } | { type: "absolute"; isoDate: string };
  priority: Priority;
  status: TaskStatus;
  /** Checklist items the assignee must tick off */
  subtasks: Array<{ id: string; label: string; completed: boolean }>;
  /** Whether a completion notification email is sent */
  notifyOnComplete: boolean;
}

export type TaskNodeType = Node<TaskNodeData, "task">;

// ─────────────────────────────────────────────
// APPROVAL NODE
// ─────────────────────────────────────────────
export type ApprovalOutcome = "approved" | "rejected" | "pending" | "escalated";
export type EscalationPolicy = "reassign" | "auto_approve" | "auto_reject" | "notify_only";

export interface ApprovalNodeData extends BaseNodeData {
  /** Role that must approve — e.g. "hr_manager", "department_head" */
  approverRole: string;
  /** Fallback approver user ID if the role is unoccupied */
  fallbackApproverId?: string;
  /**
   * 0–100. If the workflow engine computes a confidence/risk score
   * above this threshold the step is auto-approved without human review.
   */
  autoApproveThreshold: number;
  /** How many business days before the approval request is escalated */
  escalationAfterDays: number;
  escalationPolicy: EscalationPolicy;
  outcome: ApprovalOutcome;
  /** Free-text left by the approver */
  approverComment?: string;
  /** Whether the requester can see the approver's identity */
  anonymousApproval: boolean;
}

export type ApprovalNodeType = Node<ApprovalNodeData, "approval">;

// ─────────────────────────────────────────────
// AUTOMATED STEP NODE
// ─────────────────────────────────────────────
export type AutomationAction =
  | "send_email"
  | "send_slack"
  | "update_hris"
  | "create_jira_ticket"
  | "provision_access"
  | "revoke_access"
  | "generate_document"
  | "webhook";

export interface AutomatedStepNodeData extends BaseNodeData {
  action: AutomationAction;
  /**
   * Key-value config that varies by action type.
   * e.g. for 'send_email': { templateId, recipientField }
   *      for 'webhook':    { url, method, headers }
   */
  actionConfig: Record<string, string | number | boolean>;
  /** If true, a failure will halt the workflow; if false it continues */
  failurePolicy: "halt" | "continue" | "retry";
  /** Number of retry attempts before failurePolicy kicks in */
  retryCount: number;
  /** Seconds between retries */
  retryIntervalSeconds: number;
  /** Populated at runtime by the execution engine */
  lastRunStatus?: "success" | "failure" | "running" | "skipped";
  lastRunAt?: string;
}

export type AutomatedStepNodeType = Node<AutomatedStepNodeData, "automated_step">;

// ─────────────────────────────────────────────
// END NODE
// ─────────────────────────────────────────────
export type WorkflowOutcome = "completed" | "cancelled" | "rejected" | "escalated_out";

export interface EndNodeData extends BaseNodeData {
  outcome: WorkflowOutcome;
  /** List of user IDs / role slugs to notify when this end state is reached */
  notifyList: string[];
  /** Optional webhook fired when this terminal node is reached */
  completionWebhookUrl?: string;
  /** If true, a summary PDF is auto-generated and attached to the workflow record */
  generateSummaryReport: boolean;
}

export type EndNodeType = Node<EndNodeData, "end">;

// ─────────────────────────────────────────────
// Union types — use these everywhere else
// ─────────────────────────────────────────────
export type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | AutomatedStepNodeData
  | EndNodeData;

export type WorkflowNodeType =
  | StartNodeType
  | TaskNodeType
  | ApprovalNodeType
  | AutomatedStepNodeType
  | EndNodeType;

/** Narrow the data type by node type string — use in node components */
export type NodeDataByType<T extends WorkflowNodeType["type"]> = Extract<
  WorkflowNodeType,
  { type: T }
>["data"];

export type WorkflowEdge = Edge<{ label?: string; conditionExpression?: string }>;