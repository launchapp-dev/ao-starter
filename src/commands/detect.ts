import chalk from 'chalk';
import { ProjectDetector } from '../detectors/project-detector.js';

export interface DetectOptions {
  json?: boolean;
}

export async function detectCommand(options: DetectOptions): Promise<void> {
  if (options.json) {
    await detectJson();
  } else {
    await detectHuman();
  }
}

async function detectHuman(): Promise<void> {
  console.log(chalk.cyan('Analyzing project...\n'));

  try {
    const detector = new ProjectDetector();
    const detection = await detector.detect();

    console.log(chalk.bold('Project Detection Results:\n'));
    console.log(`  ${chalk.gray('Type:')}      ${chalk.white(detection.type || 'Unknown')}`);

    if (detection.framework) {
      console.log(`  ${chalk.gray('Framework:')} ${chalk.white(detection.framework)}`);
    }

    if (detection.language) {
      console.log(`  ${chalk.gray('Language:')}  ${chalk.white(detection.language)}`);
    }

    if (detection.monorepo) {
      console.log(`  ${chalk.gray('Monorepo:')}  ${chalk.white('Yes')}`);
      if (detection.packages && detection.packages.length > 0) {
        console.log(`  ${chalk.gray('Packages:')}  ${chalk.white(detection.packages.join(', '))}`);
      }
    }

    if (detection.rootPackage) {
      console.log(`  ${chalk.gray('Package:')}   ${chalk.white(detection.rootPackage)}`);
    }

    if (detection.buildTool) {
      console.log(`  ${chalk.gray('Build Tool:')} ${chalk.white(detection.buildTool)}`);
    }

    if (detection.indicators && detection.indicators.length > 0) {
      console.log(`  ${chalk.gray('Indicators:')} ${chalk.gray(detection.indicators.join(', '))}`);
    }

    console.log();

    if (detection.recommendations && detection.recommendations.length > 0) {
      console.log(chalk.bold('Recommendations:\n'));
      detection.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
      console.log();
    }

    console.log(chalk.gray(`Run ${chalk.cyan('create-ao init')} to generate AO workflow files.\n`));
  } catch (error) {
    console.error(chalk.red('Error detecting project:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function detectJson(): Promise<void> {
  try {
    const detector = new ProjectDetector();
    const detection = await detector.detect();
    console.log(JSON.stringify(detection, null, 2));
  } catch (error) {
    console.error(chalk.red('Error detecting project:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
