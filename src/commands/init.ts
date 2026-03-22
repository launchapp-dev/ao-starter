import chalk from 'chalk';
import { ProjectDetector } from '../detectors/project-detector.js';
import { TemplateGenerator } from '../templates/template-generator.js';
import path from 'path';

export interface InitOptions {
  template?: string;
  output: string;
  skipDetect: boolean;
  dryRun: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.cyan('Initializing AO workflows...\n'));

  const outputDir = path.resolve(options.output);

  try {
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
    console.error(chalk.red('Error initializing AO workflows:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
