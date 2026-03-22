import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { ProjectDetector } from '../detectors/project-detector.js';
import { TemplateGenerator } from '../templates/template-generator.js';
import type { ErrnoException } from '../types/index.js';

export interface InitOptions {
  template?: string;
  output: string;
  skipDetect: boolean;
  dryRun: boolean;
}

/**
 * Custom error class for init command errors
 */
export class InitError extends Error {
  public readonly code: 'PERMISSION_DENIED' | 'EXISTING_FILES' | 'EMPTY_OUTPUT_DIR';

  constructor(message: string, code: 'PERMISSION_DENIED' | 'EXISTING_FILES' | 'EMPTY_OUTPUT_DIR') {
    super(message);
    this.name = 'InitError';
    this.code = code;
  }
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
async function checkExistingFiles(outputDir: string): Promise<string[]> {
  const existingFiles: string[] = [];
  const generator = new TemplateGenerator();

  // Get all files that would be generated
  const files = generator.getFilesForProjectType('default');

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

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.cyan('Initializing AO workflows...\n'));

  const outputDir = path.resolve(options.output);

  try {
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

    // Check for existing files (only in non-dry-run mode)
    if (!options.dryRun) {
      const existingFiles = await checkExistingFiles(outputDir);
      if (existingFiles.length > 0) {
        console.log(chalk.yellow('Warning: The following files already exist and will be overwritten:\n'));
        existingFiles.forEach(file => {
          console.log(chalk.gray(`  ${file}`));
        });
        console.log();
      }
    }

    let projectType = options.template;

    // Auto-detect project type if not specified
    if (!options.skipDetect && !projectType) {
      const detector = new ProjectDetector();
      const detection = await detector.detect();
      projectType = detection.type;
      console.log(chalk.gray(`Detected project type: ${chalk.white(projectType || 'unknown')}`));
      if (detection.framework) {
        console.log(chalk.gray(`Framework: ${chalk.white(detection.framework)}`));
      }
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
      files.forEach(file => {
        console.log(chalk.gray(`  ${file}`));
      });
    } else {
      console.log(chalk.green('✓ Created AO workflow files:\n'));
      files.forEach(file => {
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
      }
    } else {
      console.error(chalk.red('✗ Error initializing AO workflows:'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
    process.exit(1);
  }
}
