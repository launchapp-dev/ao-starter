import chalk from 'chalk';
import { setLoggerConfig, logger } from '../utils/logger.js';

/**
 * CLI options for the templates command
 */
export interface TemplatesOptions {
  /** Suppress progress messages, only show errors and final result */
  quiet?: boolean;
  /** Show detailed step-by-step output */
  verbose?: boolean;
}

/**
 * Template information for display
 */
export interface TemplateInfo {
  /** Template identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the template */
  description: string;
  /** Project types this template is suitable for */
  suitableFor: string[];
  /** Whether this is the default template */
  isDefault: boolean;
}

/**
 * List of all available templates with metadata
 */
const AVAILABLE_TEMPLATES: TemplateInfo[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard AO workflow configuration for general projects',
    suitableFor: ['Any project type'],
    isDefault: true,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'TypeScript-optimized workflows with type checking phases',
    suitableFor: ['TypeScript projects', 'Node.js backends'],
    isDefault: false,
  },
  {
    id: 'typescript-monorepo',
    name: 'TypeScript Monorepo',
    description: 'Multi-package workflows for Nx, Turborepo, or pnpm workspaces',
    suitableFor: ['Monorepo projects', 'Shared libraries', 'Multiple packages'],
    isDefault: false,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    description: 'JavaScript-focused workflows with linting and testing',
    suitableFor: ['JavaScript projects', 'Legacy codebases'],
    isDefault: false,
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'Full-stack Next.js workflows with API routes and server components',
    suitableFor: ['Next.js applications', 'React projects', 'Full-stack apps'],
    isDefault: false,
  },
  {
    id: 'rust',
    name: 'Rust',
    description: 'Rust-optimized workflows with clippy, fmt, and benchmarking',
    suitableFor: ['Rust projects', 'Systems programming', 'CLI tools'],
    isDefault: false,
  },
  {
    id: 'rust-workspace',
    name: 'Rust Workspace',
    description: 'Multi-crate Rust workflows for cargo workspaces',
    suitableFor: ['Rust workspaces', 'Multiple crates', 'Library development'],
    isDefault: false,
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Python workflows with mypy, pytest, and poetry support',
    suitableFor: ['Python projects', 'ML/data projects', 'API backends'],
    isDefault: false,
  },
  {
    id: 'bun',
    name: 'Bun',
    description: 'Bun-optimized workflows for fast JavaScript/TypeScript execution',
    suitableFor: ['Bun projects', 'Fast scripts', 'API servers'],
    isDefault: false,
  },
  {
    id: 'deno',
    name: 'Deno',
    description: 'Deno workflows with built-in TypeScript and secure defaults',
    suitableFor: ['Deno projects', 'Secure scripts', 'Serverless functions'],
    isDefault: false,
  },
  {
    id: 'elixir',
    name: 'Elixir',
    description: 'Elixir/Phoenix workflows with mix, ExUnit, and Dialyzer support',
    suitableFor: ['Elixir projects', 'Phoenix applications', 'Distributed systems'],
    isDefault: false,
  },
  {
    id: 'go',
    name: 'Go',
    description: 'Go workflows with go vet, golint, and benchmarking',
    suitableFor: ['Go projects', 'CLI tools', 'Network services'],
    isDefault: false,
  },
];

/**
 * Get all available templates
 */
export function getAvailableTemplates(): TemplateInfo[] {
  return AVAILABLE_TEMPLATES;
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(id: string): TemplateInfo | undefined {
  return AVAILABLE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Check if a template ID is valid
 */
export function isValidTemplateId(id: string): boolean {
  return AVAILABLE_TEMPLATES.some((t) => t.id === id);
}

/**
 * List all available templates with formatted output
 */
export function listTemplates(options?: TemplatesOptions): void {
  // Configure logger based on options
  if (options) {
    setLoggerConfig({
      quiet: options.quiet ?? false,
      verbose: options.verbose ?? false,
    });
  }

  logger.banner(chalk.bold('\n📦 Available Templates\n'));

  // Find the longest name for alignment
  const maxNameLength = Math.max(...AVAILABLE_TEMPLATES.map((t) => t.id.length));

  // Verbose: Show template enumeration
  logger.debug(`Found ${AVAILABLE_TEMPLATES.length} available templates`);

  for (const template of AVAILABLE_TEMPLATES) {
    const padding = ' '.repeat(maxNameLength - template.id.length + 2);
    const defaultBadge = template.isDefault ? chalk.gray(' (default)') : '';

    logger.info(`  ${chalk.cyan(template.id)}${padding}${template.description}${defaultBadge}`);

    // Print suitable for
    console.log(chalk.gray(`    Suitable for: ${template.suitableFor.join(', ')}`));
    console.log();

    // Verbose: Show additional template details
    if (logger.isVerbose()) {
      logger.detection(`Template: ${template.id} (confidence: ${template.isDefault ? 'default' : 'optional'})`);
    }
  }

  if (!logger.isQuiet()) {
    console.log(chalk.gray('Usage:'));
    console.log(chalk.gray(`  ${chalk.cyan('ao init')} ${chalk.gray('--template <template-id>')}`));
    console.log();
  }

  // Show current detected project recommendation
  showTemplateRecommendation();
}

/**
 * Show template recommendation based on project detection
 */
function showTemplateRecommendation(): void {
  // This is a simple heuristic based on file presence
  // For more accurate detection, use the ProjectDetector
  const recommendations = detectProjectFromFiles();

  if (recommendations.length > 0) {
    console.log(chalk.bold('💡 Quick Recommendations:\n'));

    for (const rec of recommendations) {
      console.log(`  ${chalk.green('•')} ${chalk.gray('For')} ${chalk.white(rec.type)} ${chalk.gray('projects, use:')} ${chalk.cyan(`--template ${rec.template}`)}`);
    }
    console.log();
  }
}

/**
 * Simple file-based project type detection
 * Returns recommended templates based on detected files
 */
function detectProjectFromFiles(): Array<{ type: string; template: string }> {
  const recommendations: Array<{ type: string; template: string }> = [];

  // Check for Next.js
  try {
    const packageJson = require('./package.json');
    if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
      recommendations.push({ type: 'Next.js', template: 'nextjs' });
    }
  } catch {
    // Not a Node.js project
  }

  // Check for Rust
  try {
    const fs = require('fs');
    if (fs.existsSync('Cargo.toml')) {
      const content = fs.readFileSync('Cargo.toml', 'utf-8');
      recommendations.push({
        type: content.includes('[workspace]') ? 'Rust Workspace' : 'Rust',
        template: content.includes('[workspace]') ? 'rust-workspace' : 'rust',
      });
    }
  } catch {
    // Not a Rust project
  }

  // Check for Python
  try {
    const fs = require('fs');
    if (fs.existsSync('pyproject.toml') || fs.existsSync('setup.py')) {
      recommendations.push({ type: 'Python', template: 'python' });
    }
  } catch {
    // Not a Python project
  }

  return recommendations;
}

// Re-export InitOptions type for use in other modules
