/**
 * Type definitions for ao-starter CLI
 */

/**
 * Supported project types
 */
export type ProjectType =
  | 'typescript'
  | 'typescript-monorepo'
  | 'javascript'
  | 'nextjs'
  | 'rust'
  | 'rust-workspace'
  | 'python'
  | 'bun'
  | 'deno'
  | 'go'
  | 'elixir'
  | 'mcp-server-http'
  | 'unknown';

/**
 * Framework detected in the project
 */
export type Framework =
  | 'Nx'
  | 'Turborepo'
  | 'Monorepo'
  | 'Next.js'
  | 'Rust'
  | 'Rust Workspace'
  | 'Python'
  | 'Poetry'
  | 'Pipenv'
  | 'Bun'
  | 'Deno'
  | 'Go'
  | 'Elixir'
  | undefined;

/**
 * Programming language detected
 */
export type Language = 'TypeScript' | 'JavaScript' | 'Rust' | 'Python' | 'Go' | 'Elixir' | 'Unknown';

/**
 * Detection result from project analysis
 */
export interface DetectionResult {
  /** Detected project type */
  type: ProjectType;
  /** Confidence score (0-100) */
  confidence: number;
  /** Framework name if detected */
  framework?: Framework;
  /** Package names if monorepo */
  packages?: string[];
}

/**
 * Full project detection information
 */
export interface ProjectDetection {
  /** Detected project type */
  type: ProjectType;
  /** Framework name if detected */
  framework?: string;
  /** Programming language */
  language?: Language;
  /** Whether project is a monorepo */
  monorepo?: boolean;
  /** Package names in monorepo */
  packages?: string[];
  /** Recommendations for the user */
  recommendations?: string[];
}

/**
 * CLI command options for init
 */
export interface InitOptions {
  /** Use a specific template */
  template?: string;
  /** Output directory for generated files */
  output: string;
  /** Skip automatic project detection */
  skipDetect: boolean;
  /** Preview changes without writing files */
  dryRun: boolean;
  /** Force override auto-detection */
  force?: boolean;
}

/**
 * Project metadata returned by detection
 */
export interface ProjectMetadata {
  /** Detected project type */
  type: ProjectType;
  /** Confidence score (0-100) */
  confidence: number;
  /** Framework name if detected */
  framework?: Framework;
  /** Programming language */
  language: Language;
  /** Whether project is a monorepo */
  monorepo: boolean;
  /** Package names in monorepo */
  packages: string[];
  /** Root package name if available */
  rootPackage?: string;
  /** Detected build tool */
  buildTool?: string;
  /** File indicators that led to detection */
  indicators: string[];
  /** Recommendations for the user */
  recommendations: string[];
}

/**
 * Detection indicators for debugging/display
 */
export interface DetectionIndicators {
  /** Files that were checked */
  files: string[];
  /** Why the detection was chosen */
  reason: string;
}

/**
 * Template generator options
 */
export interface GeneratorOptions {
  /** Project type for template selection */
  projectType: string;
  /** Output directory for generated files */
  outputDir: string;
  /** Preview changes without writing files */
  dryRun: boolean;
}

/**
 * Template file definition
 */
export interface TemplateFile {
  /** Template content or name */
  template: string;
  /** Relative output path */
  outputPath: string;
}

/**
 * AO configuration file templates
 */
export interface AoConfig {
  /** Custom settings */
  custom?: Record<string, unknown>;
  /** Agent definitions */
  agents?: Record<string, AgentConfig>;
  /** Phase definitions */
  phases?: Record<string, PhaseConfig>;
  /** Workflow definitions */
  workflows?: Record<string, WorkflowConfig>;
}

/**
 * Node.js ErrnoException interface for error handling
 */
export interface ErrnoException extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  path?: string;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Agent role description */
  role: string;
  /** Model to use */
  model: string;
  /** Agent capabilities */
  capabilities: string[];
  /** Maximum concurrent tasks */
  max_concurrent: number;
}

/**
 * Phase configuration
 */
export interface PhaseConfig {
  /** Agent to execute phase */
  agent: string;
  /** Phase description */
  description: string;
  /** Timeout in seconds */
  timeout_secs: number;
  /** Expected outputs */
  outputs: string[];
  /** Dependencies on other phases */
  depends_on?: string[];
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  /** Workflow description */
  description: string;
  /** Phases to execute */
  phases: string[];
  /** Is default workflow */
  default?: boolean;
}
