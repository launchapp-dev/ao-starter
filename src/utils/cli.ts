import pc from 'picocolors';

/**
 * CLI output utilities using picocolors
 * Provides consistent, styled output for the create-ao CLI
 */
export const cli = {
  // Formatting
  bold: (text: string): string => pc.bold(text),
  dim: (text: string): string => pc.dim(text),
  italic: (text: string): string => pc.italic(text),

  // Colors
  black: (text: string): string => pc.black(text),
  red: (text: string): string => pc.red(text),
  green: (text: string): string => pc.green(text),
  yellow: (text: string): string => pc.yellow(text),
  blue: (text: string): string => pc.blue(text),
  magenta: (text: string): string => pc.magenta(text),
  cyan: (text: string): string => pc.cyan(text),
  white: (text: string): string => pc.white(text),
  gray: (text: string): string => pc.gray(text),

  // Backgrounds
  bgBlack: (text: string): string => pc.bgBlack(text),
  bgRed: (text: string): string => pc.bgRed(text),
  bgGreen: (text: string): string => pc.bgGreen(text),
  bgYellow: (text: string): string => pc.bgYellow(text),
  bgBlue: (text: string): string => pc.bgBlue(text),
  bgMagenta: (text: string): string => pc.bgMagenta(text),
  bgCyan: (text: string): string => pc.bgCyan(text),
  bgWhite: (text: string): string => pc.bgWhite(text),

  // Styling
  reset: (text: string): string => pc.reset(text),
  underline: (text: string): string => pc.underline(text),
  strikethrough: (text: string): string => pc.strikethrough(text),

  // Combinations
  success: (text: string): string => pc.green(pc.bold(text)),
  error: (text: string): string => pc.red(pc.bold(text)),
  warning: (text: string): string => pc.yellow(pc.bold(text)),
  info: (text: string): string => pc.cyan(pc.bold(text)),

  // Special
  neon: (text: string): string => pc.magenta(pc.bold(text)),

  // Spinners/indicators
  check: (): string => pc.green('✓'),
  cross: (): string => pc.red('✗'),
  arrow: (): string => pc.cyan('→'),
  bullet: (): string => pc.gray('•'),
  dash: (): string => pc.gray('—'),
  star: (): string => pc.yellow('★'),
  dot: (): string => pc.gray('◦'),

  // Status indicators
  pending: (text: string): string => pc.yellow(text),
  ready: (text: string): string => pc.green(text),
  running: (text: string): string => pc.blue(text),
  failed: (text: string): string => pc.red(text),
  skipped: (text: string): string => pc.gray(text),

  // Terminal helpers
  clear: (): void => {
    process.stdout.write('\x1B[2J\x1B[0f');
  },

  // Cursor control
  cursor: {
    hide: (): string => '\x1B[?25l',
    show: (): string => '\x1B[?25h',
  },
} as const;

export type Cli = typeof cli;
