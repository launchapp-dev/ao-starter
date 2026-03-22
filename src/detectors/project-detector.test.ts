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

  describe('detectBun', () => {
    it('should detect Bun project with bun.lockb', async () => {
      await fs.writeFile('bun.lockb', '');
      await fs.writeFile('package.json', JSON.stringify({ name: 'my-bun-app' }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('bun');
      expect(result.framework).toBe('Bun');
      expect(result.buildTool).toBe('bun');
      expect(result.indicators).toContain('bun.lockb');
    });

    it('should detect Bun project with bunfig.toml', async () => {
      await fs.writeFile('bunfig.toml', '');
      await fs.writeFile('package.json', JSON.stringify({ name: 'my-bun-app' }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('bun');
      expect(result.framework).toBe('Bun');
      expect(result.buildTool).toBe('bun');
      expect(result.indicators).toContain('bunfig.toml');
    });

    it('should detect Bun project with both bun.lockb and bunfig.toml', async () => {
      await fs.writeFile('bun.lockb', '');
      await fs.writeFile('bunfig.toml', '');

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('bun');
      expect(result.indicators).toContain('bun.lockb');
      expect(result.indicators).toContain('bunfig.toml');
    });

    it('should detect Bun project without package.json', async () => {
      await fs.writeFile('bun.lockb', '');

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('bun');
      expect(result.confidence).toBe(70);
    });
  });

  describe('detectDeno', () => {
    it('should detect Deno project with deno.json', async () => {
      await fs.writeFile('deno.json', JSON.stringify({
        name: 'my-deno-app',
        tasks: { dev: 'deno run --watch server.ts' }
      }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('deno');
      expect(result.framework).toBe('Deno');
      expect(result.rootPackage).toBe('my-deno-app');
      expect(result.buildTool).toBe('deno');
      expect(result.indicators).toContain('deno.json');
    });

    it('should detect Deno project with deno.jsonc', async () => {
      await fs.writeFile('deno.jsonc', JSON.stringify({
        name: 'my-deno-app',
        tasks: { start: 'deno run server.ts' }
      }));

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('deno');
      expect(result.framework).toBe('Deno');
      expect(result.indicators).toContain('deno.jsonc');
    });

    it('should handle deno.jsonc with comments', async () => {
      await fs.writeFile('deno.jsonc', `{
        // This is a comment
        "name": "my-deno-app"
      }`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('deno');
      expect(result.rootPackage).toBe('my-deno-app');
    });
  });

  describe('detectGo', () => {
    it('should detect Go project', async () => {
      await fs.writeFile('go.mod', `module github.com/user/my-go-app

go 1.21`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('go');
      expect(result.framework).toBe('Go');
      expect(result.rootPackage).toBe('github.com/user/my-go-app');
      expect(result.buildTool).toBe('go');
      expect(result.indicators).toContain('go.mod');
    });

    it('should detect Go project with different module paths', async () => {
      await fs.writeFile('go.mod', `module example.com/myproject

go 1.20`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('go');
      expect(result.rootPackage).toBe('example.com/myproject');
    });

    it('should detect Go project without module declaration', async () => {
      await fs.writeFile('go.mod', `go 1.21`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('go');
      expect(result.rootPackage).toBeUndefined();
    });
  });

  describe('detectElixir', () => {
    it('should detect Elixir project', async () => {
      await fs.writeFile('mix.exs', `defmodule MyApp.MixProject do
  use Mix.Project

  def project do
    [
      app: :my_app,
      version: "0.1.0",
      elixir: "~> 1.14"
    ]
  end
end`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('elixir');
      expect(result.framework).toBe('Elixir');
      expect(result.rootPackage).toBe('my_app');
      expect(result.buildTool).toBe('mix');
      expect(result.indicators).toContain('mix.exs');
    });

    it('should detect Elixir project with underscore name', async () => {
      await fs.writeFile('mix.exs', `defmodule MyProject.MixProject do
  use Mix.Project

  def project do
    [
      app: :my_project,
      version: "1.0.0"
    ]
  end
end`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('elixir');
      expect(result.rootPackage).toBe('my_project');
    });

    it('should detect Elixir project without app name', async () => {
      await fs.writeFile('mix.exs', `defmodule MyApp.MixProject do
  use Mix.Project
end`);

      const detector = new ProjectDetector(tempDir);
      const result = await detector.detect();

      expect(result.type).toBe('elixir');
      expect(result.rootPackage).toBeUndefined();
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
