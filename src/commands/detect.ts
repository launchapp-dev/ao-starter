import chalk from 'chalk';
import { ProjectDetector } from '../detectors/project-detector.js';
import { setLoggerConfig, logger } from '../utils/logger.js';

/**
 * CLI options for the detect command
 */
export interface DetectOptions {
  /** Output in JSON format */
  json?: boolean;
  /** Suppress progress messages, only show errors and final result */
  quiet?: boolean;
  /** Show detailed step-by-step output during detection */
  verbose?: boolean;
}

/**
 * Detect command implementation
 */
export async function detectCommand(options: DetectOptions): Promise<void> {
  // Configure logger based on options
  setLoggerConfig({
    quiet: options.quiet ?? false,
    verbose: options.verbose ?? false,
  });

  if (options.json) {
    await detectJson();
  } else {
    await detectHuman();
  }
}

async function detectHuman(): Promise<void> {
  logger.banner(chalk.cyan('Analyzing project...\n'));

  try {
    const detector = new ProjectDetector();

    // Verbose: Show detection step
    logger.step(1, 3, 'Scanning project files...');

    const detection = await detector.detect();

    // Verbose: Show analysis complete
    logger.step(2, 3, 'Analyzing detection results...');

    logger.banner(chalk.bold('Project Detection Results:\n'));

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

    // Verbose: Show indicators
    if (logger.isVerbose() && detection.indicators && detection.indicators.length > 0) {
      logger.detection('File indicators found:');
      detection.indicators.forEach((indicator) => {
        logger.list(indicator);
      });
      console.log();
    }

    if (detection.recommendations && detection.recommendations.length > 0) {
      logger.banner(chalk.bold('Recommendations:\n'));
      detection.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
      console.log();
    }

    // Verbose: Show final step
    logger.step(3, 3, 'Detection complete');

    if (!logger.isQuiet()) {
      console.log(chalk.gray(`Run ${chalk.cyan('ao init')} to generate AO workflow files.\n`));
    }
  } catch (error) {
    logger.error('Error detecting project:');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function detectJson(): Promise<void> {
  try {
    const detector = new ProjectDetector();
    const detection = await detector.detect();
    console.log(JSON.stringify(detection, null, 2));
  } catch (error) {
    logger.error('Error detecting project:');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
