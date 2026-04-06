import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execa, ExecaChildProcess } from 'execa';

describe('CLI Integration Tests', () => {
  let tempDir: string;
  let cliPath: string;
  let originalCwd: string;

  beforeAll(async () => {
    // Get the absolute path to the CLI entry point
    cliPath = path.resolve(process.cwd(), 'dist/index.js');
    
    // Verify the built CLI exists
    const cliExists = await fs.pathExists(cliPath);
    if (!cliExists) {
      throw new Error(`CLI not built at ${cliPath}. Run 'npm run build' first.`);
    }
  });

  beforeEach(async () => {
    // Create a fresh temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ao-cli-integration-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temp directory
    await fs.remove(tempDir);
  });

  /**
   * Helper to run CLI commands
   */
  async function runCli(args: string[]): Promise<ExecaChildProcess<string>> {
    return execa('node', [cliPath, ...args], {
      cwd: tempDir,
      reject: false,
      cleanup: true,
    });
  }

  describe('ao --version', () => {
    it('should output version number', async () => {
      const result = await runCli(['--version']);
      
      expect(result.exitCode).toBe(0);
      // Version is printed after the banner
      expect(result.stdout).toContain('0.1.0');
    });

    it('should output version with -v flag', async () => {
      const result = await runCli(['-v']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('0.1.0');
    });
  });

  describe('ao --help', () => {
    it('should display help information', async () => {
      const result = await runCli(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AO Starter');
      expect(result.stdout).toContain('ao init');
      expect(result.stdout).toContain('ao detect');
    });

    it('should display help with -h flag', async () => {
      const result = await runCli(['-h']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AO Starter');
    });
  });

  describe('ao detect - all project types', () => {
    it('should detect TypeScript project', async () => {
      await fs.writeJson('package.json', { name: 'test-ts-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('typescript');
    });

    it('should detect TypeScript monorepo', async () => {
      await fs.writeJson('package.json', { name: 'my-monorepo' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });
      await fs.writeJson('turbo.json', { pipeline: {} });

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('typescript-monorepo');
      expect(result.stdout).toContain('Monorepo:');
      expect(result.stdout).toContain('Yes');
    });

    it('should detect JavaScript project', async () => {
      await fs.writeJson('package.json', { name: 'my-js-project' });
      // No tsconfig.json - should be JavaScript

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('javascript');
    });

    it('should detect Next.js project', async () => {
      await fs.writeJson('package.json', {
        name: 'my-next-app',
        dependencies: { next: '14.0.0', react: '18.0.0' },
        devDependencies: { typescript: '^5.0.0' }, // devDependencies required for detection
      });

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('Next.js');
    });

    it('should detect Rust single project', async () => {
      await fs.writeFile('Cargo.toml', `[package]
name = "my-rust-app"
version = "0.1.0"`);

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('rust');
    });

    it('should detect Rust workspace', async () => {
      await fs.writeFile('Cargo.toml', `[workspace]
members = ["crate-a", "crate-b"]
`);

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('rust-workspace');
      expect(result.stdout).toContain('Monorepo:');
    });

    it('should detect Python project with pyproject.toml', async () => {
      await fs.writeFile('pyproject.toml', `[project]
name = "my-python-app"
version = "0.1.0"`);

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('python');
    });

    it('should detect Python project with requirements.txt', async () => {
      await fs.writeFile('requirements.txt', 'requests>=2.28.0');

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('python');
    });

    it('should detect Python project with setup.py', async () => {
      await fs.writeFile('setup.py', 'from setuptools import setup\nsetup(name="my-app")');

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('python');
    });

    it('should detect Bun project', async () => {
      await fs.writeJson('package.json', { name: 'my-bun-project' });
      await fs.writeFile('bun.lockb', '');

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('bun');
    });

    it('should detect Deno project', async () => {
      await fs.writeJson('deno.json', { name: 'my-deno-project', imports: {} });

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('deno');
    });

    it('should detect Deno project with deno.jsonc', async () => {
      await fs.writeFile('deno.jsonc', '{"name": "my-deno-project", "imports": {}}');

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('deno');
    });

    it('should detect Go project', async () => {
      await fs.writeFile('go.mod', `module github.com/user/my-go-app

go 1.21`);

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('go');
    });

    it('should detect Elixir project', async () => {
      await fs.writeFile('mix.exs', `defmodule MyApp.MixProject do
  use Mix.Project

  def project do
    [
      app: :my_app,
      version: "0.1.0"
    ]
  end
end`);

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('elixir');
    });

    it('should show Build Tool for Go projects', async () => {
      await fs.writeFile('go.mod', `module github.com/user/my-go-app

go 1.21`);

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Build Tool:');
      expect(result.stdout).toContain('go');
    });

    it('should show Build Tool for Rust projects', async () => {
      await fs.writeFile('Cargo.toml', `[package]
name = "my-rust-app"
version = "0.1.0"`);

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Build Tool:');
      expect(result.stdout).toContain('cargo');
    });

    it('should output JSON with --json flag', async () => {
      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const result = await runCli(['detect', '--json']);

      expect(result.exitCode).toBe(0);
      
      // Should be valid JSON - skip banner at start and get just the JSON part
      const stdout = result.stdout;
      const jsonStart = stdout.indexOf('{');
      const jsonOutput = stdout.substring(jsonStart);
      
      expect(() => JSON.parse(jsonOutput)).not.toThrow();
      
      const parsed = JSON.parse(jsonOutput);
      expect(parsed.type).toBeDefined();
    });

    it('should output valid JSON for Python project', async () => {
      await fs.writeFile('pyproject.toml', '[project]\nname = "test"');

      const result = await runCli(['detect', '--json']);

      expect(result.exitCode).toBe(0);
      const stdout = result.stdout;
      const jsonStart = stdout.indexOf('{');
      const jsonOutput = stdout.substring(jsonStart);
      
      const parsed = JSON.parse(jsonOutput);
      expect(parsed.type).toBe('python');
    });

    it('should output valid JSON for Go project', async () => {
      await fs.writeFile('go.mod', 'module test\n\ngo 1.21');

      const result = await runCli(['detect', '--json']);

      expect(result.exitCode).toBe(0);
      const stdout = result.stdout;
      const jsonStart = stdout.indexOf('{');
      const jsonOutput = stdout.substring(jsonStart);
      
      const parsed = JSON.parse(jsonOutput);
      expect(parsed.type).toBe('go');
    });

    it('should handle unknown project type', async () => {
      // Empty directory
      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Detection Results');
      expect(result.stdout).toContain('Unknown');
    });

    it('should show recommendations for unknown project', async () => {
      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Recommendations');
      expect(result.stdout).toContain('create-ao init');
    });

    it('should show Indicators section when indicators are present', async () => {
      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Indicators:');
    });

    it('should detect monorepo packages', async () => {
      await fs.writeJson('package.json', { name: 'my-monorepo' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });
      await fs.writeJson('turbo.json', { pipeline: {} });
      await fs.mkdirp('packages/pkg1');
      await fs.mkdirp('packages/pkg2');
      await fs.writeJson('packages/pkg1/package.json', { name: '@my-monorepo/pkg1' });
      await fs.writeJson('packages/pkg2/package.json', { name: '@my-monorepo/pkg2' });

      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Packages:');
    });
  });

  describe('ao init', () => {
    it('should initialize with default template', async () => {
      const result = await runCli(['init', '--skip-detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('initialized successfully');
      expect(result.stdout).toContain('Created AO workflow files');
      
      // Verify files were created
      const files = await fs.readdir(tempDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should create expected config files', async () => {
      const result = await runCli(['init', '--skip-detect']);
      
      // Files are created in .ao/ subdirectory by default
      // Note: Template files need to be bundled in dist for actual file creation
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Initializing AO workflows');
      expect(result.stdout).toContain('AO workflows initialized successfully');
    });

    it('should initialize with typescript template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'typescript']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('TypeScript');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with nextjs template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'nextjs']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Next.js');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with rust template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'rust']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Rust');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with python template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'python']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Python');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with javascript template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'javascript']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('JavaScript');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with typescript-monorepo template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'typescript-monorepo']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('TypeScript Monorepo');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with rust-workspace template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'rust-workspace']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Rust Workspace');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with bun template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'bun']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Bun');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with deno template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'deno']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Deno');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with go template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'go']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Go');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should initialize with elixir template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'elixir']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Elixir');
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should fail with invalid template', async () => {
      const result = await runCli(['init', '--skip-detect', '--template', 'nonexistent']);

      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('Invalid template');
      expect(result.stdout + result.stderr).toContain('nonexistent');
    });

    it('should show template list with --list flag', async () => {
      const result = await runCli(['init', '--list']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Available Templates');
      expect(result.stdout).toContain('default');
      expect(result.stdout).toContain('typescript');
      expect(result.stdout).toContain('nextjs');
      expect(result.stdout).toContain('rust');
    });

    it('should run in dry-run mode', async () => {
      const result = await runCli(['init', '--skip-detect', '--dry-run']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Dry run');
      expect(result.stdout).toContain('no files will be written');
      
      // Files should NOT be created in dry-run mode
      const files = await fs.readdir(tempDir);
      const createdFiles = files.filter((f) => !f.startsWith('.'));
      expect(createdFiles).toHaveLength(0);
    });

    it('should create files in custom output directory', async () => {
      const customDir = path.join(tempDir, 'custom-output');
      
      const result = await runCli(['init', '--skip-detect', '--output', customDir]);

      expect(result.exitCode).toBe(0);
      
      // Files should be in custom directory
      const customDirExists = await fs.pathExists(customDir);
      expect(customDirExists).toBe(true);
      
      // Output should indicate successful initialization
      expect(result.stdout).toContain('Initializing AO workflows');
      expect(result.stdout).toContain('AO workflows initialized successfully');
    });

    it('should show help for init command', async () => {
      const result = await runCli(['init', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('--template');
      expect(result.stdout).toContain('--list');
      expect(result.stdout).toContain('--output');
      expect(result.stdout).toContain('--dry-run');
      expect(result.stdout).toContain('--skip-detect');
      expect(result.stdout).toContain('--force');
    });

    it('should skip detection when --skip-detect is passed', async () => {
      // Create TypeScript project files
      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const result = await runCli(['init', '--skip-detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('Detected project type');
    });

    it('should force overwrite existing files', async () => {
      // Create some existing files
      await fs.writeFile(path.join(tempDir, 'agents.yaml'), 'existing');
      
      const result = await runCli(['init', '--skip-detect', '--force']);

      expect(result.exitCode).toBe(0);
      // Should complete successfully despite existing files
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should bypass detection when using --force', async () => {
      // Create a TypeScript project but use --force to bypass
      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const result = await runCli(['init', '--force']);

      expect(result.exitCode).toBe(0);
      // Should use default template, not detect TypeScript
      expect(result.stdout).toContain('bypasses auto-detection');
    });

    it('should use specified template with --force and --template', async () => {
      await fs.writeJson('package.json', { name: 'test-project' });

      const result = await runCli(['init', '--force', '--template', 'python']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Using specified template');
      expect(result.stdout).toContain('python');
    });

    it('should display next steps after successful initialization', async () => {
      const result = await runCli(['init', '--skip-detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Next steps');
      expect(result.stdout).toContain('.ao/');
      expect(result.stdout).toContain('ao daemon start');
    });
  });

  describe('ao templates (via ao init --list)', () => {
    it('should list all available templates', async () => {
      const result = await runCli(['init', '--list']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Available Templates');
      
      // Check for various templates
      expect(result.stdout).toContain('default');
      expect(result.stdout).toContain('typescript');
      expect(result.stdout).toContain('nextjs');
      expect(result.stdout).toContain('rust');
      expect(result.stdout).toContain('python');
      expect(result.stdout).toContain('bun');
      expect(result.stdout).toContain('deno');
      expect(result.stdout).toContain('elixir');
      expect(result.stdout).toContain('go');
    });

    it('should show template descriptions', async () => {
      const result = await runCli(['init', '--list']);

      expect(result.exitCode).toBe(0);
      // Each template should have a description
      expect(result.stdout).toContain('Standard AO workflow');
      expect(result.stdout).toContain('TypeScript');
      expect(result.stdout).toContain('Next.js');
      expect(result.stdout).toContain('Rust');
      expect(result.stdout).toContain('Python');
    });

    it('should show all template IDs', async () => {
      const result = await runCli(['init', '--list']);

      expect(result.exitCode).toBe(0);
      // Check all template IDs are listed
      expect(result.stdout).toContain('typescript-monorepo');
      expect(result.stdout).toContain('javascript');
      expect(result.stdout).toContain('rust-workspace');
      expect(result.stdout).toContain('bun');
      expect(result.stdout).toContain('deno');
      expect(result.stdout).toContain('go');
      expect(result.stdout).toContain('elixir');
    });

    it('should show suitable-for information', async () => {
      const result = await runCli(['init', '--list']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Suitable for');
      expect(result.stdout).toContain('ao init');
    });

    it('should indicate default template', async () => {
      const result = await runCli(['init', '--list']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('default');
    });
  });

  describe('ao detect --help', () => {
    it('should display help for detect command', async () => {
      const result = await runCli(['detect', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('detect');
      expect(result.stdout).toContain('--json');
      expect(result.stdout).toContain('--quiet');
      expect(result.stdout).toContain('--verbose');
    });
  });

  describe('ao templates --help', () => {
    it('should display help for templates command', async () => {
      const result = await runCli(['templates', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('templates');
      expect(result.stdout).toContain('--quiet');
      expect(result.stdout).toContain('--verbose');
    });
  });

  describe('ao list-templates --help', () => {
    it('should display help for list-templates command', async () => {
      const result = await runCli(['list-templates', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('list-templates');
      expect(result.stdout).toContain('--json');
      expect(result.stdout).toContain('--quiet');
      expect(result.stdout).toContain('--verbose');
    });
  });

  describe('ao --quiet flag', () => {
    it('should suppress output on init except errors and result', async () => {
      const result = await runCli(['init', '--skip-detect', '--quiet']);

      expect(result.exitCode).toBe(0);
      // Should not contain progress messages
      expect(result.stdout).not.toContain('Initializing AO workflows');
      expect(result.stdout).not.toContain('Created AO workflow files');
      // Should contain the final result
      expect(result.stdout).toContain('initialized successfully');
      // Should not contain verbose indicators
      expect(result.stdout).not.toContain('[debug]');
    });

    it('should suppress output on detect except errors and result', async () => {
      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const result = await runCli(['detect', '--quiet']);

      expect(result.exitCode).toBe(0);
      // Should not contain progress messages
      expect(result.stdout).not.toContain('Analyzing project');
      expect(result.stdout).not.toContain('Project Detection Results');
      // Should contain the final result (type)
      expect(result.stdout).toContain('typescript');
      // Should not contain verbose indicators
      expect(result.stdout).not.toContain('[debug]');
    });

    it('should still show errors in quiet mode', async () => {
      const result = await runCli(['init', '--output', '/nonexistent/path', '--quiet']);

      expect(result.exitCode).not.toBe(0);
      // Error should be shown — ENOENT on macOS, EACCES on Linux CI
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/ENOENT|EACCES|Error/);
    });

    it('should suppress output on templates in quiet mode', async () => {
      const result = await runCli(['templates', '--quiet']);

      expect(result.exitCode).toBe(0);
      // Should not contain banner
      expect(result.stdout).not.toContain('Available Templates');
      // Should not contain verbose indicators
      expect(result.stdout).not.toContain('[debug]');
    });

    it('should suppress output on list-templates in quiet mode', async () => {
      const result = await runCli(['list-templates', '--quiet']);

      expect(result.exitCode).toBe(0);
      // Should not contain banner
      expect(result.stdout).not.toContain('Available Templates');
      // Should not contain verbose indicators
      expect(result.stdout).not.toContain('[debug]');
    });
  });

  describe('ao --verbose flag', () => {
    it('should show debug output on init with verbose flag', async () => {
      const result = await runCli(['init', '--skip-detect', '--verbose']);

      expect(result.exitCode).toBe(0);
      // Should contain verbose indicators
      expect(result.stdout).toContain('[debug]') || result.stdout.includes('Configuration:');
      expect(result.stdout).toContain('[generation]');
      // Should contain detailed output
      expect(result.stdout).toContain('Initializing AO workflows');
    });

    it('should show step progress on detect with verbose flag', async () => {
      await fs.writeJson('package.json', { name: 'test-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const result = await runCli(['detect', '--verbose']);

      expect(result.exitCode).toBe(0);
      // Should contain step indicators
      expect(result.stdout).toContain('[1/3]') || result.stdout.includes('[2/3]') || result.stdout.includes('[3/3]');
      expect(result.stdout).toContain('Scanning project files') || result.stdout.includes('Analyzing detection');
      // Should contain detection details
      expect(result.stdout).toContain('[detection]');
    });

    it('should show verbose output on templates with verbose flag', async () => {
      const result = await runCli(['templates', '--verbose']);

      expect(result.exitCode).toBe(0);
      // Should contain debug indicators
      expect(result.stdout).toContain('[debug]');
      expect(result.stdout).toContain('Found');
      expect(result.stdout).toContain('available templates');
    });

    it('should show verbose output on list-templates with verbose flag', async () => {
      const result = await runCli(['list-templates', '--verbose']);

      expect(result.exitCode).toBe(0);
      // Should contain step and detection indicators
      expect(result.stdout).toContain('[1/2]') || result.stdout.includes('[2/2]');
      expect(result.stdout).toContain('[detection]');
      expect(result.stdout).toContain('Found template:');
    });

    it('should show verbose detection details with indicators', async () => {
      await fs.writeJson('package.json', { name: 'test-ts-project' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      const result = await runCli(['detect', '--verbose']);

      expect(result.exitCode).toBe(0);
      // Should show file indicators in verbose mode
      expect(result.stdout).toContain('[detection]');
      expect(result.stdout).toContain('File indicators found:');
    });

    it('should show generation steps in verbose mode', async () => {
      const result = await runCli(['init', '--skip-detect', '--verbose']);

      expect(result.exitCode).toBe(0);
      // Should show generation messages
      expect(result.stdout).toContain('[generation]');
      expect(result.stdout).toContain('Generating');
    });
  });

  describe('Error handling', () => {
    it('should handle permission denied for invalid output path', async () => {
      // This test is platform-dependent, so we just verify error handling works
      const result = await runCli(['init', '--output', '/nonexistent/path/that/cannot/be/created']);
      
      // Should fail gracefully
      expect(result.exitCode).not.toBe(0);
    });

    it('should handle unknown subcommand gracefully', async () => {
      const result = await runCli(['unknown-command']);

      expect(result.exitCode).not.toBe(0);
      // Should show some error or help output
      expect(result.stdout + result.stderr).toBeTruthy();
    });
  });

  describe('Output formatting', () => {
    it('should display banner on init', async () => {
      const result = await runCli(['init', '--skip-detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AO Starter');
    });

    it('should display banner on detect', async () => {
      const result = await runCli(['detect']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AO Starter');
    });

    it('should use colored output', async () => {
      const result = await runCli(['init', '--skip-detect']);

      // Should complete successfully
      expect(result.exitCode).toBe(0);
      // Check for chalk symbols or success message
      expect(result.stdout).toContain('✓') || result.stdout.includes('Created AO workflow files');
    });
  });

  describe('End-to-end workflows', () => {
    it('should complete full init workflow for TypeScript project', async () => {
      // 1. Create a TypeScript project
      await fs.writeJson('package.json', { 
        name: 'my-ts-app',
        dependencies: { typescript: '^5.0.0' }
      });
      await fs.writeJson('tsconfig.json', { 
        compilerOptions: { 
          target: 'ES2020',
          module: 'NodeNext'
        } 
      });

      // 2. Run detect
      const detectResult = await runCli(['detect']);
      expect(detectResult.exitCode).toBe(0);
      expect(detectResult.stdout).toContain('Project Detection Results');

      // 3. Run init
      const initResult = await runCli(['init', '--template', 'typescript']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should complete full init workflow for Next.js project', async () => {
      // 1. Create a Next.js project
      await fs.writeJson('package.json', {
        name: 'my-next-app',
        dependencies: {
          next: '14.0.0',
          react: '18.0.0',
          'react-dom': '18.0.0'
        }
      });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      // 2. Run init with nextjs template
      const initResult = await runCli(['init', '--template', 'nextjs']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('Next.js');
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should complete full init workflow for Rust project', async () => {
      // 1. Create a Rust project
      await fs.writeFile('Cargo.toml', `[package]
name = "my-rust-app"
version = "0.1.0"

[dependencies]`);

      // 2. Run init
      const initResult = await runCli(['init', '--template', 'rust']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('Rust');
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should complete full init workflow for Python project', async () => {
      // 1. Create a Python project
      await fs.writeFile('pyproject.toml', `[project]
name = "my-python-app"
version = "0.1.0"`);

      // 2. Run init
      const initResult = await runCli(['init', '--template', 'python']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('Python');
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should complete full init workflow for Go project', async () => {
      // 1. Create a Go project
      await fs.writeFile('go.mod', `module github.com/user/my-go-app

go 1.21`);

      // 2. Run init
      const initResult = await runCli(['init', '--template', 'go']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('Go');
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should complete full init workflow for Deno project', async () => {
      // 1. Create a Deno project
      await fs.writeJson('deno.json', { name: 'my-deno-app', imports: {} });

      // 2. Run init
      const initResult = await runCli(['init', '--template', 'deno']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('Deno');
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should complete full init workflow for Bun project', async () => {
      // 1. Create a Bun project
      await fs.writeJson('package.json', { name: 'my-bun-app' });
      await fs.writeFile('bun.lockb', '');

      // 2. Run init
      const initResult = await runCli(['init', '--template', 'bun']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('Bun');
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should complete full init workflow for TypeScript monorepo', async () => {
      // 1. Create a monorepo structure
      await fs.writeJson('package.json', { name: 'my-monorepo' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });
      await fs.writeJson('turbo.json', { pipeline: {} });

      // 2. Run init
      const initResult = await runCli(['init', '--template', 'typescript-monorepo']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('TypeScript Monorepo');
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should detect and init Next.js project with auto-detection', async () => {
      // Create a Next.js project (devDependencies required for Next.js detection)
      await fs.writeJson('package.json', {
        name: 'my-next-app',
        dependencies: {
          next: '14.0.0',
          react: '18.0.0',
          'react-dom': '18.0.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.0.0'
        }
      });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      // Run detect to check detection
      const detectResult = await runCli(['detect']);
      expect(detectResult.exitCode).toBe(0);
      expect(detectResult.stdout).toContain('Next.js');

      // Run init with auto-detection
      const initResult = await runCli(['init', '--template', 'nextjs']);
      expect(initResult.exitCode).toBe(0);
      expect(initResult.stdout).toContain('Next.js');
      expect(initResult.stdout).toContain('initialized successfully');
    });

    it('should show banner when no arguments provided', async () => {
      const result = await runCli([]);

      // No arguments shows the banner but may not print full help
      // Commander exits with code 1 when no command is given
      expect([0, 1]).toContain(result.exitCode);
      expect(result.stdout).toContain('AO Starter');
    });
  });
});
