import chalk from 'chalk';
import Enquirer from 'enquirer';
import type { TemplateInfo } from '../commands/templates.js';

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
        format: (value: string) => {
          const template = templates.find((t) => t.id === value);
          return template ? chalk.white(template.name) : value;
        },
      },
    ]);

    return {
      templateId: response.template,
      cancelled: false,
    };
  } catch (error) {
    // Handle ctrl+c or other cancellations
    if ((error as NodeJS.ErrnoException).code === 'ERR_CANCELED') {
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
    validate?: (value: string) => boolean | string;
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
            const result = options.validate(value);
            return result === true || typeof result === 'string' ? result : 'Invalid input';
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
