import { logger, setLoggerConfig, resetLoggerConfig, getLoggerConfig } from './logger.js';

describe('logger', () => {
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let logOutput: string[];
  let errorOutput: string[];

  beforeEach(() => {
    originalLog = console.log;
    originalError = console.error;
    logOutput = [];
    errorOutput = [];

    console.log = (...args: unknown[]) => {
      logOutput.push(args.join(' '));
    };
    console.error = (...args: unknown[]) => {
      errorOutput.push(args.join(' '));
    };

    // Reset to default config before each test
    resetLoggerConfig();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    resetLoggerConfig();
  });

  describe('info', () => {
    it('should log info messages in normal mode', () => {
      logger.info('Test message');
      expect(logOutput).toContain('Test message');
    });

    it('should not log info messages in quiet mode', () => {
      setLoggerConfig({ quiet: true });
      logger.info('Test message');
      expect(logOutput).not.toContain('Test message');
    });

    it('should log info messages in verbose mode', () => {
      setLoggerConfig({ verbose: true });
      logger.info('Test message');
      expect(logOutput).toContain('Test message');
    });
  });

  describe('success', () => {
    it('should log success messages with checkmark in normal mode', () => {
      logger.success('Success message');
      expect(logOutput[0]).toContain('✓');
      expect(logOutput[0]).toContain('Success message');
    });

    it('should not log success messages in quiet mode', () => {
      setLoggerConfig({ quiet: true });
      logger.success('Success message');
      expect(logOutput).toHaveLength(0);
    });
  });

  describe('warn', () => {
    it('should log warning messages with warning indicator', () => {
      logger.warn('Warning message');
      expect(logOutput[0]).toContain('⚠');
      expect(logOutput[0]).toContain('Warning message');
    });

    it('should not log warnings in quiet mode', () => {
      setLoggerConfig({ quiet: true });
      logger.warn('Warning message');
      expect(logOutput).toHaveLength(0);
    });
  });

  describe('error', () => {
    it('should always log error messages', () => {
      logger.error('Error message');
      expect(errorOutput[0]).toContain('✗');
      expect(errorOutput[0]).toContain('Error message');
    });

    it('should log errors in quiet mode', () => {
      setLoggerConfig({ quiet: true });
      logger.error('Error message');
      expect(errorOutput[0]).toContain('✗');
      expect(errorOutput[0]).toContain('Error message');
    });

    it('should log errors in verbose mode', () => {
      setLoggerConfig({ verbose: true });
      logger.error('Error message');
      expect(errorOutput[0]).toContain('✗');
      expect(errorOutput[0]).toContain('Error message');
    });
  });

  describe('debug', () => {
    it('should not log debug messages in normal mode', () => {
      logger.debug('Debug message');
      expect(logOutput).toHaveLength(0);
    });

    it('should not log debug messages in quiet mode', () => {
      setLoggerConfig({ quiet: true });
      logger.debug('Debug message');
      expect(logOutput).toHaveLength(0);
    });

    it('should log debug messages with [debug] prefix in verbose mode', () => {
      setLoggerConfig({ verbose: true });
      logger.debug('Debug message');
      expect(logOutput).toContain('[debug] Debug message');
    });
  });

  describe('step', () => {
    it('should not log steps in normal mode', () => {
      logger.step(1, 3, 'Step message');
      expect(logOutput).toHaveLength(0);
    });

    it('should log steps with progress indicator in verbose mode', () => {
      setLoggerConfig({ verbose: true });
      logger.step(1, 3, 'Step message');
      expect(logOutput[0]).toContain('[1/3]');
      expect(logOutput[0]).toContain('Step message');
    });
  });

  describe('detection', () => {
    it('should not log detection details in normal mode', () => {
      logger.detection('Detection message');
      expect(logOutput).toHaveLength(0);
    });

    it('should log detection details with [detection] prefix in verbose mode', () => {
      setLoggerConfig({ verbose: true });
      logger.detection('Detected something');
      expect(logOutput).toContain('  [detection] Detected something');
    });
  });

  describe('generation', () => {
    it('should not log generation details in normal mode', () => {
      logger.generation('Generation message');
      expect(logOutput).toHaveLength(0);
    });

    it('should log generation details with [generation] prefix in verbose mode', () => {
      setLoggerConfig({ verbose: true });
      logger.generation('Generating files');
      expect(logOutput).toContain('  [generation] Generating files');
    });
  });

  describe('isYes', () => {
    it('should return false by default', () => {
      expect(logger.isYes()).toBe(false);
    });

    it('should return true when yes option is set', () => {
      setLoggerConfig({ yes: true });
      expect(logger.isYes()).toBe(true);
    });
  });

  describe('isQuiet', () => {
    it('should return false by default', () => {
      expect(logger.isQuiet()).toBe(false);
    });

    it('should return true when quiet option is set', () => {
      setLoggerConfig({ quiet: true });
      expect(logger.isQuiet()).toBe(true);
    });
  });

  describe('isVerbose', () => {
    it('should return false by default', () => {
      expect(logger.isVerbose()).toBe(false);
    });

    it('should return true when verbose option is set', () => {
      setLoggerConfig({ verbose: true });
      expect(logger.isVerbose()).toBe(true);
    });
  });

  describe('getLoggerConfig', () => {
    it('should return current logger configuration', () => {
      const config = getLoggerConfig();
      expect(config).toHaveProperty('level', 'normal');
      expect(config).toHaveProperty('quiet', false);
      expect(config).toHaveProperty('verbose', false);
      expect(config).toHaveProperty('yes', false);
    });

    it('should reflect updated configuration', () => {
      setLoggerConfig({ quiet: true, verbose: true });
      const config = getLoggerConfig();
      expect(config.quiet).toBe(true);
      expect(config.verbose).toBe(true);
    });
  });

  describe('resetLoggerConfig', () => {
    it('should reset configuration to defaults', () => {
      setLoggerConfig({ quiet: true, verbose: true, yes: true });
      resetLoggerConfig();
      const config = getLoggerConfig();
      expect(config.level).toBe('normal');
      expect(config.quiet).toBe(false);
      expect(config.verbose).toBe(false);
      expect(config.yes).toBe(false);
    });
  });

  describe('result', () => {
    it('should log result in normal mode', () => {
      logger.result('Final result');
      expect(logOutput).toContain('Final result');
    });

    it('should log result in quiet mode', () => {
      setLoggerConfig({ quiet: true });
      logger.result('Quiet result');
      expect(logOutput).toContain('Quiet result');
    });
  });

  describe('banner', () => {
    it('should log banner in normal mode', () => {
      logger.banner('Banner text');
      expect(logOutput).toContain('Banner text');
    });

    it('should not log banner in quiet mode', () => {
      setLoggerConfig({ quiet: true });
      logger.banner('Banner text');
      expect(logOutput).toHaveLength(0);
    });
  });

  describe('list', () => {
    it('should log list items with proper indentation in normal mode', () => {
      logger.list('List item');
      expect(logOutput).toContain('  List item');
    });

    it('should not log list items in quiet mode', () => {
      setLoggerConfig({ quiet: true });
      logger.list('List item');
      expect(logOutput).toHaveLength(0);
    });
  });

  describe('log', () => {
    it('should always log raw messages', () => {
      setLoggerConfig({ quiet: true });
      logger.log('Raw message');
      expect(logOutput).toContain('Raw message');
    });
  });

  describe('err', () => {
    it('should always log raw errors', () => {
      setLoggerConfig({ quiet: true });
      logger.err('Raw error');
      expect(errorOutput).toContain('Raw error');
    });
  });
});
