import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { ProjectDetector } from '../detectors/project-detector.js';
import { TemplateGenerator } from '../templates/template-generator.js';
import { isValidTemplateId, getTemplateById, getAvailableTemplates, listTemplates } from './templates.js';
import { setLoggerConfig, logger } from '../utils/logger.js';
import {
  selectTemplateInteractive,
  isInteractiveTerminal,
  confirmProjectType,
  promptOutputDirectory,
  confirmOverwrite,
} from '../utils/prompts.js';
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
  /** Suppress progress messages, only show errors and final result */
  quiet?: boolean;
  /** Show detailed step-by-step output during detection and generation */
  verbose?: boolean;
  /** Skip all confirmation prompts (non-interactive mode) */
  yes?: boolean;
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
  quiet?: boolean;
  verbose?: boolean;
  yes?: boolean;
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
  // Configure logger based on options
  setLoggerConfig({
    quiet: options.quiet ?? false,
    verbose: options.verbose ?? false,
    yes: options.yes ?? false,
  });

  // If --list is passed, show templates and exit
  if (options.list) {
    listTemplates();
    return;
  }

  // Banner - shown in normal and verbose modes
  logger.banner(chalk.cyan('Initializing AO workflows...\n'));

  // Determine if we're in interactive mode
  const interactive = isInteractiveTerminal() && !options.yes;
  const detectedOutputDir = path.resolve(options.output);
  let effectiveOutputDir = detectedOutputDir;

  // Store validated template (command line) - will be used later in try block
  const validatedTemplate = options.template;
  let templateId: string | undefined;
  let templateName: string;

  try {
    // Validate template if provided (command line)
    templateId = validateTemplate(validatedTemplate);
    templateName = getTemplateDisplayName(templateId);

    // Verbose: Show configuration details
    logger.debug('Configuration:', {
      output: effectiveOutputDir,
      template: templateId || 'auto-detect',
      dryRun: options.dryRun,
      force: options.force,
      quiet: options.quiet,
      verbose: options.verbose,
      interactive,
    });

    // Step 1: Auto-detect project type (if not skipped and no template specified)
    let detectedType: string | undefined;
    let detectionConfidence = 0;
    let detectedFramework: string | undefined;

    if (!options.skipDetect && !options.force && !templateId) {
      logger.debug('Starting project type detection...');

      const detector = new ProjectDetector();
      const detection = await detector.detect();
      detectedType = detection.type;
      detectionConfidence = detection.confidence;
      detectedFramework = detection.framework;

      // Show detection info if applicable
      if (!interactive) {
        console.log(chalk.gray(`Detected project type: ${chalk.white(detectedType || 'unknown')}`));
      }

      // Verbose: Show detailed detection info
      if (options.verbose) {
        logger.detection(`Detected project type: ${detectedType || 'unknown'}`);
        logger.debug('Detection confidence:', detectionConfidence);

        if (detectedFramework) {
          logger.debug(`Framework: ${detectedFramework}`);
          logger.detection(`Framework: ${detectedFramework}`);
        }

        if (detection.indicators && detection.indicators.length > 0) {
          logger.detection('Indicators found:');
          detection.indicators.forEach((indicator) => {
            logger.list(indicator);
          });
        }
      }
    }

    // Step 2: Interactive prompts (only in interactive mode without --yes flag)
    if (interactive && !templateId && !options.force) {
      // 2a: Confirm project type if detected
      if (detectedType && detectedType !== 'unknown') {
        const typeResult = await confirmProjectType({
          detectedType,
          framework: detectedFramework,
          confidence: detectionConfidence,
        });

        if (typeResult.cancelled) {
          console.log(chalk.gray('\nOperation cancelled.'));
          return;
        }

        if (typeResult.selectDifferent) {
          // User wants to select a different template
          const templateResult = await getTemplateInteractively(detectedType);
          if (templateResult === undefined) {
            console.log(chalk.gray('\nOperation cancelled.'));
            return;
          }
          templateId = templateResult;
          templateName = getTemplateDisplayName(templateId);
        } else if (typeResult.confirmed && isValidTemplateId(detectedType)) {
          // User confirmed the detected type
          templateId = detectedType;
          templateName = getTemplateDisplayName(templateId);
        }
        // If user chose "no, use default", templateId remains undefined (will use default)
      } else {
        // No detection, go straight to template selection
        const templateResult = await getTemplateInteractively();
        if (templateResult === undefined) {
          console.log(chalk.gray('\nOperation cancelled.'));
          return;
        }
        templateId = templateResult;
        templateName = getTemplateDisplayName(templateId);
      }

      // 2b: Prompt for output directory
      const dirResult = await promptOutputDirectory({
        defaultDirectory: effectiveOutputDir,
      });

      if (dirResult.cancelled) {
        console.log(chalk.gray('\nOperation cancelled.'));
        return;
      }

      effectiveOutputDir = dirResult.directory;

      // Check write permissions for new directory
      await checkWritePermission(effectiveOutputDir);
    } else {
      // Non-interactive or --yes mode: use default output directory
      await checkWritePermission(effectiveOutputDir);
    }

    // Step 3: Check for existing files and prompt for overwrite confirmation
    const effectiveProjectType = templateId || 'default';
    if (!options.dryRun && !options.force) {
      const existingFiles = await checkExistingFiles(effectiveOutputDir, effectiveProjectType);

      if (existingFiles.length > 0) {
        if (interactive && !options.yes) {
          // Interactive overwrite confirmation
          const overwriteResult = await confirmOverwrite({
            files: existingFiles,
            outputDir: effectiveOutputDir,
          });

          if (overwriteResult.cancelled) {
            console.log(chalk.gray('\nOperation cancelled.'));
            return;
          }

          if (!overwriteResult.proceed) {
            console.log(chalk.gray('\nNo files were modified.'));
            console.log(chalk.gray('Run ') +
              chalk.cyan('ao init --force') +
              chalk.gray(' to overwrite files without confirmation.'));
            return;
          }
        } else {
          // Non-interactive: just warn
          logger.warn('The following files already exist and will be overwritten:\n');
          existingFiles.forEach((file) => {
            logger.list(file);
          });
          console.log();
        }
      }
    }

    // Step 4: If no template selected yet and not in force mode, use detected type or default
    if (!templateId && !options.force) {
      if (detectedType && isValidTemplateId(detectedType)) {
        templateId = detectedType;
        templateName = getTemplateDisplayName(templateId);
      } else {
        templateId = 'default';
        templateName = getTemplateDisplayName(templateId);
      }
    }

    // Handle force mode
    if (options.force && !templateId) {
      templateId = 'default';
      templateName = getTemplateDisplayName(templateId);
      logger.info(chalk.yellow('Note: --force bypasses auto-detection, using default template'));
      console.log();
    } else if (options.force && templateId) {
      logger.info(chalk.gray(`Using specified template: ${chalk.white(templateId)}`));
      console.log();
    }

    // Show template selection
    logger.info(chalk.gray(`Template: ${chalk.white(templateName)}`));
    if (options.dryRun) {
      logger.info(chalk.yellow('Mode: Dry run (no files will be written)\n'));
    }

    // Verbose: Show generation step
    logger.generation(`Generating ${templateId || 'default'} templates...`);

    // Generate templates
    const generator = new TemplateGenerator();
    const files = await generator.generate({
      projectType: templateId || 'default',
      outputDir: effectiveOutputDir,
      dryRun: options.dryRun,
    });

    if (options.dryRun) {
      logger.info(chalk.yellow('Dry run - files that would be created:\n'));
      files.forEach((file) => {
        logger.list(file);
      });
    } else {
      logger.success('Created AO workflow files:\n');
      files.forEach((file) => {
        logger.list(file);
      });
      console.log();

      // In quiet mode, just show the final success message
      if (logger.isQuiet()) {
        logger.result('AO workflows initialized successfully!');
      } else {
        logger.result(chalk.green.bold('🎉 AO workflows initialized successfully!'));
        logger.info(chalk.gray('\nNext steps:'));
        logger.list('1. Review the generated files in .ao/');
        logger.list('2. Run: ao daemon start');
        logger.list('3. Run: ao task list\n');
      }
    }
  } catch (error) {
    if (error instanceof InitError) {
      switch (error.code) {
        case 'INVALID_TEMPLATE':
          logger.error('Invalid template:');
          logger.error(`  ${error.message}`);
          logger.info(chalk.gray('\nRun ') + chalk.cyan('ao init --list') + chalk.gray(' to see available templates.'));
          break;
        case 'PERMISSION_DENIED':
          logger.error('Permission denied:');
          logger.error(`  ${error.message}`);
          logger.info(chalk.gray('\nTo fix:'));
          logger.info(chalk.gray('  - Check directory ownership: chown -R $USER ' + options.output));
          logger.info(chalk.gray('  - Check directory permissions: chmod u+w ' + options.output));
          break;
        case 'EXISTING_FILES':
          logger.error('Existing files detected:');
          logger.error(`  ${error.message}`);
          break;
        case 'EMPTY_OUTPUT_DIR':
          logger.error('Empty output directory:');
          logger.error(`  ${error.message}`);
          break;
        case 'PROMPT_CANCELLED':
          console.error(chalk.yellow('✗ Operation cancelled'));
          break;
        case 'PROMPT_CANCELLED':
          console.error(chalk.yellow('✗ Operation cancelled'));
          break;
      }
    } else {
      logger.error('Error initializing AO workflows:');
      logger.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
}
