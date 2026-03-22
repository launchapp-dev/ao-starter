import pc from 'picocolors';

/**
 * Verbosity levels for CLI output
 */
export type LogLevel = 'quiet' | 'normal' | 'verbose';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Current verbosity level */
  level: LogLevel;
  /** Whether to suppress all output except errors and final results */
  quiet: boolean;
  /** Whether to show detailed step-by-step output */
  verbose: boolean;
  /** Whether to skip all confirmation prompts */
  yes: boolean;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  level: 'normal',
  quiet: false,
  verbose: false,
  yes: false,
};

/**
 * Current logger configuration
 */
let config: LoggerConfig = { ...defaultConfig };

/**
 * Set logger configuration
 */
export function setLoggerConfig(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };

  // Sync level based on flags - verbose takes precedence when both are set
  if (config.verbose && !config.quiet) {
    config.level = 'verbose';
  } else if (config.quiet && !config.verbose) {
    config.level = 'quiet';
  } else {
    config.level = 'normal';
  }
}

/**
 * Reset logger to default configuration
 */
export function resetLoggerConfig(): void {
  config = { ...defaultConfig };
}

/**
 * Get current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...config };
}

/**
 * Check if we should show output at current verbosity level
 * Verbose flag takes precedence over level when both quiet and verbose are set
 */
function shouldOutput(neededLevel: 'quiet' | 'normal' | 'verbose'): boolean {
  // If verbose flag is set, always show verbose output (even if level is normal)
  if (config.verbose && neededLevel === 'verbose') {
    return true;
  }

  switch (neededLevel) {
    case 'quiet':
      // Only show in quiet mode - errors and final results
      return config.level === 'quiet';
    case 'normal':
      // Show in normal and verbose modes (but not quiet mode)
      return config.level !== 'quiet';
    case 'verbose':
      // Only show in verbose mode (level must be 'verbose')
      return config.level === 'verbose';
    default:
      return true;
  }
}

/**
 * Formatted console output with colors
 */
const cli = {
  // Formatting
  bold: (text: string): string => pc.bold(text),
  dim: (text: string): string => pc.dim(text),

  // Colors
  red: (text: string): string => pc.red(text),
  green: (text: string): string => pc.green(text),
  yellow: (text: string): string => pc.yellow(text),
  blue: (text: string): string => pc.blue(text),
  cyan: (text: string): string => pc.cyan(text),
  white: (text: string): string => pc.white(text),
  gray: (text: string): string => pc.gray(text),

  // Status indicators
  check: (): string => pc.green('✓'),
  cross: (): string => pc.red('✗'),
  arrow: (): string => pc.cyan('→'),

  // Terminal helpers
  clear: (): void => {
    process.stdout.write('\x1B[2J\x1B[0f');
  },
} as const;

/**
 * Logger with configurable verbosity levels
 */
export const logger = {
  /**
   * Info output - shown in normal and verbose modes
   */
  info: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('normal')) {
      console.log(message, ...args);
    }
  },

  /**
   * Success output - shown in normal and verbose modes
   */
  success: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('normal')) {
      console.log(cli.green('✓ ') + message, ...args);
    }
  },

  /**
   * Warning output - shown in normal and verbose modes
   */
  warn: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('normal')) {
      console.log(cli.yellow('⚠ ') + message, ...args);
    }
  },

  /**
   * Error output - always shown
   */
  error: (message: string, ...args: unknown[]): void => {
    console.error(cli.red('✗ ') + message, ...args);
  },

  /**
   * Debug/verbose output - only shown in verbose mode
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('verbose')) {
      console.log(cli.gray('[debug] ') + message, ...args);
    }
  },

  /**
   * Step indicator for verbose mode - shows progress through steps
   */
  step: (step: number, total: number, message: string, ...args: unknown[]): void => {
    if (shouldOutput('verbose')) {
      console.log(
        cli.gray(`[${step}/${total}] `) + cli.cyan('→ ') + message,
        ...args
      );
    }
  },

  /**
   * Result output - shown in quiet mode as final result
   */
  result: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('quiet')) {
      // In quiet mode, only show the final result
      console.log(message, ...args);
    } else {
      console.log(message, ...args);
    }
  },

  /**
   * Banner/header output - shown in normal and verbose modes
   */
  banner: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('normal')) {
      console.log(message, ...args);
    }
  },

  /**
   * List item output - shown in normal and verbose modes
   */
  list: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('normal')) {
      console.log(cli.gray('  ' + message), ...args);
    }
  },

  /**
   * Raw console.log wrapper - always shown
   */
  log: (message: string, ...args: unknown[]): void => {
    console.log(message, ...args);
  },

  /**
   * Raw console.error wrapper - always shown
   */
  err: (message: string, ...args: unknown[]): void => {
    console.error(message, ...args);
  },

  /**
   * Verbose detection details - only shown in verbose mode
   */
  detection: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('verbose')) {
      console.log(cli.gray('  [detection] ') + message, ...args);
    }
  },

  /**
   * Verbose generation details - only shown in verbose mode
   */
  generation: (message: string, ...args: unknown[]): void => {
    if (shouldOutput('verbose')) {
      console.log(cli.gray('  [generation] ') + message, ...args);
    }
  },

  /**
   * Check if running in non-interactive mode (--yes flag)
   */
  isYes: (): boolean => config.yes,

  /**
   * Check if running in quiet mode
   */
  isQuiet: (): boolean => config.level === 'quiet',

  /**
   * Check if running in verbose mode
   */
  isVerbose: (): boolean => config.level === 'verbose',
};

export type Logger = typeof logger;
