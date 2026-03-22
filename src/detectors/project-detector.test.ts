import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ProjectDetector } from './project-detector';

describe('ProjectDetector', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ao-detector-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  describe('detectTypeScriptMonorepo', () => {
    it('should detect TypeScript monorepo with turbo.json', async () => {
      await fs.writeFile('package.json', JSON.stringify({ name: 'test-monorepo' }));
      await fs.writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));
      await fs.writeFile('turbo.json', JSON.stringify({ pipeline: {} }));
      await fs.mkdirp('packages/pkg1');
      await fs.writeFile('packages/pkg1/package.json', JSON.stringify({ name: 'pkg1' }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('typescript-monorepo');
      expect(result.framework).toBe('Turborepo');
      expect(result.monorepo).toBe(true);
      expect(result.packages).toContain('pkg1');
      expect(result.indicators).toContain('turbo.json');
    });

    it('should detect TypeScript monorepo with pnpm-workspace.yaml', async () => {
      await fs.writeFile('package.json', JSON.stringify({ name: 'test-monorepo' }));
      await fs.writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));
      await fs.writeFile('pnpm-workspace.yaml', 'packages:\n  - "packages/*"');
      await fs.mkdirp('apps/web');
      await fs.writeFile('apps/web/package.json', JSON.stringify({ name: 'web' }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('typescript-monorepo');
      expect(result.framework).toBe('Monorepo');
      expect(result.buildTool).toBe('pnpm');
    });

    it('should detect TypeScript monorepo with nx.json', async () => {
      await fs.writeFile('package.json', JSON.stringify({ name: 'test-monorepo' }));
      await fs.writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));
      await fs.writeFile('nx.json', JSON.stringify({ projects: {} }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('typescript-monorepo');
      expect(result.framework).toBe('Nx');
      expect(result.buildTool).toBe('nx');
    });
  });

  describe('detectNextJs', () => {
    it('should detect Next.js project', async () => {
      await fs.writeFile('package.json', JSON.stringify({
        name: 'my-next-app',
        dependencies: { next: '14.0.0' },
        devDependencies: { react: '18.0.0' }
      }));
      await fs.writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('nextjs');
      expect(result.framework).toBe('Next.js');
      expect(result.rootPackage).toBe('my-next-app');
    });
  });

  describe('detectRust', () => {
    it('should detect Rust workspace', async () => {
      await fs.writeFile('Cargo.toml', `[workspace]
members = ["crate-a", "crate-b"]
`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('rust-workspace');
      expect(result.framework).toBe('Rust Workspace');
      expect(result.packages).toContain('crate-a');
      expect(result.packages).toContain('crate-b');
    });

    it('should detect Rust single project', async () => {
      await fs.writeFile('Cargo.toml', `[package]
name = "my-rust-app"
version = "0.1.0"
`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('rust');
      expect(result.framework).toBe('Rust');
      expect(result.rootPackage).toBe('my-rust-app');
    });
  });

  describe('detectPython', () => {
    it('should detect Python with pyproject.toml', async () => {
      await fs.writeFile('pyproject.toml', `[project]
name = "my-python-app"
`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('python');
      expect(result.framework).toBe('Python');
    });

    it('should detect Python with setup.py', async () => {
      await fs.writeFile('setup.py', 'from setuptools import setup\nsetup(name="my-python-app")');

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('python');
      expect(result.framework).toBe('Python');
    });

    it('should detect Python with requirements.txt', async () => {
      await fs.writeFile('requirements.txt', 'requests>=2.0.0');

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('python');
      expect(result.framework).toBe('Python');
    });

    it('should detect Poetry project', async () => {
      await fs.writeFile('pyproject.toml', '[tool.poetry]\nname = "my-poetry-app"');
      await fs.writeFile('poetry.lock', '');

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('python');
      expect(result.framework).toBe('Poetry');
      expect(result.buildTool).toBe('poetry');
    });
  });

  describe('detectTypeScript', () => {
    it('should detect standard TypeScript project', async () => {
      await fs.writeFile('package.json', JSON.stringify({ name: 'my-ts-app' }));
      await fs.writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('typescript');
      expect(result.language).toBe('TypeScript');
      expect(result.rootPackage).toBe('my-ts-app');
      expect(result.buildTool).toBe('tsc');
    });

    it('should not detect as TypeScript if only tsconfig.json exists', async () => {
      await fs.writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).not.toBe('typescript');
    });
  });

  describe('detectJavaScript', () => {
    it('should detect JavaScript project', async () => {
      await fs.writeFile('package.json', JSON.stringify({ name: 'my-js-app' }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('javascript');
      expect(result.language).toBe('JavaScript');
    });
  });

  describe('unknown project', () => {
    it('should return unknown for empty directory', async () => {
      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('unknown');
      expect(result.language).toBe('Unknown');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('custom cwd', () => {
    it('should use custom cwd when provided', async () => {
      await fs.writeFile('package.json', JSON.stringify({ name: 'custom-cwd-test' }));
      await fs.writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));

      // Create detector with tempDir as cwd, but we're in originalCwd
      process.chdir(originalCwd);
      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('typescript');
      expect(result.rootPackage).toBe('custom-cwd-test');
    });
  });
});
