import chalk from 'chalk';
import Enquirer from 'enquirer';
import path from 'path';
import fs from 'fs-extra';
import type { TemplateInfo } from '../commands/templates.js';
import type { ErrnoException } from '../types/index.js';

/**
 * Options for interactive template selection
 */
export interface SelectTemplateOptions {
  /** Available templates to choose from */
  templates: TemplateInfo[];
  /** Message to display */
  message?: string;
  /** Default template ID (if any) */
  defaultTemplate?: string;
}

/**
 * Result of template selection
 */
export interface SelectTemplateResult {
  /** Selected template ID */
  templateId: string;
  /** Whether the user cancelled */
  cancelled: boolean;
}

/**
 * Interactive template selection prompt
 * Uses enquirer for arrow-key navigation and selection
 */
export async function selectTemplateInteractive(
  options: SelectTemplateOptions
): Promise<SelectTemplateResult> {
  const { templates, message = 'Select a template:', defaultTemplate } = options;

  // Format choices for enquirer - include description in the message
  const choices = templates.map((template) => ({
    name: template.id,
    message: `${template.name}${template.isDefault ? ' (default)' : ''} — ${template.description}`,
    hint: `Suitable for: ${template.suitableFor.join(', ')}`,
  }));

  // Find default index
  const defaultIndex = defaultTemplate
    ? templates.findIndex((t) => t.id === defaultTemplate)
    : templates.findIndex((t) => t.isDefault);

  try {
    const response = await Enquirer.prompt<{ template: string }>([
      {
        type: 'select',
        name: 'template',
        message,
        choices,
        initial: defaultIndex >= 0 ? defaultIndex : 0,
        format: (selectedValue: string) => {
          const template = templates.find((t) => t.id === selectedValue);
          return template ? chalk.white(template.name) : selectedValue;
        },
      },
    ]);

    return {
      templateId: response.template,
      cancelled: false,
    };
  } catch (error) {
    // Handle ctrl+c or other cancellations
    if ((error as ErrnoException).code === 'ERR_CANCELED') {
      return {
        templateId: '',
        cancelled: true,
      };
    }
    throw error;
  }
}

/**
 * Check if the terminal supports interactive mode
 * Returns false if stdin is not a TTY
 */
export function isInteractiveTerminal(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true;
}

/**
 * Format template for display in interactive selection
 */
export function formatTemplateForSelection(template: TemplateInfo): string {
  const name = chalk.cyan(template.name);
  const description = chalk.gray(template.description);
  const defaultBadge = template.isDefault ? chalk.yellow(' (default)') : '';

  return `${name}${defaultBadge} — ${description}`;
}

/**
 * Show a confirmation prompt
 */
export async function confirmAction(
  message: string,
  defaultValue: boolean = false
): Promise<boolean> {
  try {
    const response = await Enquirer.prompt<{ confirmed: boolean }>([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        initial: defaultValue,
      },
    ]);

    return response.confirmed;
  } catch {
    return false;
  }
}

/**
 * Show an input prompt for a string value
 */
export async function promptForInput(
  message: string,
  options?: {
    default?: string;
    required?: boolean;
    validate?: (_value: string) => boolean | string;
  }
): Promise<string | null> {
  try {
    const response = await Enquirer.prompt<{ value: string }>([
      {
        type: 'input',
        name: 'value',
        message,
        initial: options?.default,
        validate: (value: string) => {
          if (options?.required && !value.trim()) {
            return 'This field is required';
          }
          if (options?.validate) {
            return options.validate(value);
          }
          return true;
        },
      },
    ]);

    return response.value;
  } catch {
    return null;
  }
}

/**
 * Options for project type confirmation
 */
export interface ConfirmProjectTypeOptions {
  /** Detected project type */
  detectedType: string;
  /** Detected framework name */
  framework?: string;
  /** Confidence score */
  confidence: number;
}

/**
 * Result of project type confirmation
 */
export interface ConfirmProjectTypeResult {
  /** Whether the type is confirmed */
  confirmed: boolean;
  /** Whether the user wants to select a different type */
  selectDifferent: boolean;
  /** Whether the user cancelled */
  cancelled: boolean;
}

/**
 * Show an interactive confirmation prompt for detected project type
 */
export async function confirmProjectType(
  options: ConfirmProjectTypeOptions
): Promise<ConfirmProjectTypeResult> {
  const { detectedType, framework, confidence } = options;

  const typeDisplay = framework ? `${framework} (${detectedType})` : detectedType;
  const confidenceLabel =
    confidence >= 90
      ? chalk.green('High confidence')
      : confidence >= 70
        ? chalk.yellow('Medium confidence')
        : chalk.gray('Low confidence');

  console.log();
  console.log(chalk.cyan('┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.cyan('│') + chalk.white.bold('  Project Type Detection') + ' '.repeat(26) + chalk.cyan('│'));
  console.log(chalk.cyan('└─────────────────────────────────────────────────────────────┘'));
  console.log();
  console.log(`  ${chalk.white('Detected:')} ${chalk.cyan(typeDisplay)}`);
  console.log(`  ${chalk.white('Confidence:')} ${confidenceLabel}`);
  console.log();

  try {
    const response = await Enquirer.prompt<{ choice: string }>([
      {
        type: 'select',
        name: 'choice',
        message: 'Is this correct?',
        choices: [
          { name: 'yes', message: 'Yes, use this template', hint: 'Proceed with the detected type' },
          { name: 'select', message: 'Select a different template', hint: 'Choose from the template list' },
          { name: 'no', message: 'No, use default template', hint: 'Use the generic default template' },
        ],
        initial: 0,
      },
    ]);

    return {
      confirmed: response.choice === 'yes',
      selectDifferent: response.choice === 'select',
      cancelled: false,
    };
  } catch (error) {
    if ((error as ErrnoException).code === 'ERR_CANCELED') {
      return {
        confirmed: false,
        selectDifferent: false,
        cancelled: true,
      };
    }
    throw error;
  }
}

/**
 * Options for output directory prompt
 */
export interface PromptOutputDirectoryOptions {
  /** Default output directory */
  defaultDirectory: string;
  /** Whether to validate the directory exists */
  validateExists?: boolean;
}

/**
 * Result of output directory prompt
 */
export interface PromptOutputDirectoryResult {
  /** Selected directory path */
  directory: string;
  /** Whether the user cancelled */
  cancelled: boolean;
}

/**
 * Show an interactive prompt for output directory selection
 */
export async function promptOutputDirectory(
  options: PromptOutputDirectoryOptions
): Promise<PromptOutputDirectoryResult> {
  const { defaultDirectory } = options;

  console.log();
  console.log(chalk.cyan('┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.cyan('│') + chalk.white.bold('  Output Directory') + ' '.repeat(32) + chalk.cyan('│'));
  console.log(chalk.cyan('└─────────────────────────────────────────────────────────────┘'));
  console.log();

  try {
    const response = await Enquirer.prompt<{ directory: string }>([
      {
        type: 'input',
        name: 'directory',
        message: 'Where should AO files be created?',
        initial: defaultDirectory,
        validate: async (value: string) => {
          if (!value.trim()) {
            return 'Directory path is required';
          }

          // Check if path is valid
          const resolvedPath = path.resolve(value);

          // Check if path is absolute or relative
          if (path.isAbsolute(resolvedPath)) {
            // For absolute paths, check if parent exists
            try {
              await fs.access(path.dirname(resolvedPath));
              return true;
            } catch {
              return `Parent directory does not exist: ${path.dirname(resolvedPath)}`;
            }
          }

          return true;
        },
        format: (value: string) => {
          const resolved = path.resolve(value || defaultDirectory);
          return chalk.cyan(resolved);
        },
      },
    ]);

    return {
      directory: path.resolve(response.directory || defaultDirectory),
      cancelled: false,
    };
  } catch (error) {
    if ((error as ErrnoException).code === 'ERR_CANCELED') {
      return {
        directory: defaultDirectory,
        cancelled: true,
      };
    }
    throw error;
  }
}

/**
 * Options for overwrite confirmation
 */
export interface ConfirmOverwriteOptions {
  /** Files that would be overwritten */
  files: string[];
  /** Output directory */
  outputDir: string;
}

/**
 * Result of overwrite confirmation
 */
export interface ConfirmOverwriteResult {
  /** Whether to proceed with overwrite */
  proceed: boolean;
  /** Whether the user cancelled */
  cancelled: boolean;
}

/**
 * Show an interactive confirmation prompt before overwriting files
 */
export async function confirmOverwrite(
  options: ConfirmOverwriteOptions
): Promise<ConfirmOverwriteResult> {
  const { files, outputDir } = options;

  console.log();
  console.log(chalk.yellow('┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.yellow('│') + chalk.yellow.bold('  ⚠ Existing Files Detected') + ' '.repeat(21) + chalk.yellow('│'));
  console.log(chalk.yellow('└─────────────────────────────────────────────────────────────┘'));
  console.log();
  console.log(`  ${chalk.white('The following files will be overwritten:')}`);
  console.log();

  // Show up to 10 files, then summarize
  const maxDisplay = 10;
  const displayFiles = files.slice(0, maxDisplay);
  const remaining = files.length - maxDisplay;

  for (const file of displayFiles) {
    const relativePath = path.relative(outputDir, file);
    console.log(`    ${chalk.red('•')} ${chalk.gray(relativePath)}`);
  }

  if (remaining > 0) {
    console.log(`    ${chalk.gray(`... and ${remaining} more file(s)`)}`);
  }

  console.log();
  console.log(`  ${chalk.gray('These files will be replaced with new AO workflow files.')}`);
  console.log();

  try {
    const response = await Enquirer.prompt<{ confirmed: boolean }>([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Do you want to overwrite these files?',
        initial: false,
      },
    ]);

    return {
      proceed: response.confirmed,
      cancelled: false,
    };
  } catch (error) {
    if ((error as ErrnoException).code === 'ERR_CANCELED') {
      return {
        proceed: false,
        cancelled: true,
      };
    }
    throw error;
  }
}
