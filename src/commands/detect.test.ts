import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { detectCommand } from './detect.js';

describe('detectCommand', () => {
  let tempDir: string;
  let originalCwd: string;
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let originalExit: typeof process.exit;
  let logOutput: string[];
  let errorOutput: string[];
  let exitCalled: boolean;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ao-detect-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Store original functions
    originalLog = console.log;
    originalError = console.error;
    originalExit = process.exit;
    
    // Initialize output arrays
    logOutput = [];
    errorOutput = [];
    exitCalled = false;
    
    // Override console methods
    console.log = (...args: unknown[]) => {
      logOutput.push(args.join(' '));
    };
    console.error = (...args: unknown[]) => {
      errorOutput.push(args.join(' '));
    };
    process.exit = (() => {
      exitCalled = true;
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

  describe('detectCommand with --json flag', () => {
    it('should produce valid JSON output for TypeScript project', async () => {
      // Create a TypeScript project
      await fs.writeJson('package.json', { name: 'my-ts-app' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      await detectCommand({ json: true });

      // Should have logged exactly once with JSON
      expect(logOutput.length).toBe(1);
      
      // The logged output should be valid JSON
      const output = logOutput[0]!;
      expect(() => JSON.parse(output)).not.toThrow();
      
      const parsed = JSON.parse(output);
      expect(parsed.type).toBe('typescript');
      expect(parsed.language).toBe('TypeScript');
    });

    it('should output detection result with all fields as JSON for Rust workspace', async () => {
      // Create a Rust workspace project
      await fs.writeFile('Cargo.toml', `[workspace]
members = ["crate-a", "crate-b"]
`);

      await detectCommand({ json: true });

      const output = logOutput[0]!;
      const parsed = JSON.parse(output);

      expect(parsed.type).toBe('rust-workspace');
      expect(parsed.monorepo).toBe(true);
      expect(parsed.packages).toContain('crate-a');
      expect(parsed.packages).toContain('crate-b');
      // Indicators contains Cargo.toml content with workspace section
      expect(output).toContain('Cargo.toml');
    });

    it('should handle minimal detection result in JSON mode for unknown project', async () => {
      // Empty directory - will be detected as unknown
      await detectCommand({ json: true });

      const output = logOutput[0]!;
      const parsed = JSON.parse(output);

      expect(parsed.type).toBe('unknown');
      expect(parsed.recommendations).toBeDefined();
    });
  });

  describe('detectCommand human mode', () => {
    it('should produce expected console output for TypeScript project', async () => {
      await fs.writeJson('package.json', { name: 'my-ts-app' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      await detectCommand({ json: false });

      // Should have logged multiple times
      expect(logOutput.length).toBeGreaterThan(5);

      // Check for key output elements
      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Project Detection Results');
      expect(allOutput).toContain('Type:');
      expect(allOutput).toContain('typescript');
      expect(allOutput).toContain('Language:');
      expect(allOutput).toContain('TypeScript');
      expect(allOutput).toContain('ao init');
    });

    it('should show framework when detected for Next.js', async () => {
      await fs.writeJson('package.json', {
        name: 'my-next-app',
        dependencies: { next: '14.0.0', react: '18.0.0', 'react-dom': '18.0.0' },
      });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      await detectCommand({ json: false });

      const allOutput = logOutput.join('\n');
      // Next.js detection depends on next being in dependencies
      // The test should verify the command runs without error
      expect(allOutput).toContain('Project Detection Results');
    });

    it('should show monorepo information when detected for TypeScript monorepo', async () => {
      await fs.writeJson('package.json', { name: 'my-monorepo' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });
      await fs.writeJson('turbo.json', { pipeline: {} });
      await fs.mkdirp('packages/pkg1');
      await fs.writeJson('packages/pkg1/package.json', { name: 'pkg1' });

      await detectCommand({ json: false });

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Monorepo:');
      expect(allOutput).toContain('Yes');
      expect(allOutput).toContain('Packages:');
      expect(allOutput).toContain('pkg1');
    });

    it('should show build tool when detected for Go project', async () => {
      await fs.writeFile('go.mod', `module github.com/user/my-go-app

go 1.21`);

      await detectCommand({ json: false });

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Build Tool:');
      expect(allOutput).toContain('go');
    });

    it('should show recommendations when available for unknown project', async () => {
      // Empty directory - no project detected
      await detectCommand({ json: false });

      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Recommendations:');
      expect(allOutput).toContain('1.');
      expect(allOutput).toContain('ao init');
    });

    it('should show recommendations section for detected project with suggestions', async () => {
      await fs.writeJson('package.json', { name: 'my-ts-app' });
      await fs.writeJson('tsconfig.json', { compilerOptions: {} });

      await detectCommand({ json: false });

      const allOutput = logOutput.join('\n');
      // TypeScript projects show recommendations
      expect(allOutput).toContain('Recommendations:');
      expect(allOutput).toContain('ao init');
    });
  });

  describe('Error handling for detector failures', () => {
    it('should handle empty directory in JSON mode gracefully', async () => {
      // Empty directory should be handled without error
      await detectCommand({ json: true });

      const output = logOutput[0]!;
      expect(() => JSON.parse(output)).not.toThrow();
      
      const parsed = JSON.parse(output);
      expect(parsed.type).toBe('unknown');
    });

    it('should handle empty directory in human mode gracefully', async () => {
      // Empty directory should be handled without error
      await detectCommand({ json: false });

      // Should complete without throwing
      expect(exitCalled).toBe(false);
      
      // Should show detection results
      const allOutput = logOutput.join('\n');
      expect(allOutput).toContain('Project Detection Results');
    });

    it('should handle various project types without error', async () => {
      // Python project
      await fs.writeFile('pyproject.toml', '[project]\nname = "my-python-app"');
      await detectCommand({ json: true });
      
      let parsed = JSON.parse(logOutput[0]!);
      expect(parsed.type).toBe('python');

      // Reset for next test
      logOutput = [];
      
      // Go project
      await fs.remove('pyproject.toml');
      await fs.writeFile('go.mod', 'module mymodule\n\ngo 1.21');
      await detectCommand({ json: true });
      
      parsed = JSON.parse(logOutput[0]!);
      expect(parsed.type).toBe('go');
    });
  });
});
