#!/usr/bin/env node

import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { detectCommand } from './commands/detect.js';
import chalk from 'chalk';

const VERSION = '0.1.0';

console.log(chalk.blue.bold('\n🚀 AO Starter - Scaffold AO workflows for any project\n'));

program
  .name('create-ao')
  .description('CLI tool to scaffold AO workflows for any project')
  .version(VERSION);

program
  .command('init')
  .description('Initialize AO workflows for the current project')
  .option('-t, --template <template>', 'Use a specific template (nextjs, rust, python, etc.)')
  .option('-o, --output <path>', 'Output directory for generated files', '.ao')
  .option('--skip-detect', 'Skip automatic project detection')
  .option('--dry-run', 'Preview changes without writing files')
  .action(initCommand);

program
  .command('detect')
  .description('Detect project type and show recommendations')
  .action(detectCommand);

program.parse();
