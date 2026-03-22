import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export interface ProjectDetection {
  type: string;
  framework?: string;
  language?: string;
  monorepo?: boolean;
  packages?: string[];
  recommendations?: string[];
}

export interface DetectorResult {
  type: string;
  confidence: number;
  framework?: string;
  packages?: string[];
}

export class ProjectDetector {
  async detect(): Promise<ProjectDetection> {
    const detectors = [
      this.detectTypeScriptMonorepo,
      this.detectNextJs,
      this.detectRust,
      this.detectPython,
      this.detectTypeScript,
      this.detectJavaScript,
    ];

    const results: DetectorResult[] = [];

    for (const detector of detectors) {
      const result = await detector.call(this);
      if (result && result.confidence > 0) {
        results.push(result);
      }
    }

    // Sort by confidence and pick the best match
    results.sort((a, b) => b.confidence - a.confidence);
    const best = results[0];

    if (!best) {
      return {
        type: 'unknown',
        language: 'Unknown',
        recommendations: [
          'Consider manually specifying a template with --template',
          'Run create-ao init --template default to generate basic workflows',
        ],
      };
    }

    return {
      type: best.type,
      framework: best.framework,
      language: this.getLanguageForType(best.type),
      monorepo: best.type === 'typescript-monorepo',
      packages: best.packages,
      recommendations: this.getRecommendations(best.type),
    };
  }

  private async detectTypeScriptMonorepo(): Promise<DetectorResult | null> {
    // Check for pnpm workspace
    const pnpmWorkspace = await this.fileExists('pnpm-workspace.yaml');
    
    // Check for lerna.json
    const lerna = await this.fileExists('lerna.json');
    
    // Check for Nx
    const nx = await this.fileExists('nx.json');
    
    // Check for Turborepo
    const turbo = await this.fileExists('turbo.json');

    if (pnpmWorkspace || lerna || nx || turbo) {
      const packages = await this.findMonorepoPackages();
      return {
        type: 'typescript-monorepo',
        confidence: 90,
        framework: nx ? 'Nx' : turbo ? 'Turborepo' : 'Monorepo',
        packages,
      };
    }

    // Check for packages/ directory with multiple package.json files
    const packagesDir = await this.fileExists('packages');
    if (packagesDir) {
      const packageJsons = await glob('packages/*/package.json');
      if (packageJsons.length > 1) {
        const packages = packageJsons.map(p => path.basename(path.dirname(p)));
        return {
          type: 'typescript-monorepo',
          confidence: 70,
          packages,
        };
      }
    }

    return null;
  }

  private async detectNextJs(): Promise<DetectorResult | null> {
    const packageJson = await this.readPackageJson();
    if (!packageJson || !packageJson.dependencies || !packageJson.devDependencies) return null;

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    } as Record<string, string>;

    if (deps['next']) {
      return {
        type: 'nextjs',
        confidence: 95,
        framework: `Next.js ${deps['next']}`,
      };
    }

    return null;
  }

  async detectRust(): Promise<DetectorResult | null> {
    const cargoToml = await this.fileExists('Cargo.toml');
    if (cargoToml) {
      const cargoWorkspace = await this.readFile('Cargo.toml');
      const isWorkspace = cargoWorkspace?.includes('[workspace]') || false;
      
      return {
        type: isWorkspace ? 'rust-workspace' : 'rust',
        confidence: 95,
        framework: isWorkspace ? 'Rust Workspace' : 'Rust',
      };
    }

    return null;
  }

  async detectPython(): Promise<DetectorResult | null> {
    const pyprojectToml = await this.fileExists('pyproject.toml');
    const setupPy = await this.fileExists('setup.py');
    const requirementsTxt = await this.fileExists('requirements.txt');

    if (pyprojectToml || setupPy || requirementsTxt) {
      const poetry = await this.fileExists('poetry.lock');
      const pipenv = await this.fileExists('Pipfile');
      
      let framework = 'Python';
      if (poetry) framework = 'Poetry';
      else if (pipenv) framework = 'Pipenv';

      return {
        type: 'python',
        confidence: 85,
        framework,
      };
    }

    return null;
  }

  private async detectTypeScript(): Promise<DetectorResult | null> {
    const tsconfig = await this.fileExists('tsconfig.json');
    if (tsconfig) {
      return {
        type: 'typescript',
        confidence: 80,
      };
    }

    return null;
  }

  private async detectJavaScript(): Promise<DetectorResult | null> {
    const packageJson = await this.fileExists('package.json');
    if (packageJson) {
      return {
        type: 'javascript',
        confidence: 60,
      };
    }

    return null;
  }

  private async fileExists(filename: string): Promise<boolean> {
    try {
      await fs.access(path.join(process.cwd(), filename));
      return true;
    } catch {
      return false;
    }
  }

  private async readFile(filename: string): Promise<string | null> {
    try {
      return await fs.readFile(path.join(process.cwd(), filename), 'utf-8');
    } catch {
      return null;
    }
  }

  private async readPackageJson(): Promise<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } | null> {
    try {
      const content = await this.readFile('package.json');
      return content ? JSON.parse(content) : null;
    } catch {
      return null;
    }
  }

  private async findMonorepoPackages(): Promise<string[]> {
    const patterns = [
      'packages/*/package.json',
      'apps/*/package.json',
      'libs/*/package.json',
    ];

    const packages: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern);
      packages.push(...matches.map(m => path.basename(path.dirname(m))));
    }

    return packages;
  }

  private getLanguageForType(type: string): string {
    const languageMap: Record<string, string> = {
      'typescript': 'TypeScript',
      'typescript-monorepo': 'TypeScript',
      'javascript': 'JavaScript',
      'nextjs': 'TypeScript',
      'rust': 'Rust',
      'rust-workspace': 'Rust',
      'python': 'Python',
    };

    return languageMap[type] || 'Unknown';
  }

  private getRecommendations(type: string): string[] {
    const recommendations: Record<string, string[]> = {
      'typescript-monorepo': [
        'Use --template nextjs if this is a Next.js monorepo',
        'Consider using package-specific workflows for each app',
      ],
      'nextjs': [
        'Run: ao init to generate Next.js optimized workflows',
        'Consider adding e2e testing phases',
      ],
      'rust': [
        'Run: ao init to generate Rust optimized workflows',
        'Consider adding cargo clippy and fmt checks',
      ],
      'python': [
        'Run: ao init to generate Python optimized workflows',
        'Consider adding pytest and mypy phases',
      ],
    };

    return recommendations[type] || [];
  }
}
