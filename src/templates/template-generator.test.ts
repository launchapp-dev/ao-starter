import path from 'path';
import fs from 'fs-extra';
import { TemplateGenerator } from './template-generator.js';
import type { TemplateContext, GeneratorOptions } from './types.js';

describe('TemplateGenerator', () => {
  let generator: TemplateGenerator;
  let tempDir: string;

  beforeEach(async () => {
    generator = new TemplateGenerator();
    tempDir = await fs.mkdtemp(path.join(process.cwd(), 'ao-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('constructor', () => {
    it('should create a TemplateGenerator instance', () => {
      expect(generator).toBeInstanceOf(TemplateGenerator);
    });
  });

  describe('getFilesForProjectType', () => {
    it('should return base files for default project type', () => {
      const files = generator.getFilesForProjectType('default');
      
      expect(files).toHaveLength(4);
      expect(files.map((f) => f.outputPath)).toEqual([
        'custom.yaml',
        'agents.yaml',
        'phases.yaml',
        'workflows.yaml',
      ]);
    });

    it('should return monorepo files for typescript-monorepo project type', () => {
      const files = generator.getFilesForProjectType('typescript-monorepo');
      
      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-monorepo.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-monorepo.yaml');
    });

    it('should return Next.js files for nextjs project type', () => {
      const files = generator.getFilesForProjectType('nextjs');
      
      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-nextjs.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-nextjs.yaml');
    });

    it('should return Rust files for rust project type', () => {
      const files = generator.getFilesForProjectType('rust');
      
      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-rust.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-rust.yaml');
    });

    it('should return Rust files for rust-workspace project type', () => {
      const files = generator.getFilesForProjectType('rust-workspace');
      
      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-rust.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-rust.yaml');
    });

    it('should return Python files for python project type', () => {
      const files = generator.getFilesForProjectType('python');
      
      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-python.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-python.yaml');
    });

    it('should return Bun files for bun project type', () => {
      const files = generator.getFilesForProjectType('bun');
      
      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-bun.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-bun.yaml');
    });

    it('should return Deno files for deno project type', () => {
      const files = generator.getFilesForProjectType('deno');
      
      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-deno.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-deno.yaml');
    });

    it('should return Elixir files for elixir project type', () => {
      const files = generator.getFilesForProjectType('elixir');
      
      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-elixir.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-elixir.yaml');
    });

    it('should return Go files for go project type', () => {
      const files = generator.getFilesForProjectType('go');

      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-go.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-go.yaml');
    });

    it('should return TypeScript files for typescript project type', () => {
      const files = generator.getFilesForProjectType('typescript');

      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-typescript.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-typescript.yaml');
    });

    it('should return JavaScript files for javascript project type', () => {
      const files = generator.getFilesForProjectType('javascript');

      expect(files).toHaveLength(6);
      expect(files.map((f) => f.outputPath)).toContain('agents-javascript.yaml');
      expect(files.map((f) => f.outputPath)).toContain('phases-javascript.yaml');
    });
  });

  describe('generate', () => {
    it('should generate files in dry-run mode without creating them', async () => {
      const options: GeneratorOptions = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: true,
      };

      const files = await generator.generate(options);

      expect(files.length).toBeGreaterThan(0);
      // In dry-run mode, files should not actually exist
      for (const file of files) {
        const exists = await fs.pathExists(file);
        expect(exists).toBe(false);
      }
    });

    it('should generate files when not in dry-run mode', async () => {
      const options: GeneratorOptions = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: false,
      };

      const files = await generator.generate(options);

      expect(files.length).toBeGreaterThan(0);
      // Files should exist
      for (const file of files) {
        const exists = await fs.pathExists(file);
        expect(exists).toBe(true);
      }
    });

    it('should include projectType in generated files', async () => {
      const options: GeneratorOptions = {
        projectType: 'nextjs',
        outputDir: tempDir,
        dryRun: false,
      };

      await generator.generate(options);

      const customYamlPath = path.join(tempDir, 'custom.yaml');
      const content = await fs.readFile(customYamlPath, 'utf-8');
      
      expect(content).toContain('nextjs');
      expect(content).toContain('Generated by ao-starter');
    });

    it('should include projectName when provided', async () => {
      const options: GeneratorOptions = {
        projectType: 'typescript',
        projectName: 'my-awesome-project',
        outputDir: tempDir,
        dryRun: false,
      };

      await generator.generate(options);

      const customYamlPath = path.join(tempDir, 'custom.yaml');
      const content = await fs.readFile(customYamlPath, 'utf-8');
      
      expect(content).toContain('my-awesome-project');
    });

    it('should use custom agents when provided', async () => {
      const options: GeneratorOptions = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: false,
        agents: {
          custom_agent: {
            role: 'Custom Role',
            model: 'custom-model',
            capabilities: ['custom-capability'],
            max_concurrent: 2,
          },
        },
      };

      await generator.generate(options);

      const agentsYamlPath = path.join(tempDir, 'agents.yaml');
      const content = await fs.readFile(agentsYamlPath, 'utf-8');
      
      expect(content).toContain('custom_agent');
      expect(content).toContain('Custom Role');
      expect(content).toContain('custom-model');
    });

    it('should use custom phases when provided', async () => {
      const options: GeneratorOptions = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: false,
        phases: {
          custom_phase: {
            agent: 'developer',
            description: 'Custom phase',
            timeout_secs: 600,
            outputs: ['output1'],
          },
        },
      };

      await generator.generate(options);

      const phasesYamlPath = path.join(tempDir, 'phases.yaml');
      const content = await fs.readFile(phasesYamlPath, 'utf-8');
      
      expect(content).toContain('custom_phase');
      expect(content).toContain('Custom phase');
    });

    it('should use custom workflows when provided', async () => {
      const options: GeneratorOptions = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: false,
        workflows: {
          custom_workflow: {
            description: 'Custom workflow',
            phases: ['planning', 'implementation'],
            default: true,
          },
        },
      };

      await generator.generate(options);

      const workflowsYamlPath = path.join(tempDir, 'workflows.yaml');
      const content = await fs.readFile(workflowsYamlPath, 'utf-8');
      
      expect(content).toContain('custom_workflow');
      expect(content).toContain('Custom workflow');
    });

    it('should use custom schedules when provided', async () => {
      const options: GeneratorOptions = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: false,
        schedules: [
          {
            name: 'custom-schedule',
            interval_secs: 60,
            auto_run_ready: true,
            auto_merge: true,
          },
        ],
      };

      await generator.generate(options);

      const customYamlPath = path.join(tempDir, 'custom.yaml');
      const content = await fs.readFile(customYamlPath, 'utf-8');
      
      expect(content).toContain('custom-schedule');
      expect(content).toContain('interval_secs: 60');
      expect(content).toContain('auto_run_ready: true');
      expect(content).toContain('auto_merge: true');
    });
  });

  describe('previewTemplate', () => {
    it('should preview custom.yaml template', () => {
      const context: TemplateContext = {
        projectType: 'typescript',
        projectName: 'test-project',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const preview = generator.previewTemplate('custom.yaml.hbs', context);

      expect(preview).toContain('typescript');
      expect(preview).toContain('test-project');
      expect(preview).toContain('Generated by ao-starter');
    });

    it('should preview agents.yaml template with custom agents', () => {
      const context: TemplateContext = {
        projectType: 'typescript',
        timestamp: '2024-01-01T00:00:00.000Z',
        agents: {
          developer: {
            role: 'Developer',
            model: 'claude-3-opus',
            capabilities: ['coding'],
            max_concurrent: 1,
          },
        },
      };

      const preview = generator.previewTemplate('agents.yaml.hbs', context);

      expect(preview).toContain('developer');
      expect(preview).toContain('Developer');
      expect(preview).toContain('coding');
    });

    it('should throw error for non-existent template', () => {
      const context: TemplateContext = {
        projectType: 'typescript',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      expect(() => {
        generator.previewTemplate('non-existent.hbs', context);
      }).toThrow('Template not found');
    });
  });

  describe('generateComplete', () => {
    it('should return files and context', async () => {
      const options: GeneratorOptions = {
        projectType: 'typescript',
        projectName: 'complete-test',
        outputDir: tempDir,
        dryRun: false,
      };

      const result = await generator.generateComplete(options);

      expect(result.files.length).toBeGreaterThan(0);
      expect(result.context.projectType).toBe('typescript');
      expect(result.context.projectName).toBe('complete-test');
      expect(result.context.timestamp).toBeDefined();
    });
  });

  describe('generateWithContext', () => {
    it('should generate a single template with provided context', async () => {
      const context: TemplateContext = {
        projectType: 'rust',
        projectName: 'my-rust-project',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const outputPath = path.join(tempDir, 'custom.yaml');
      const files = await generator.generateWithContext(
        'custom.yaml.hbs',
        outputPath,
        context,
        false
      );

      expect(files).toHaveLength(1);
      expect(files[0]).toBe(outputPath);
      
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('rust');
      expect(content).toContain('my-rust-project');
    });

    it('should work in dry-run mode', async () => {
      const context: TemplateContext = {
        projectType: 'python',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const outputPath = path.join(tempDir, 'custom.yaml');
      const files = await generator.generateWithContext(
        'custom.yaml.hbs',
        outputPath,
        context,
        true
      );

      expect(files).toHaveLength(1);
      expect(files[0]).toBe(outputPath);
      
      // File should not exist in dry-run mode
      const exists = await fs.pathExists(outputPath);
      expect(exists).toBe(false);
    });
  });

  describe('conditional blocks', () => {
    it('should conditionally render projectName in custom.yaml', async () => {
      // Without projectName
      let options: GeneratorOptions = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: false,
      };

      await generator.generate(options);
      let content = await fs.readFile(path.join(tempDir, 'custom.yaml'), 'utf-8');
      expect(content).not.toContain('project_name:');

      // With projectName
      await fs.remove(tempDir);
      tempDir = await fs.mkdtemp(path.join(process.cwd(), 'ao-test-'));
      
      options = {
        projectType: 'typescript',
        projectName: 'my-project',
        outputDir: tempDir,
        dryRun: false,
      };

      await generator.generate(options);
      content = await fs.readFile(path.join(tempDir, 'custom.yaml'), 'utf-8');
      expect(content).toContain('project_name:');
      expect(content).toContain('my-project');
    });

    it('should conditionally render schedules in custom.yaml', async () => {
      // Without schedules - should show defaults
      let options: GeneratorOptions = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: false,
      };

      await generator.generate(options);
      let content = await fs.readFile(path.join(tempDir, 'custom.yaml'), 'utf-8');
      expect(content).toContain('Run daemon every 30 seconds');
      expect(content).toContain('interval_secs: 30');

      // With custom schedules
      await fs.remove(tempDir);
      tempDir = await fs.mkdtemp(path.join(process.cwd(), 'ao-test-'));

      options = {
        projectType: 'typescript',
        outputDir: tempDir,
        dryRun: false,
        schedules: [
          {
            name: 'fast',
            interval_secs: 10,
            auto_run_ready: true,
          },
        ],
      };

      await generator.generate(options);
      content = await fs.readFile(path.join(tempDir, 'custom.yaml'), 'utf-8');
      expect(content).toContain('fast:');
      expect(content).toContain('interval_secs: 10');
      // Default comments should not appear
      expect(content).not.toContain('Run daemon every 30 seconds');
    });
  });
});
