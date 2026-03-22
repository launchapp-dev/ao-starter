import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { initCommand, InitError } from './init.js';
import type { initOptions } from './init.js';

describe('initCommand', () => {
  let tempDir: string;
  let originalCwd: string;
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let originalExit: typeof process.exit;
  let logOutput: string[];
  let errorOutput: string[];

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ao-init-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Store original functions
    originalLog = console.log;
    originalError = console.error;
    originalExit = process.exit;
    
    // Initialize output arrays
    logOutput = [];
    errorOutput = [];
    
    // Override console methods
    console.log = (...args: unknown[]) => {
      logOutput.push(args.join(' '));
    };
    console.error = (...args: unknown[]) => {
      errorOutput.push(args.join(' '));
    };
    process.exit = (() => {
      throw new Error('process.exit called');
    }) as typeof process.exit;
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    
    // Restore original functions
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
  });

  describe('initCommand with --dry-run', () => {
    it('should not create any files in dry-run mode', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: true,
        skipDetect: false,
      };

      // Create a project to detect
      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      await initCommand(options);

      // Check no files were created (except for the project files we created)
      const allFiles = await fs.readdir(tempDir);
      const createdFiles = allFiles.filter((f) => f !== 'package.json' && f !== 'tsconfig.json');
      expect(createdFiles.filter((f) => !f.startsWith('.'))).toHaveLength(0);
    });

    it('should show dry run mode indicator', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: true,
        skipDetect: false,
      };

      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Dry run');
      expect(allOutput).toContain('no files will be written');
    });

    it('should list files that would be created in dry-run mode', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: true,
        skipDetect: false,
      };

      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('files that would be created');
      // Should list expected output files (created directly in output dir)
      expect(allOutput).toContain('custom.yaml');
      expect(allOutput).toContain('agents.yaml');
    });

    it('should skip existing file check in dry-run mode', async () => {
      // Create a file that would conflict (in output dir, not .ao/)
      await fs.writeFile(path.join(tempDir, 'agents.yaml'), 'existing');

      const options: initOptions = {
        output: tempDir,
        dryRun: true,
        skipDetect: false,
        force: false,
      };

      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      // Should not error or warn about existing files
      await initCommand(options);

      // Should not show warning about existing files
      const errorStr = errorOutput.join('\n');
      expect(errorStr).not.toContain('already exist');
    });
  });

  describe('initCommand with --template', () => {
    it('should accept valid template id', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'typescript',
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Template:');
      expect(allOutput).toContain('TypeScript');
    });

    it('should accept nextjs template', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'nextjs',
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Next.js');
    });

    it('should accept rust-workspace template', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'rust-workspace',
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Rust Workspace');
    });

    it('should accept python template', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'python',
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Python');
    });

    it('should throw InitError for invalid template', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'nonexistent-template',
      };

      await expect(initCommand(options)).rejects.toThrow('process.exit called');

      expect(errorOutput.length).toBeGreaterThan(0);
      const errorStr = errorOutput.join('\n');
      expect(errorStr).toContain('Invalid template');
      expect(errorStr).toContain('nonexistent-template');
      expect(errorStr).toContain('ao init --list');
    });

    it('should show available templates in error message', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'bad-template',
      };

      await expect(initCommand(options)).rejects.toThrow('process.exit called');

      const errorStr = errorOutput.join('\n');
      // Should mention available templates
      expect(errorStr).toContain('default');
      expect(errorStr).toContain('typescript');
    });
  });

  describe('initCommand with --output', () => {
    it('should create files in specified output directory', async () => {
      const outputDir = path.join(tempDir, 'custom-output', 'subdir');
      const options: initOptions = {
        output: outputDir,
        dryRun: false,
        skipDetect: true,
      };

      await initCommand(options);

      // Check that files were created in the output directory
      const customYamlExists = await fs.pathExists(path.join(outputDir, 'custom.yaml'));
      expect(customYamlExists).toBe(true);

      // Check some expected files
      const files = await fs.readdir(outputDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should resolve relative output path', async () => {
      const options: initOptions = {
        output: './test-output',
        dryRun: false,
        skipDetect: true,
      };

      await initCommand(options);

      const resolvedPath = path.join(tempDir, 'test-output');
      const customYamlExists = await fs.pathExists(path.join(resolvedPath, 'custom.yaml'));
      expect(customYamlExists).toBe(true);
    });

    it('should work with absolute output path', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
      };

      await initCommand(options);

      const customYamlExists = await fs.pathExists(path.join(tempDir, 'custom.yaml'));
      expect(customYamlExists).toBe(true);
    });

    it('should warn about empty output directory', async () => {
      const emptyOutputDir = path.join(tempDir, 'empty-project');
      await fs.ensureDir(emptyOutputDir);

      const options: initOptions = {
        output: emptyOutputDir,
        dryRun: false,
        skipDetect: true,
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('empty');
    });
  });

  describe('InitError error codes', () => {
    it('should have INVALID_TEMPLATE error code', () => {
      const error = new InitError('Invalid template', 'INVALID_TEMPLATE');
      expect(error.code).toBe('INVALID_TEMPLATE');
      expect(error.name).toBe('InitError');
      expect(error.message).toBe('Invalid template');
    });

    it('should have PERMISSION_DENIED error code', () => {
      const error = new InitError('Permission denied', 'PERMISSION_DENIED');
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.name).toBe('InitError');
    });

    it('should have EXISTING_FILES error code', () => {
      const error = new InitError('Existing files found', 'EXISTING_FILES');
      expect(error.code).toBe('EXISTING_FILES');
      expect(error.name).toBe('InitError');
    });

    it('should have EMPTY_OUTPUT_DIR error code', () => {
      const error = new InitError('Empty output directory', 'EMPTY_OUTPUT_DIR');
      expect(error.code).toBe('EMPTY_OUTPUT_DIR');
      expect(error.name).toBe('InitError');
    });

    it('should be instanceof Error', () => {
      const error = new InitError('Test', 'INVALID_TEMPLATE');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof InitError).toBe(true);
    });

    it('should format INVALID_TEMPLATE error correctly', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'invalid',
      };

      await expect(initCommand(options)).rejects.toThrow('process.exit called');

      const errorStr = errorOutput.join('\n');
      expect(errorStr).toContain('✗ Invalid template:');
    });

    it('should format PERMISSION_DENIED error correctly', async () => {
      // Create a read-only directory
      const readonlyDir = path.join(tempDir, 'readonly');
      await fs.ensureDir(readonlyDir);
      await fs.chmod(readonlyDir, '444');

      try {
        const options: initOptions = {
          output: readonlyDir,
          dryRun: false,
          skipDetect: true,
        };

        await expect(initCommand(options)).rejects.toThrow('process.exit called');

        const errorStr = errorOutput.join('\n');
        expect(errorStr).toContain('✗ Permission denied:');
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(readonlyDir, '755');
      }
    });
  });

  describe('validateTemplate behavior (through command)', () => {
    it('should return undefined for no template specified', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: true,
        skipDetect: true,
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      // Should use default template
      expect(allOutput).toContain('Default');
    });

    it('should reject template with wrong case', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'TypeScript', // Wrong case
      };

      await expect(initCommand(options)).rejects.toThrow('process.exit called');

      expect(errorOutput.length).toBeGreaterThan(0);
    });

    it('should reject template with hyphens instead of dashes', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'typescript_monorepo', // Underscores instead of dashes
      };

      await expect(initCommand(options)).rejects.toThrow('process.exit called');

      expect(errorOutput.length).toBeGreaterThan(0);
    });

    it('should accept all valid template ids', async () => {
      const validTemplates = [
        'default',
        'typescript',
        'typescript-monorepo',
        'javascript',
        'nextjs',
        'rust',
        'rust-workspace',
        'python',
      ];

      for (const template of validTemplates) {
        // Clear output directory for each iteration
        const outputDir = path.join(tempDir, template);
        await fs.ensureDir(outputDir);

        const options: initOptions = {
          output: outputDir,
          dryRun: false,
          skipDetect: true,
          template,
        };

        // Should not throw
        await initCommand(options);

        // Should show success
        const allOutput = logOutput.join('\n');
        expect(allOutput).toContain('initialized successfully');

        // Reset output arrays
        logOutput = [];
        errorOutput = [];
      }
    });
  });

  describe('checkExistingFiles behavior', () => {
    it('should detect existing files when not in force mode', async () => {
      // Pre-create a file that would be generated (in the output dir, not .ao/)
      await fs.writeFile(path.join(tempDir, 'agents.yaml'), 'existing content');

      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        force: false,
      };

      await initCommand(options);

      // Should show warning about existing files
      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Warning:');
      expect(allOutput).toContain('already exist');
      expect(allOutput).toContain('agents.yaml');
    });

    it('should not warn about existing files in force mode', async () => {
      // Pre-create a file that would be generated
      await fs.writeFile(path.join(tempDir, 'agents.yaml'), 'existing content');

      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        force: true,
      };

      await initCommand(options);

      // Should not show warning
      const allOutput = logOutput.join('\n');
      expect(allOutput).not.toContain('Warning:');
      expect(allOutput).not.toContain('already exist');
    });

    it('should not warn about existing files in dry-run mode', async () => {
      // Pre-create a file that would be generated
      await fs.writeFile(path.join(tempDir, 'agents.yaml'), 'existing content');

      const options: initOptions = {
        output: tempDir,
        dryRun: true,
        skipDetect: true,
        force: false,
      };

      await initCommand(options);

      // Should not show warning (existing files check is skipped in dry-run)
      const allOutput = logOutput.join('\n');
      expect(allOutput).not.toContain('Warning:');
      expect(allOutput).not.toContain('already exist');
    });

    it('should check all files for project type', async () => {
      // Create multiple files
      await fs.writeFile(path.join(tempDir, 'custom.yaml'), 'existing');
      await fs.writeFile(path.join(tempDir, 'phases.yaml'), 'existing');

      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        force: false,
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('already exist');
      // Both files should be mentioned
      expect(allOutput).toContain('custom.yaml');
      expect(allOutput).toContain('phases.yaml');
    });
  });

  describe('--list flag', () => {
    it('should show template list and exit', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        list: true,
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Available Templates');
      expect(allOutput).toContain('default');
      expect(allOutput).toContain('typescript');
      expect(allOutput).toContain('nextjs');
      expect(allOutput).toContain('rust');
    });
  });

  describe('successful initialization', () => {
    it('should show success message after creating files', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'typescript',
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Created AO workflow files');
      expect(allOutput).toContain('initialized successfully');
      expect(allOutput).toContain('Next steps');
    });

    it('should create actual files on disk', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'typescript',
      };

      await initCommand(options);

      // Check at least one config file was created
      const files = await fs.readdir(tempDir);
      expect(files.length).toBeGreaterThan(0);
      
      // Verify specific files exist
      const customYamlExists = await fs.pathExists(path.join(tempDir, 'custom.yaml'));
      expect(customYamlExists).toBe(true);
    });

    it('should include detected project type in output', async () => {
      // Create a Next.js project - should be detected
      await fs.writeJson('package.json', {
        name: 'my-next-app',
        dependencies: { next: '14.0.0', react: '18.0.0' },
      });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: false,
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      // Detection should happen (but may detect as typescript not nextjs due to detection rules)
      expect(allOutput).toContain('Detected project type:');
    });
  });

  describe('--force flag', () => {
    it('should bypass detection with --force and --template', async () => {
      // Create conflicting files in output dir (not .ao/)
      await fs.writeFile(path.join(tempDir, 'agents.yaml'), 'existing');

      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: false,
        force: true,
        template: 'rust',
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Using specified template');
      expect(allOutput).toContain('rust');
    });

    it('should use default template with --force only', async () => {
      // Create a project to potentially detect
      await fs.writeJson('package.json', { name: 'test-project' });

      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: false,
        force: true,
      };

      await initCommand(options);

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('bypasses auto-detection');
      expect(allOutput).toContain('default template');
    });
  });

  describe('--skip-detect flag', () => {
    it('should skip detection when flag is set', async () => {
      const options: initOptions = {
        output: tempDir,
        dryRun: false,
        skipDetect: true,
        template: 'python',
      };

      await initCommand(options);

      // Should not show any detection messages
      const allOutput = logOutput.join('\n');
      expect(allOutput).not.toContain('Detected project type:');
    });
  });
});
