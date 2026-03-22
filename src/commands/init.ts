import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { ProjectDetector } from '../detectors/project-detector.js';
import { TemplateGenerator } from '../templates/template-generator.js';
import { isValidTemplateId, getTemplateById, getAvailableTemplates, listTemplates } from './templates.js';
import { setLoggerConfig, logger } from '../utils/logger.js';
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
  public readonly code: 'INVALID_TEMPLATE' | 'PERMISSION_DENIED' | 'EXISTING_FILES' | 'EMPTY_OUTPUT_DIR';

  constructor(
    message: string,
    code: 'INVALID_TEMPLATE' | 'PERMISSION_DENIED' | 'EXISTING_FILES' | 'EMPTY_OUTPUT_DIR'
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

  const outputDir = path.resolve(options.output);

  try {
    // Validate template
    const templateId = validateTemplate(options.template);
    const templateName = getTemplateDisplayName(templateId);

    // Show selected template
    logger.info(chalk.gray(`Template: ${chalk.white(templateName)}`));

    if (options.dryRun) {
      logger.info(chalk.yellow('Mode: Dry run (no files will be written)\n'));
    }

    // Verbose: Show configuration details
    logger.debug('Configuration:', {
      output: outputDir,
      template: templateId || 'auto-detect',
      dryRun: options.dryRun,
      force: options.force,
      quiet: options.quiet,
      verbose: options.verbose,
    });

    // Check for empty output directory
    if (outputDir !== path.resolve(process.cwd())) {
      try {
        const stats = await fs.stat(outputDir);
        if (stats.isDirectory()) {
          const files = await fs.readdir(outputDir);
          // Only warn if directory exists but is empty AND we're in dry-run mode
          // (empty directory is fine for generation)
          if (files.length === 0 && !options.dryRun) {
            logger.info(chalk.yellow(`Note: Output directory "${outputDir}" is empty.\n`));
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
        logger.warn('The following files already exist and will be overwritten:\n');
        existingFiles.forEach((file) => {
          logger.list(file);
        });
        console.log();
      }
    }

    let projectType = templateId;

    // Auto-detect project type if not specified and --force is not used
    if (!options.skipDetect && !projectType && !options.force) {
      logger.debug('Starting project type detection...');

      const detector = new ProjectDetector();
      const detection = await detector.detect();
      projectType = detection.type;

      logger.info(chalk.gray(`Detected project type: ${chalk.white(projectType || 'unknown')}`));
      logger.debug('Detection confidence:', detection.confidence);

      if (detection.framework) {
        logger.debug(`Framework: ${detection.framework}`);
        logger.info(chalk.gray(`Framework: ${chalk.white(detection.framework)}`));
      }

      if (detection.indicators && detection.indicators.length > 0) {
        logger.detection('Indicators found:');
        detection.indicators.forEach((indicator) => {
          logger.list(indicator);
        });
      }

      console.log();
    } else if (options.force && projectType) {
      logger.info(chalk.gray(`Using specified template: ${chalk.white(projectType)}`));
      console.log();
    } else if (options.force && !options.template) {
      // With --force, use 'default' template to bypass detection
      projectType = 'default';
      logger.info(chalk.yellow('Note: --force bypasses auto-detection, using default template'));
      console.log();
    }

    // Verbose: Show generation step
    logger.generation(`Generating ${projectType || 'default'} templates...`);

    // Generate templates
    const generator = new TemplateGenerator();
    const files = await generator.generate({
      projectType: projectType || 'default',
      outputDir,
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
      }
    } else {
      logger.error('Error initializing AO workflows:');
      logger.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
}
