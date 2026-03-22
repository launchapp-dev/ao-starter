/**
 * Type definitions for AO template engine
 */

/**
 * Scheduling configuration for AO daemon
 */
export interface ScheduleConfig {
  /** Schedule name identifier */
  name: string;
  /** Interval in seconds between daemon checks */
  interval_secs?: number;
  /** Automatically run tasks that are ready */
  auto_run_ready?: boolean;
  /** Automatically merge completed PRs */
  auto_merge?: boolean;
  /** Automatically create PRs for completed work */
  auto_pr?: boolean;
  /** Auto-prune worktrees after merge */
  auto_prune_worktrees_after_merge?: boolean;
}

/**
 * Agent capability definition
 */
export interface AgentCapability {
  /** Capability identifier */
  capability: string;
  /** Optional description */
  description?: string;
}

/**
 * Agent configuration for AO
 */
export interface TemplateAgent {
  /** Agent role description */
  role: string;
  /** AI model to use */
  model: string;
  /** List of capabilities */
  capabilities: string[];
  /** Maximum concurrent tasks */
  max_concurrent: number;
  /** Optional tools the agent can use */
  tools?: string[];
  /** Optional custom settings */
  settings?: Record<string, unknown>;
}

/**
 * Phase dependency definition
 */
export interface PhaseDependency {
  /** Phase name this depends on */
  phase: string;
  /** Optional condition for dependency */
  condition?: string;
}

/**
 * Phase configuration for AO workflows
 */
export interface TemplatePhase {
  /** Agent to execute this phase */
  agent: string;
  /** Human-readable description */
  description: string;
  /** Timeout in seconds */
  timeout_secs: number;
  /** Expected outputs from this phase */
  outputs: string[];
  /** Phases this depends on */
  depends_on?: string[];
  /** Optional gate configuration */
  gate?: {
    /** Gate type (manual, automatic) */
    type: 'manual' | 'automatic';
    /** Approvers required */
    approvers?: string[];
  };
  /** Optional custom settings */
  settings?: Record<string, unknown>;
}

/**
 * Workflow phase reference
 */
export interface WorkflowPhase {
  /** Phase name */
  phase: string;
  /** Optional condition to include this phase */
  condition?: string;
}

/**
 * Workflow configuration for AO
 */
export interface TemplateWorkflow {
  /** Workflow description */
  description: string;
  /** Ordered list of phases to execute */
  phases: string[];
  /** Is this the default workflow */
  default?: boolean;
  /** Optional workflow-specific settings */
  settings?: Record<string, unknown>;
}

/**
 * Template context for rendering custom.yaml
 */
export interface CustomYamlContext {
  /** Project type identifier */
  projectType: string;
  /** Project name */
  projectName?: string;
  /** Generation timestamp */
  timestamp: string;
  /** Scheduling configurations */
  schedules?: ScheduleConfig[];
  /** Custom key-value settings */
  custom?: Record<string, unknown>;
}

/**
 * Template context for rendering agents.yaml
 */
export interface AgentsYamlContext {
  /** Project type identifier */
  projectType: string;
  /** Generation timestamp */
  timestamp: string;
  /** Agent configurations keyed by agent name */
  agents?: Record<string, TemplateAgent>;
}

/**
 * Template context for rendering phases.yaml
 */
export interface PhasesYamlContext {
  /** Project type identifier */
  projectType: string;
  /** Generation timestamp */
  timestamp: string;
  /** Phase configurations keyed by phase name */
  phases?: Record<string, TemplatePhase>;
}

/**
 * Template context for rendering workflows.yaml
 */
export interface WorkflowsYamlContext {
  /** Project type identifier */
  projectType: string;
  /** Generation timestamp */
  timestamp: string;
  /** Workflow configurations keyed by workflow name */
  workflows?: Record<string, TemplateWorkflow>;
}

/**
 * Complete template context for all AO configuration files
 */
export interface TemplateContext {
  /** Project type identifier */
  projectType: string;
  /** Project name */
  projectName?: string;
  /** Generation timestamp */
  timestamp: string;
  /** Agent configurations */
  agents?: Record<string, TemplateAgent>;
  /** Phase configurations */
  phases?: Record<string, TemplatePhase>;
  /** Workflow configurations */
  workflows?: Record<string, TemplateWorkflow>;
  /** Scheduling configurations */
  schedules?: ScheduleConfig[];
  /** Custom settings */
  custom?: Record<string, unknown>;
  /** Available tools in the project */
  tools?: string[];
}

/**
 * Template file definition
 */
export interface TemplateFile {
  /** Template filename */
  template: string;
  /** Output path relative to destination directory */
  outputPath: string;
  /** Optional description of what this template generates */
  description?: string;
}

/**
 * Generator options for creating AO configuration files
 */
export interface GeneratorOptions {
  /** Project type for template selection */
  projectType: string;
  /** Project name */
  projectName?: string;
  /** Output directory for generated files */
  outputDir: string;
  /** Preview changes without writing files */
  dryRun: boolean;
  /** Custom agents configuration */
  agents?: Record<string, TemplateAgent>;
  /** Custom phases configuration */
  phases?: Record<string, TemplatePhase>;
  /** Custom workflows configuration */
  workflows?: Record<string, TemplateWorkflow>;
  /** Custom scheduling configuration */
  schedules?: ScheduleConfig[];
  /** Additional custom settings */
  custom?: Record<string, unknown>;
  /** Available tools */
  tools?: string[];
}

/**
 * Result of template generation
 */
export interface GenerationResult {
  /** List of created file paths */
  files: string[];
  /** Template context used for generation */
  context: TemplateContext;
}
