import path from 'path';
import fs from 'fs-extra';
import { ProjectDetector } from './project-detector.js';

describe('ProjectDetector', () => {
  let detector: ProjectDetector;
  let tempDir: string;

  beforeEach(async () => {
    detector = new ProjectDetector();
    tempDir = await fs.mkdtemp(path.join(process.cwd(), 'ao-test-detector-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('detectRust', () => {
    it('should detect a Rust project with Cargo.toml', async () => {
      const cargoToml = `
[package]
name = "my-project"
version = "0.1.0"
edition = "2021"
`;
      await fs.writeFile(path.join(tempDir, 'Cargo.toml'), cargoToml);

      // Change to temp directory for detection
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectRust();
        expect(result).not.toBeNull();
        expect(result!.type).toBe('rust');
        expect(result!.confidence).toBe(95);
        expect(result!.framework).toBe('Rust');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect a Rust workspace with [workspace] in Cargo.toml', async () => {
      const cargoToml = `
[workspace]
members = [
    "crate1",
    "crate2",
]
`;
      await fs.writeFile(path.join(tempDir, 'Cargo.toml'), cargoToml);

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectRust();
        expect(result).not.toBeNull();
        expect(result!.type).toBe('rust-workspace');
        expect(result!.confidence).toBe(95);
        expect(result!.framework).toBe('Rust Workspace');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should return null when no Cargo.toml exists', async () => {
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectRust();
        expect(result).toBeNull();
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect rust project even if Cargo.toml does not contain [workspace]', async () => {
      // Empty Cargo.toml (minimal case)
      await fs.writeFile(path.join(tempDir, 'Cargo.toml'), '');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectRust();
        expect(result).not.toBeNull();
        expect(result!.type).toBe('rust');
        expect(result!.confidence).toBe(95);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('detectPython', () => {
    it('should detect a Python project with pyproject.toml', async () => {
      const pyprojectToml = `
[project]
name = "my-python-project"
version = "0.1.0"
requires-python = ">=3.9"
`;
      await fs.writeFile(path.join(tempDir, 'pyproject.toml'), pyprojectToml);

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectPython();
        expect(result).not.toBeNull();
        expect(result!.type).toBe('python');
        expect(result!.confidence).toBe(85);
        expect(result!.framework).toBe('Python');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect a Python project with setup.py', async () => {
      const setupPy = `
from setuptools import setup
setup(name='my-project', version='0.1.0')
`;
      await fs.writeFile(path.join(tempDir, 'setup.py'), setupPy);

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectPython();
        expect(result).not.toBeNull();
        expect(result!.type).toBe('python');
        expect(result!.confidence).toBe(85);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect a Python project with requirements.txt', async () => {
      const requirementsTxt = `
requests>=2.28.0
numpy>=1.24.0
`;
      await fs.writeFile(path.join(tempDir, 'requirements.txt'), requirementsTxt);

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectPython();
        expect(result).not.toBeNull();
        expect(result!.type).toBe('python');
        expect(result!.confidence).toBe(85);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect Poetry as framework when poetry.lock exists', async () => {
      const pyprojectToml = `
[tool.poetry]
name = "my-poetry-project"
version = "0.1.0"
`;
      await fs.writeFile(path.join(tempDir, 'pyproject.toml'), pyprojectToml);
      await fs.writeFile(path.join(tempDir, 'poetry.lock'), '# poetry lock file');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectPython();
        expect(result).not.toBeNull();
        expect(result!.framework).toBe('Poetry');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect Pipenv as framework when Pipfile exists', async () => {
      const pyprojectToml = `
[project]
name = "my-pipenv-project"
`;
      await fs.writeFile(path.join(tempDir, 'pyproject.toml'), pyprojectToml);
      await fs.writeFile(path.join(tempDir, 'Pipfile'), '# Pipfile content');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectPython();
        expect(result).not.toBeNull();
        expect(result!.framework).toBe('Pipenv');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should return null when no Python indicators exist', async () => {
      // Create unrelated files
      await fs.writeFile(path.join(tempDir, 'README.md'), '# My Project');
      await fs.writeFile(path.join(tempDir, 'index.html'), '<html></html>');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectPython();
        expect(result).toBeNull();
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should prefer Poetry over Pipenv when both lock files exist', async () => {
      await fs.writeFile(path.join(tempDir, 'pyproject.toml'), '');
      await fs.writeFile(path.join(tempDir, 'poetry.lock'), '');
      await fs.writeFile(path.join(tempDir, 'Pipfile'), '');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detectPython();
        expect(result).not.toBeNull();
        // Poetry is checked first in the code
        expect(result!.framework).toBe('Poetry');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('detect', () => {
    it('should detect Rust project as primary type', async () => {
      const cargoToml = `
[package]
name = "my-project"
version = "0.1.0"
`;
      await fs.writeFile(path.join(tempDir, 'Cargo.toml'), cargoToml);
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test',
        dependencies: {}
      }));

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detect();
        expect(result.type).toBe('rust');
        expect(result.language).toBe('Rust');
        expect(result.framework).toBe('Rust');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect Python project with pyproject.toml', async () => {
      await fs.writeFile(path.join(tempDir, 'pyproject.toml'), '');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detect();
        expect(result.type).toBe('python');
        expect(result.language).toBe('Python');
        expect(result.framework).toBe('Python');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should return unknown type when no project indicators exist', async () => {
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detect();
        expect(result.type).toBe('unknown');
        expect(result.language).toBe('Unknown');
        expect(result.recommendations).toContain('Consider manually specifying a template with --template');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should include recommendations for Rust projects', async () => {
      await fs.writeFile(path.join(tempDir, 'Cargo.toml'), '');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detect();
        expect(result.recommendations).toContain('Run: ao init to generate Rust optimized workflows');
        expect(result.recommendations).toContain('Consider adding cargo clippy and fmt checks');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should include recommendations for Python projects', async () => {
      await fs.writeFile(path.join(tempDir, 'pyproject.toml'), '');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await detector.detect();
        expect(result.recommendations).toContain('Run: ao init to generate Python optimized workflows');
        expect(result.recommendations).toContain('Consider adding pytest and mypy phases');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
