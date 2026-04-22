// ─────────────────────────────────────────────────────────────────────────────
// Automation catalogue types  (used by getAutomations)
// ─────────────────────────────────────────────────────────────────────────────

export interface AutomationParamDefinition {
  key: string;
  label: string;
  type: "string" | "email" | "url" | "number" | "boolean" | "select";
  required: boolean;
  /** Only present when type === 'select' */
  options?: Array<{ value: string; label: string }>;
}

export interface AutomationDefinition {
  id: string;
  label: string;
  description: string;
  category: "communication" | "provisioning" | "data" | "integration";
  params: AutomationParamDefinition[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation log types  (used by simulateWorkflow)
// ─────────────────────────────────────────────────────────────────────────────

export type SimulationStatus = "success" | "warning" | "error" | "skipped";

export interface SimulationLogEntry {
  step: number;
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: SimulationStatus;
  message: string;
  /** Any extra key-value detail rendered in an expandable row */
  detail?: Record<string, string | number | boolean>;
  /** Simulated ms this step would take at runtime */
  durationMs: number;
}

export interface SimulationResult {
  ok: boolean;
  /** Total simulated wall-clock duration of the whole workflow */
  totalDurationMs: number;
  logs: SimulationLogEntry[];
  /** High-level errors that blocked traversal entirely */
  fatalErrors: string[];
}