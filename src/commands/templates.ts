import chalk from 'chalk';

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
 * Detailed template information for specific template view
 */
export interface DetailedTemplateInfo extends TemplateInfo {
  /** List of files this template generates */
  files: string[];
  /** Agents used by this template */
  agents: string[];
  /** Phases defined by this template */
  phases: string[];
  /** Example usage command */
  usage: string;
}

/**
 * CLI options for the templates command
 */
export interface TemplatesOptions {
  /** Show details for a specific template */
  name?: string;
  /** Output in JSON format */
  json?: boolean;
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
];

/**
 * Detailed information for each template
 */
const TEMPLATE_DETAILS: Record<string, Omit<DetailedTemplateInfo, keyof TemplateInfo>> = {
  default: {
    files: ['agents.yaml', 'phases.yaml', 'workflows.yaml', 'custom.yaml', 'README.md'],
    agents: ['planner', 'implementer', 'reviewer'],
    phases: ['plan', 'implement', 'review', 'test'],
    usage: 'ao init --template default',
  },
  typescript: {
    files: ['agents.yaml', 'phases.yaml', 'workflows.yaml', 'custom.yaml', 'README.md'],
    agents: ['planner', 'implementer', 'reviewer'],
    phases: ['plan', 'implement', 'typecheck', 'lint', 'review', 'test'],
    usage: 'ao init --template typescript',
  },
  'typescript-monorepo': {
    files: ['agents.yaml', 'phases.yaml', 'workflows.yaml', 'custom.yaml', 'README.md'],
    agents: ['planner', 'implementer', 'reviewer'],
    phases: ['plan', 'implement', 'typecheck', 'lint', 'build', 'review', 'test'],
    usage: 'ao init --template typescript-monorepo',
  },
  javascript: {
    files: ['agents.yaml', 'phases.yaml', 'workflows.yaml', 'custom.yaml', 'README.md'],
    agents: ['planner', 'implementer', 'reviewer'],
    phases: ['plan', 'implement', 'lint', 'review', 'test'],
    usage: 'ao init --template javascript',
  },
  nextjs: {
    files: ['agents.yaml', 'phases.yaml', 'workflows.yaml', 'custom.yaml', 'README.md'],
    agents: ['planner', 'implementer', 'reviewer'],
    phases: ['plan', 'implement', 'build', 'typecheck', 'lint', 'review', 'test'],
    usage: 'ao init --template nextjs',
  },
  rust: {
    files: ['agents.yaml', 'phases.yaml', 'workflows.yaml', 'custom.yaml', 'README.md'],
    agents: ['planner', 'implementer', 'reviewer'],
    phases: ['plan', 'implement', 'clippy', 'fmt', 'review', 'test', 'benchmark'],
    usage: 'ao init --template rust',
  },
  'rust-workspace': {
    files: ['agents.yaml', 'phases.yaml', 'workflows.yaml', 'custom.yaml', 'README.md'],
    agents: ['planner', 'implementer', 'reviewer'],
    phases: ['plan', 'implement', 'clippy', 'fmt', 'build', 'review', 'test', 'benchmark'],
    usage: 'ao init --template rust-workspace',
  },
  python: {
    files: ['agents.yaml', 'phases.yaml', 'workflows.yaml', 'custom.yaml', 'README.md'],
    agents: ['planner', 'implementer', 'reviewer'],
    phases: ['plan', 'implement', 'lint', 'typecheck', 'review', 'test'],
    usage: 'ao init --template python',
  },
};

/**
 * Get all available templates
 */
export function getAvailableTemplates(): TemplateInfo[] {
  return AVAILABLE_TEMPLATES;
}

/**
 * Get detailed information for a specific template
 */
export function getDetailedTemplate(id: string): DetailedTemplateInfo | undefined {
  const template = getTemplateById(id);
  if (!template) {
    return undefined;
  }
  const details = TEMPLATE_DETAILS[id];
  if (!details) {
    return undefined;
  }
  return {
    ...template,
    ...details,
  };
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
export function listTemplates(): void {
  console.log(chalk.bold('\n📦 Available Templates\n'));

  // Find the longest name for alignment
  const maxNameLength = Math.max(...AVAILABLE_TEMPLATES.map((t) => t.id.length));

  for (const template of AVAILABLE_TEMPLATES) {
    const padding = ' '.repeat(maxNameLength - template.id.length + 2);
    const defaultBadge = template.isDefault ? chalk.gray(' (default)') : '';

    console.log(`  ${chalk.cyan(template.id)}${padding}${template.description}${defaultBadge}`);

    // Print suitable for
    console.log(chalk.gray(`    Suitable for: ${template.suitableFor.join(', ')}`));
    console.log();
  }

  console.log(chalk.gray('Usage:'));
  console.log(chalk.gray(`  ${chalk.cyan('ao init')} ${chalk.gray('--template <template-id>')}`));
  console.log();

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

/**
 * Output templates in JSON format
 */
function outputJson(options: TemplatesOptions): void {
  if (options.name) {
    const template = getDetailedTemplate(options.name);
    if (!template) {
      console.error(chalk.red(`✗ Template "${options.name}" not found`));
      const availableIds = AVAILABLE_TEMPLATES.map((t) => t.id).join(', ');
      console.error(chalk.gray(`Available templates: ${availableIds}`));
      process.exit(1);
    }
    console.log(JSON.stringify(template, null, 2));
  } else {
    const templates = AVAILABLE_TEMPLATES.map((t) => {
      const details = TEMPLATE_DETAILS[t.id];
      return {
        ...t,
        ...details,
      };
    });
    console.log(JSON.stringify(templates, null, 2));
  }
}

/**
 * Main templates command implementation
 */
export async function templatesCommand(options: TemplatesOptions): Promise<void> {
  if (options.json) {
    outputJson(options);
    return;
  }

  if (options.name) {
    showTemplateDetails(options.name);
  } else {
    listTemplates();
  }
}

/**
 * Show detailed information for a specific template
 */
function showTemplateDetails(name: string): void {
  const template = getDetailedTemplate(name);

  if (!template) {
    console.error(chalk.red(`✗ Template "${name}" not found`));
    console.error(chalk.gray('\nRun ') + chalk.cyan('ao templates') + chalk.gray(' to see available templates.'));
    process.exit(1);
  }

  console.log(chalk.bold(`\n📦 Template: ${template.name}\n`));

  // Description
  console.log(`  ${chalk.gray('Description:')} ${chalk.white(template.description)}`);

  // Default badge
  if (template.isDefault) {
    console.log(chalk.green('  ✓ Default template'));
  }

  console.log();

  // Suitable for
  console.log(`  ${chalk.gray('Suitable for:')}`);
  template.suitableFor.forEach((s) => {
    console.log(`    ${chalk.green('•')} ${s}`);
  });
  console.log();

  // Files generated
  console.log(`  ${chalk.gray('Files generated:')}`);
  template.files.forEach((f) => {
    console.log(`    ${chalk.cyan('•')} ${f}`);
  });
  console.log();

  // Agents
  console.log(`  ${chalk.gray('Agents:')}`);
  template.agents.forEach((a) => {
    console.log(`    ${chalk.magenta('•')} ${a}`);
  });
  console.log();

  // Phases
  console.log(`  ${chalk.gray('Phases:')}`);
  template.phases.forEach((p) => {
    console.log(`    ${chalk.blue('•')} ${p}`);
  });
  console.log();

  // Usage
  console.log(chalk.bold('  Usage:\n'));
  console.log(`    ${chalk.cyan(template.usage)}`);
  console.log();
}
