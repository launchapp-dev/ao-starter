import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { ProjectDetector } from '../detectors/project-detector.js';
import { TemplateGenerator } from '../templates/template-generator.js';
import { isValidTemplateId, getTemplateById, getAvailableTemplates, listTemplates } from './templates.js';
import { selectTemplateInteractive, isInteractiveTerminal } from '../utils/prompts.js';
import type { ErrnoException } from '../types/index.js';

/**
 * CLI options for the init command
 */
export interface InitOptions {
  /** Use a specific template */
  template?: string;
  /** List available templates */
  list?: boolean;
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
 * Init command options passed from commander (camelCase)
 */
export type initOptions = {
  template?: string;
  list?: boolean;
  output: string;
  skipDetect: boolean;
  dryRun: boolean;
  force?: boolean;
};

/**
 * Custom error class for init command errors
 */
export class InitError extends Error {
  public readonly code: 'INVALID_TEMPLATE' | 'PERMISSION_DENIED' | 'EXISTING_FILES' | 'EMPTY_OUTPUT_DIR' | 'PROMPT_CANCELLED';

  constructor(
    message: string,
    code: 'INVALID_TEMPLATE' | 'PERMISSION_DENIED' | 'EXISTING_FILES' | 'EMPTY_OUTPUT_DIR' | 'PROMPT_CANCELLED'
  ) {
    super(message);
    this.name = 'InitError';
    this.code = code;
  }
}

/**
 * Validate the provided template name
 */
function validateTemplate(template?: string): string | undefined {
  if (!template) {
    return undefined;
  }

  if (!isValidTemplateId(template)) {
    const available = getAvailableTemplates()
      .map((t) => t.id)
      .join(', ');

    throw new InitError(
      `Invalid template "${template}". Available templates: ${available}\nRun 'ao init --list' to see all templates.`,
      'INVALID_TEMPLATE'
    );
  }

  return template;
}

/**
 * Check if we have write permissions to a directory
 */
async function checkWritePermission(dirPath: string): Promise<void> {
  try {
    // Check if directory exists
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new InitError(`Output path exists but is not a directory: ${dirPath}`, 'PERMISSION_DENIED');
    }

    // Try to write a temporary file to check permissions
    const testFile = path.join(dirPath, '.ao-permission-check');
    await fs.writeFile(testFile, '', 'utf-8');
    await fs.remove(testFile);
  } catch (error) {
    if (error instanceof InitError) {
      throw error;
    }
    if ((error as ErrnoException).code === 'EACCES') {
      throw new InitError(
        `Permission denied: Cannot write to directory "${dirPath}". Check directory permissions.`,
        'PERMISSION_DENIED'
      );
    }
    // For other errors (like directory not existing), let fs-extra handle it during generation
  }
}

/**
 * Check for existing files in the output directory
 */
async function checkExistingFiles(outputDir: string, projectType: string): Promise<string[]> {
  const existingFiles: string[] = [];
  const generator = new TemplateGenerator();

  // Get all files that would be generated
  const files = generator.getFilesForProjectType(projectType);

  for (const file of files) {
    const filePath = path.join(outputDir, file.outputPath);
    try {
      await fs.stat(filePath);
      existingFiles.push(filePath);
    } catch {
      // File doesn't exist, which is fine
    }
  }

  return existingFiles;
}

/**
 * Get a nice display name for the template
 */
function getTemplateDisplayName(templateId?: string): string {
  if (!templateId) {
    return 'Default';
  }
  const template = getTemplateById(templateId);
  return template?.name || templateId;
}

/**
 * Get template via interactive selection when --template is not provided
 * Returns undefined if user cancels or terminal is not interactive
 */
async function getTemplateInteractively(
  detectedType?: string
): Promise<string | undefined> {
  // Only show interactive prompt if terminal supports it
  if (!isInteractiveTerminal()) {
    return undefined;
  }

  console.log();
  console.log(chalk.cyan('┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.cyan('│') + chalk.white.bold('  Select a template for your project') + ' '.repeat(18) + chalk.cyan('│'));
  console.log(chalk.cyan('└─────────────────────────────────────────────────────────────┘'));
  console.log();

  const templates = getAvailableTemplates();

  // Try to detect project type if not provided
  let recommendedTemplate: string | undefined;
  if (detectedType && isValidTemplateId(detectedType)) {
    recommendedTemplate = detectedType;
  }

  const result = await selectTemplateInteractive({
    templates,
    message: 'Which template would you like to use?',
    defaultTemplate: recommendedTemplate || 'default',
  });

  if (result.cancelled) {
    console.log(chalk.yellow('\n✗ Template selection cancelled'));
    return undefined;
  }

  return result.templateId;
}

/**
 * Main init command implementation
 */
export async function initCommand(options: initOptions): Promise<void> {
  // If --list is passed, show templates and exit
  if (options.list) {
    listTemplates();
    return;
  }

  console.log(chalk.cyan('Initializing AO workflows...\n'));

  const outputDir = path.resolve(options.output);

  try {
    // Validate template if provided
    let templateId = validateTemplate(options.template);
    let templateName = getTemplateDisplayName(templateId);

    // Check for empty output directory
    if (outputDir !== path.resolve(process.cwd())) {
      try {
        const stats = await fs.stat(outputDir);
        if (stats.isDirectory()) {
          const files = await fs.readdir(outputDir);
          // Only warn if directory exists but is empty AND we're in dry-run mode
          // (empty directory is fine for generation)
          if (files.length === 0 && !options.dryRun) {
            console.log(chalk.yellow(`Note: Output directory "${outputDir}" is empty.\n`));
          }
        }
      } catch {
        // Directory doesn't exist yet, which is fine (fs-extra.ensureDir will create it)
      }
    }

    // Check write permissions if directory exists
    await checkWritePermission(outputDir);

    // Check for existing files (only in non-dry-run mode and non-force mode)
    const effectiveProjectType = templateId || 'default';
    if (!options.dryRun && !options.force) {
      const existingFiles = await checkExistingFiles(outputDir, effectiveProjectType);
      if (existingFiles.length > 0) {
        console.log(chalk.yellow('Warning: The following files already exist and will be overwritten:\n'));
        existingFiles.forEach((file) => {
          console.log(chalk.gray(`  ${file}`));
        });
        console.log();
      }
    }

    let projectType = templateId;

    // Auto-detect project type first (before interactive selection)
    let detectedType: string | undefined;
    if (!options.skipDetect && !projectType && !options.force) {
      const detector = new ProjectDetector();
      const detection = await detector.detect();
      detectedType = detection.type;
      // Show detection info if applicable
      if (!isInteractiveTerminal()) {
        console.log(chalk.gray(`Detected project type: ${chalk.white(detectedType || 'unknown')}`));
      }
    }

    // If no template specified and not in force mode, show interactive selection
    if (!projectType && !options.force && !options.template) {
      // If we detected a type, show the prompt with recommendation
      if (isInteractiveTerminal()) {
        const interactiveTemplate = await getTemplateInteractively(detectedType);

        if (interactiveTemplate) {
          projectType = interactiveTemplate;
          templateName = getTemplateDisplayName(projectType);
        } else {
          // User cancelled - exit gracefully
          console.log(chalk.gray('\nNo template selected. Run ') +
            chalk.cyan('ao init --template <name>') +
            chalk.gray(' to specify a template.'));
          return;
        }
      } else if (detectedType && isValidTemplateId(detectedType)) {
        // Non-interactive: use detected type if valid
        projectType = detectedType;
        templateName = getTemplateDisplayName(projectType);
      }
    }

    // Show template selection
    console.log(chalk.gray(`Template: ${chalk.white(templateName)}`));
    if (options.dryRun) {
      console.log(chalk.yellow('Mode: Dry run (no files will be written)\n'));
    }

    // Handle force mode
    if (options.force && !projectType) {
      projectType = 'default';
      templateName = getTemplateDisplayName(projectType);
      console.log(chalk.yellow('Note: --force bypasses auto-detection, using default template'));
      console.log();
    } else if (options.force && projectType) {
      console.log(chalk.gray(`Using specified template: ${chalk.white(projectType)}`));
      console.log();
    }

    // Generate templates
    const generator = new TemplateGenerator();
    const files = await generator.generate({
      projectType: projectType || 'default',
      outputDir,
      dryRun: options.dryRun,
    });

    if (options.dryRun) {
      console.log(chalk.yellow('Dry run - files that would be created:\n'));
      files.forEach((file) => {
        console.log(chalk.gray(`  ${file}`));
      });
    } else {
      console.log(chalk.green('✓ Created AO workflow files:\n'));
      files.forEach((file) => {
        console.log(chalk.gray(`  ${file}`));
      });
      console.log();
      console.log(chalk.green.bold('🎉 AO workflows initialized successfully!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Review the generated files in .ao/'));
      console.log(chalk.gray('  2. Run: ao daemon start'));
      console.log(chalk.gray('  3. Run: ao task list\n'));
    }
  } catch (error) {
    if (error instanceof InitError) {
      switch (error.code) {
        case 'INVALID_TEMPLATE':
          console.error(chalk.red('✗ Invalid template:'));
          console.error(chalk.red(`  ${error.message}`));
          console.error(chalk.gray('\nRun ') + chalk.cyan('ao init --list') + chalk.gray(' to see available templates.'));
          break;
        case 'PERMISSION_DENIED':
          console.error(chalk.red('✗ Permission denied:'));
          console.error(chalk.red(`  ${error.message}`));
          console.error(chalk.gray('\nTo fix:'));
          console.error(chalk.gray('  - Check directory ownership: chown -R $USER ' + options.output));
          console.error(chalk.gray('  - Check directory permissions: chmod u+w ' + options.output));
          break;
        case 'EXISTING_FILES':
          console.error(chalk.red('✗ Existing files detected:'));
          console.error(chalk.red(`  ${error.message}`));
          break;
        case 'EMPTY_OUTPUT_DIR':
          console.error(chalk.red('✗ Empty output directory:'));
          console.error(chalk.red(`  ${error.message}`));
          break;
        case 'PROMPT_CANCELLED':
          console.error(chalk.yellow('✗ Operation cancelled'));
          break;
      }
    } else {
      console.error(chalk.red('✗ Error initializing AO workflows:'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
    process.exit(1);
  }
}
