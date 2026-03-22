import chalk from 'chalk';
import { TemplateGenerator } from '../templates/template-generator.js';

/**
 * Known template types that can be enumerated via getFilesForProjectType()
 */
const TEMPLATE_TYPES = [
  'default',
  'typescript',
  'typescript-monorepo',
  'javascript',
  'nextjs',
  'rust',
  'rust-workspace',
  'python',
  'go',
  'elixir',
  'bun',
  'deno',
] as const;

/**
 * Template metadata for display descriptions
 */
const TEMPLATE_METADATA: Record<string, { name: string; description: string; suitableFor: string[] }> = {
  default: {
    name: 'Default',
    description: 'Standard AO workflow configuration for general projects',
    suitableFor: ['Any project type'],
  },
  typescript: {
    name: 'TypeScript',
    description: 'TypeScript-optimized workflows with type checking phases',
    suitableFor: ['TypeScript projects', 'Node.js backends'],
  },
  'typescript-monorepo': {
    name: 'TypeScript Monorepo',
    description: 'Multi-package workflows for Nx, Turborepo, or pnpm workspaces',
    suitableFor: ['Monorepo projects', 'Shared libraries', 'Multiple packages'],
  },
  javascript: {
    name: 'JavaScript',
    description: 'JavaScript-focused workflows with linting and testing',
    suitableFor: ['JavaScript projects', 'Legacy codebases'],
  },
  nextjs: {
    name: 'Next.js',
    description: 'Full-stack Next.js workflows with API routes and server components',
    suitableFor: ['Next.js applications', 'React projects', 'Full-stack apps'],
  },
  rust: {
    name: 'Rust',
    description: 'Rust-optimized workflows with clippy, fmt, and benchmarking',
    suitableFor: ['Rust projects', 'Systems programming', 'CLI tools'],
  },
  'rust-workspace': {
    name: 'Rust Workspace',
    description: 'Multi-crate Rust workflows for cargo workspaces',
    suitableFor: ['Rust workspaces', 'Multiple crates', 'Library development'],
  },
  python: {
    name: 'Python',
    description: 'Python workflows with mypy, pytest, and poetry support',
    suitableFor: ['Python projects', 'ML/data projects', 'API backends'],
  },
  go: {
    name: 'Go',
    description: 'Go workflows with go vet, golint, and benchmarking',
    suitableFor: ['Go projects', 'CLI tools', 'Network services'],
  },
  elixir: {
    name: 'Elixir',
    description: 'Elixir/Phoenix workflows with mix, ExUnit, and Dialyzer support',
    suitableFor: ['Elixir projects', 'Phoenix applications', 'Distributed systems'],
  },
  bun: {
    name: 'Bun',
    description: 'Bun-optimized workflows for fast JavaScript/TypeScript execution',
    suitableFor: ['Bun projects', 'Fast scripts', 'API servers'],
  },
  deno: {
    name: 'Deno',
    description: 'Deno workflows with built-in TypeScript and secure defaults',
    suitableFor: ['Deno projects', 'Secure scripts', 'Serverless functions'],
  },
};

/**
 * CLI options for the list-templates command
 */
export interface ListTemplatesOptions {
  /** Output in JSON format */
  json?: boolean;
}

/**
 * List available templates command
 * Uses TemplateGenerator.getFilesForProjectType() to enumerate templates
 */
export function listTemplatesCommand(options?: ListTemplatesOptions): void {
  const generator = new TemplateGenerator();
  const templates: TemplateInfo[] = [];

  // Enumerate all templates using getFilesForProjectType()
  for (const templateType of TEMPLATE_TYPES) {
    const files = generator.getFilesForProjectType(templateType);
    const metadata = TEMPLATE_METADATA[templateType];

    templates.push({
      id: templateType,
      name: metadata?.name || templateType,
      description: metadata?.description || `Template for ${templateType} projects`,
      suitableFor: metadata?.suitableFor || ['General use'],
      files: files.map((f) => f.outputPath),
      isDefault: templateType === 'default',
    });
  }

  if (options?.json) {
    console.log(JSON.stringify(templates, null, 2));
    return;
  }

  // Display templates in human-readable format
  displayTemplates(templates);
}

/**
 * Display templates in a formatted table
 */
function displayTemplates(templates: TemplateInfo[]): void {
  console.log(chalk.bold('\n📦 Available Templates\n'));

  // Find the longest ID for alignment
  const maxIdLength = Math.max(...templates.map((t) => t.id.length));

  for (const template of templates) {
    const padding = ' '.repeat(maxIdLength - template.id.length + 2);
    const defaultBadge = template.isDefault ? chalk.gray(' (default)') : '';

    console.log(`  ${chalk.cyan(template.id)}${padding}${template.description}${defaultBadge}`);
    console.log(chalk.gray(`    Suitable for: ${template.suitableFor.join(', ')}`));
    console.log(chalk.gray(`    Generates: ${template.files.length} files`));
    console.log();
  }

  // Usage hint
  console.log(chalk.gray('Usage:'));
  console.log(chalk.gray(`  ${chalk.cyan('ao init')} ${chalk.gray('--template <template-id>')}`));
  console.log(chalk.gray(`  ${chalk.cyan('ao list-templates --json')} ${chalk.gray('# For machine-readable output')}`));
  console.log();
}

/**
 * Template information structure
 */
interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  suitableFor: string[];
  files: string[];
  isDefault: boolean;
}
