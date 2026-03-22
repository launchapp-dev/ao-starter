#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { detectCommand } from './commands/detect.js';
import { templatesCommand, listTemplates } from './commands/templates.js';
import type { TemplatesOptions } from './commands/templates.js';

/**
 * CLI version - matches package.json version
 */
const VERSION = '0.1.0';

/**
 * Available CLI commands
 */
const COMMANDS = {
  INIT: 'init',
  DETECT: 'detect',
  TEMPLATES: 'templates',
} as const;

/**
 * Configure the main CLI program
 */
function configureProgram(): Command {
  const prog = new Command();

  // Set up program基本信息
  prog
    .name('ao')
    .description('AO Starter - Scaffold AO workflows for any project')
    .version(VERSION, '-v, --version', 'Output the current version')
    .helpOption('-h, --help', 'Display help information')
    .addHelpText(
      'after',
      `
Examples:
  $ ao init                  Initialize AO workflows for current project
  $ ao init --template nextjs  Initialize with Next.js template
  $ ao templates              List all available templates
  $ ao templates nextjs        Show details for Next.js template
  $ ao templates --json        Output templates in JSON format
  $ ao detect                 Detect project type

For more information, see https://github.com/launchapp-dev/ao-starter`
    );

  // Register init command
  prog
    .command(COMMANDS.INIT)
    .description('Initialize AO workflows for the current project')
    .option(
      '-t, --template <template>',
      'Use a specific template (typescript, nextjs, rust, python, monorepo)'
    )
    .option(
      '-l, --list',
      'List available templates and their descriptions'
    )
    .option(
      '-o, --output <path>',
      'Output directory for generated files',
      '.ao'
    )
    .option(
      '--skip-detect',
      'Skip automatic project detection'
    )
    .option(
      '--force',
      'Force override auto-detection even when a .ao directory exists'
    )
    .option(
      '--dry-run',
      'Preview changes without writing files'
    )
    .action(initCommand);

  // Register detect command
  prog
    .command(COMMANDS.DETECT)
    .description('Detect project type and show recommendations')
    .option('--json', 'Output in JSON format')
    .action(detectCommand);

  // Register templates command
  prog
    .command(COMMANDS.TEMPLATES)
    .description('List and show details for available templates')
    .argument('[name]', 'Template name to show details for')
    .option('--json', 'Output in JSON format')
    .action((name: string | undefined, options: TemplatesOptions) => {
      templatesCommand({ ...options, name });
    });

  return prog;
}

/**
 * Main entry point for the CLI
 */
async function main(): Promise<void> {
  // Print welcome banner
  printBanner();

  // Configure and parse CLI
  const prog = configureProgram();

  // Check for --list flag and handle it before parsing
  const args = process.argv.slice(2);
  if (args.includes('--list') || args.includes('-l')) {
    // Find the position of init command
    const initIndex = args.indexOf(COMMANDS.INIT);
    if (initIndex !== -1) {
      // Check if there are any other options besides --list/-l
      const otherArgs = args
        .slice(initIndex + 1)
        .filter((a) => a !== '--list' && a !== '-l');
      if (otherArgs.length === 0) {
        // Just --list with init, show templates and exit
        listTemplates();
        return;
      }
    }
  }

  // Parse arguments
  prog.parse();
}

/**
 * Print welcome banner
 */
function printBanner(): void {
  console.log(chalk.blue.bold('\n🚀 AO Starter - Scaffold AO workflows for any project\n'));
}

/**
 * Global error handler
 */
process.on('uncaughtException', (error: Error) => {
  console.error(chalk.red('\n✗ Unexpected error:'));
  console.error(chalk.red(`  ${error.message}`));
  console.error(chalk.gray('\nStack trace:'));
  console.error(chalk.gray(error.stack || 'No stack trace available'));
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error(chalk.red('\n✗ Unhandled promise rejection:'));
  console.error(chalk.red(`  ${reason instanceof Error ? reason.message : String(reason)}`));
  process.exit(1);
});

// Export for testing
export { configureProgram, COMMANDS, VERSION };

// Run main function
main().catch((error) => {
  console.error(chalk.red('\n✗ Fatal error:'));
  console.error(chalk.red(`  ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
