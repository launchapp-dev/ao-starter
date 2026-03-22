import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import type {
  GeneratorOptions,
  GenerationResult,
  TemplateContext,
  TemplateFile,
} from './types.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Templates directory
const TEMPLATES_DIR = path.join(__dirname);

/**
 * Template generator for AO configuration files
 * Loads Handlebars templates from the templates directory
 */
export class TemplateGenerator {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers for template rendering
   */
  private registerHelpers(): void {
    // Helper to check if a value is truthy
    this.handlebars.registerHelper('isTruthy', function (value: unknown): boolean {
      return Boolean(value);
    });

    // Helper to convert a value to YAML-friendly string
    this.handlebars.registerHelper('toYaml', function (value: unknown): string {
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
      if (typeof value === 'number') {
        return String(value);
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return JSON.stringify(value);
    });

    // Helper for equality comparison
    this.handlebars.registerHelper('eq', function (a: unknown, b: unknown): boolean {
      return a === b;
    });

    // Helper for inequality comparison
    this.handlebars.registerHelper('neq', function (a: unknown, b: unknown): boolean {
      return a !== b;
    });

    // Helper for 'or' operation
    this.handlebars.registerHelper('or', function (...args: unknown[]): boolean {
      const values = args.slice(0, -1);
      return values.some(Boolean);
    });

    // Helper for 'and' operation
    this.handlebars.registerHelper('and', function (...args: unknown[]): boolean {
      const values = args.slice(0, -1);
      return values.every(Boolean);
    });

    // Helper to join array elements
    this.handlebars.registerHelper('join', function (array: string[], separator = ', '): string {
      if (!Array.isArray(array)) return '';
      return array.join(separator);
    });

    // Helper to format timestamp
    this.handlebars.registerHelper('formatDate', function (timestamp: string): string {
      try {
        return new Date(timestamp).toISOString();
      } catch {
        return timestamp;
      }
    });
  }

  /**
   * Build the template context from generator options
   */
  private buildContext(options: GeneratorOptions): TemplateContext {
    return {
      projectType: options.projectType,
      projectName: options.projectName,
      timestamp: new Date().toISOString(),
      agents: options.agents,
      phases: options.phases,
      workflows: options.workflows,
      schedules: options.schedules,
      custom: options.custom,
      tools: options.tools,
    };
  }

  /**
   * Load a template file from the templates directory
   */
  private loadTemplate(templateName: string): string {
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return fs.readFileSync(templatePath, 'utf-8');
  }

  /**
   * Render a template with the given context
   */
  private renderTemplate(templateContent: string, context: TemplateContext): string {
    const compiled = this.handlebars.compile(templateContent);
    return compiled(context);
  }

  /**
   * Get the list of files that would be generated for a project type
   */
  public getFilesForProjectType(projectType: string): TemplateFile[] {
    const baseFiles: TemplateFile[] = [
      { template: 'custom.yaml.hbs', outputPath: 'custom.yaml', description: 'Custom AO configuration' },
      { template: 'agents.yaml.hbs', outputPath: 'agents.yaml', description: 'Agent definitions' },
      { template: 'phases.yaml.hbs', outputPath: 'phases.yaml', description: 'Phase definitions' },
      { template: 'workflows.yaml.hbs', outputPath: 'workflows.yaml', description: 'Workflow definitions' },
    ];

    // Add project-type specific files
    switch (projectType) {
      case 'typescript-monorepo':
        return [
          ...baseFiles,
          { template: 'monorepo-agents.yaml.hbs', outputPath: 'agents-monorepo.yaml', description: 'Monorepo agents' },
          { template: 'monorepo-phases.yaml.hbs', outputPath: 'phases-monorepo.yaml', description: 'Monorepo phases' },
        ];
      case 'nextjs':
        return [
          ...baseFiles,
          { template: 'nextjs-agents.yaml.hbs', outputPath: 'agents-nextjs.yaml', description: 'Next.js agents' },
          { template: 'nextjs-phases.yaml.hbs', outputPath: 'phases-nextjs.yaml', description: 'Next.js phases' },
        ];
      case 'rust':
        return [
          ...baseFiles,
          { template: 'rust-agents.yaml.hbs', outputPath: 'agents-rust.yaml', description: 'Rust agents' },
          { template: 'rust-phases.yaml.hbs', outputPath: 'phases-rust.yaml', description: 'Rust phases' },
        ];
      case 'python':
        return [
          ...baseFiles,
          { template: 'python-agents.yaml.hbs', outputPath: 'agents-python.yaml', description: 'Python agents' },
          { template: 'python-phases.yaml.hbs', outputPath: 'phases-python.yaml', description: 'Python phases' },
        ];
      case 'go':
        return [
          ...baseFiles,
          { template: 'go-agents.yaml.hbs', outputPath: 'agents-go.yaml', description: 'Go agents' },
          { template: 'go-phases.yaml.hbs', outputPath: 'phases-go.yaml', description: 'Go phases' },
        ];
      case 'elixir':
        return [
          ...baseFiles,
          { template: 'elixir-agents.yaml.hbs', outputPath: 'agents-elixir.yaml', description: 'Elixir agents' },
          { template: 'elixir-phases.yaml.hbs', outputPath: 'phases-elixir.yaml', description: 'Elixir phases' },
        ];
      case 'bun':
        return [
          ...baseFiles,
          { template: 'bun-agents.yaml.hbs', outputPath: 'agents-bun.yaml', description: 'Bun agents' },
          { template: 'bun-phases.yaml.hbs', outputPath: 'phases-bun.yaml', description: 'Bun phases' },
        ];
      case 'deno':
        return [
          ...baseFiles,
          { template: 'deno-agents.yaml.hbs', outputPath: 'agents-deno.yaml', description: 'Deno agents' },
          { template: 'deno-phases.yaml.hbs', outputPath: 'phases-deno.yaml', description: 'Deno phases' },
        ];
      default:
        return baseFiles;
    }
  }

  /**
   * Generate AO configuration files from templates
   */
  async generate(options: GeneratorOptions): Promise<string[]> {
    const createdFiles: string[] = [];
    const context = this.buildContext(options);

    // Get files to generate based on project type
    const files = this.getFilesForProjectType(options.projectType);

    for (const file of files) {
      const outputPath = path.join(options.outputDir, file.outputPath);

      if (options.dryRun) {
        createdFiles.push(outputPath);
        continue;
      }

      try {
        // Ensure directory exists
        await fs.ensureDir(path.dirname(outputPath));

        // Load and render template
        const templateContent = this.loadTemplate(file.template);
        const content = this.renderTemplate(templateContent, context);

        // Write file
        await fs.writeFile(outputPath, content, 'utf-8');
        createdFiles.push(outputPath);
      } catch (error) {
        // If template doesn't exist, skip it (for optional templates)
        if ((error as Error).message.includes('Template not found')) {
          continue;
        }
        throw error;
      }
    }

    return createdFiles;
  }

  /**
   * Generate a specific template with custom context
   */
  async generateWithContext(
    templateName: string,
    outputPath: string,
    context: TemplateContext,
    dryRun = false
  ): Promise<string[]> {
    const createdFiles: string[] = [];

    if (dryRun) {
      createdFiles.push(outputPath);
      return createdFiles;
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(outputPath));

    // Load and render template
    const templateContent = this.loadTemplate(templateName);
    const content = this.renderTemplate(templateContent, context);

    // Write file
    await fs.writeFile(outputPath, content, 'utf-8');
    createdFiles.push(outputPath);

    return createdFiles;
  }

  /**
   * Generate all AO configuration files and return detailed result
   */
  async generateComplete(options: GeneratorOptions): Promise<GenerationResult> {
    const files = await this.generate(options);
    const context = this.buildContext(options);

    return {
      files,
      context,
    };
  }

  /**
   * Preview what a template would render without writing files
   */
  previewTemplate(templateName: string, context: TemplateContext): string {
    const templateContent = this.loadTemplate(templateName);
    return this.renderTemplate(templateContent, context);
  }
}

// Export a default instance for convenience
export const templateGenerator = new TemplateGenerator();
