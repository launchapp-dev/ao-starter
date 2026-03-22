import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import type { ProjectMetadata, ProjectType, Framework, Language } from '../types/index.js';

export interface ProjectDetection {
  type: string;
  framework?: string;
  language?: string;
  monorepo?: boolean;
  packages?: string[];
  recommendations?: string[];
  indicators?: string[];
}

export interface DetectorResult {
  type: ProjectType;
  confidence: number;
  framework?: Framework;
  packages?: string[];
  rootPackage?: string;
  buildTool?: string;
  indicators: string[];
}

export class ProjectDetector {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Detect project type with detailed metadata
   */
  async detect(): Promise<ProjectMetadata> {
    const detectors = [
      this.detectTypeScriptMonorepo.bind(this),
      this.detectNextJs.bind(this),
      this.detectRustWorkspace.bind(this),
      this.detectRustSingle.bind(this),
      this.detectPython.bind(this),
      this.detectTypeScript.bind(this),
      this.detectJavaScript.bind(this),
    ];

    const results: DetectorResult[] = [];

    for (const detector of detectors) {
      const result = await detector();
      if (result && result.confidence > 0) {
        results.push(result);
      }
    }

    // Sort by confidence and pick the best match
    results.sort((a, b) => b.confidence - a.confidence);
    const best = results[0];

    if (!best) {
      return this.createUnknownMetadata();
    }

    return this.createMetadata(best);
  }

  /**
   * Legacy detect method for backward compatibility
   */
  async detectLegacy(): Promise<ProjectDetection> {
    const metadata = await this.detect();
    return {
      type: metadata.type,
      framework: metadata.framework,
      language: metadata.language,
      monorepo: metadata.monorepo,
      packages: metadata.packages,
      recommendations: metadata.recommendations,
      indicators: metadata.indicators,
    };
  }

  private createUnknownMetadata(): ProjectMetadata {
    return {
      type: 'unknown',
      language: 'Unknown',
      monorepo: false,
      packages: [],
      indicators: [],
      recommendations: [
        'Consider manually specifying a template with --template',
        'Run create-ao init --template default to generate basic workflows',
      ],
    };
  }

  private createMetadata(result: DetectorResult): ProjectMetadata {
    return {
      type: result.type,
      framework: result.framework,
      language: this.getLanguageForType(result.type),
      monorepo: result.type === 'typescript-monorepo' || result.type === 'rust-workspace',
      packages: result.packages || [],
      rootPackage: result.rootPackage,
      buildTool: result.buildTool,
      indicators: result.indicators,
      recommendations: this.getRecommendations(result.type),
    };
  }

  /**
   * Detect TypeScript monorepo: package.json + tsconfig.json + turbo.json/pnpm-workspace.yaml
   */
  private async detectTypeScriptMonorepo(): Promise<DetectorResult | null> {
    // Check for required base files
    const hasPackageJson = await this.fileExists('package.json');
    const hasTsconfig = await this.fileExists('tsconfig.json');

    if (!hasPackageJson || !hasTsconfig) {
      return null;
    }

    // Check for monorepo indicators
    const pnpmWorkspace = await this.fileExists('pnpm-workspace.yaml');
    const turbo = await this.fileExists('turbo.json');
    const nx = await this.fileExists('nx.json');
    const lerna = await this.fileExists('lerna.json');

    if (!pnpmWorkspace && !turbo && !nx && !lerna) {
      return null;
    }

    const packages = await this.findMonorepoPackages();
    const rootPackage = await this.getRootPackageName();

    const indicators: string[] = ['package.json', 'tsconfig.json'];
    let framework: Framework;
    let buildTool: string | undefined;

    if (nx) {
      framework = 'Nx';
      buildTool = 'nx';
      indicators.push('nx.json');
    } else if (turbo) {
      framework = 'Turborepo';
      buildTool = 'turbo';
      indicators.push('turbo.json');
    } else if (pnpmWorkspace) {
      framework = 'Monorepo';
      buildTool = 'pnpm';
      indicators.push('pnpm-workspace.yaml');
    } else if (lerna) {
      framework = 'Monorepo';
      buildTool = 'lerna';
      indicators.push('lerna.json');
    } else {
      framework = 'Monorepo';
    }

    return {
      type: 'typescript-monorepo',
      confidence: 95,
      framework,
      packages,
      rootPackage,
      buildTool,
      indicators,
    };
  }

  /**
   * Detect Next.js application
   */
  private async detectNextJs(): Promise<DetectorResult | null> {
    const packageJson = await this.readPackageJson();
    if (!packageJson || !packageJson.dependencies || !packageJson.devDependencies) {
      return null;
    }

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    } as Record<string, string>;

    if (!deps['next']) {
      return null;
    }

    const rootPackage = await this.getRootPackageName();
    const hasTsconfig = await this.fileExists('tsconfig.json');

    return {
      type: 'nextjs',
      confidence: 95,
      framework: 'Next.js',
      rootPackage,
      buildTool: deps['next'] ? 'next' : undefined,
      indicators: [
        'package.json',
        hasTsconfig ? 'tsconfig.json' : 'package.json (next dependency)',
      ].filter(Boolean) as string[],
    };
  }

  /**
   * Detect Rust workspace: Cargo.toml with [workspace]
   */
  private async detectRustWorkspace(): Promise<DetectorResult | null> {
    const cargoContent = await this.readFile('Cargo.toml');
    if (!cargoContent) {
      return null;
    }

    const isWorkspace = cargoContent.includes('[workspace]');
    if (!isWorkspace) {
      return null;
    }

    const packages = this.parseRustPackages(cargoContent);

    return {
      type: 'rust-workspace',
      confidence: 95,
      framework: 'Rust Workspace',
      packages,
      buildTool: 'cargo',
      indicators: ['Cargo.toml [workspace]'],
    };
  }

  /**
   * Detect Rust single project: Cargo.toml without [workspace]
   */
  private async detectRustSingle(): Promise<DetectorResult | null> {
    const cargoContent = await this.readFile('Cargo.toml');
    if (!cargoContent) {
      return null;
    }

    // Make sure it's not a workspace
    if (cargoContent.includes('[workspace]')) {
      return null;
    }

    const packageName = this.parseRustPackageName(cargoContent);

    return {
      type: 'rust',
      confidence: 85,
      framework: 'Rust',
      packages: packageName ? [packageName] : [],
      rootPackage: packageName,
      buildTool: 'cargo',
      indicators: ['Cargo.toml'],
    };
  }

  /**
   * Detect Python project: setup.py, pyproject.toml, or requirements.txt
   */
  private async detectPython(): Promise<DetectorResult | null> {
    const pyprojectToml = await this.fileExists('pyproject.toml');
    const setupPy = await this.fileExists('setup.py');
    const requirementsTxt = await this.fileExists('requirements.txt');

    if (!pyprojectToml && !setupPy && !requirementsTxt) {
      return null;
    }

    const poetry = await this.fileExists('poetry.lock');
    const pipenv = await this.fileExists('Pipfile');

    let framework: Framework = 'Python';
    let buildTool: string | undefined;

    if (poetry) {
      framework = 'Poetry';
      buildTool = 'poetry';
    } else if (pipenv) {
      framework = 'Pipenv';
      buildTool = 'pipenv';
    }

    const indicators: string[] = [];
    if (pyprojectToml) indicators.push('pyproject.toml');
    if (setupPy) indicators.push('setup.py');
    if (requirementsTxt) indicators.push('requirements.txt');

    return {
      type: 'python',
      confidence: 85,
      framework,
      buildTool,
      indicators,
    };
  }

  /**
   * Detect standard TypeScript: package.json + tsconfig.json (without monorepo indicators)
   */
  private async detectTypeScript(): Promise<DetectorResult | null> {
    const hasPackageJson = await this.fileExists('package.json');
    const hasTsconfig = await this.fileExists('tsconfig.json');

    if (!hasPackageJson || !hasTsconfig) {
      return null;
    }

    // Make sure it's not a monorepo (already checked above)
    const monorepoIndicators = [
      await this.fileExists('turbo.json'),
      await this.fileExists('pnpm-workspace.yaml'),
      await this.fileExists('nx.json'),
      await this.fileExists('lerna.json'),
    ];

    if (monorepoIndicators.some(Boolean)) {
      return null;
    }

    const rootPackage = await this.getRootPackageName();

    return {
      type: 'typescript',
      confidence: 80,
      rootPackage,
      buildTool: 'tsc',
      indicators: ['package.json', 'tsconfig.json'],
    };
  }

  /**
   * Detect JavaScript project: package.json without tsconfig.json
   */
  private async detectJavaScript(): Promise<DetectorResult | null> {
    const packageJson = await this.fileExists('package.json');
    if (!packageJson) {
      return null;
    }

    // Make sure it's not TypeScript
    const hasTsconfig = await this.fileExists('tsconfig.json');
    if (hasTsconfig) {
      return null;
    }

    const rootPackage = await this.getRootPackageName();

    return {
      type: 'javascript',
      confidence: 60,
      rootPackage,
      buildTool: 'node',
      indicators: ['package.json'],
    };
  }

  private async fileExists(filename: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.cwd, filename));
      return true;
    } catch {
      return false;
    }
  }

  private async readFile(filename: string): Promise<string | null> {
    try {
      return await fs.readFile(path.join(this.cwd, filename), 'utf-8');
    } catch {
      return null;
    }
  }

  private async readPackageJson(): Promise<{
    name?: string;
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

  private async getRootPackageName(): Promise<string | undefined> {
    const pkg = await this.readPackageJson();
    return pkg?.name;
  }

  private async findMonorepoPackages(): Promise<string[]> {
    const patterns = [
      'packages/*/package.json',
      'apps/*/package.json',
      'libs/*/package.json',
    ];

    const packages: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd: this.cwd });
      packages.push(...matches.map((m) => path.basename(path.dirname(m))));
    }

    return packages;
  }

  private parseRustPackages(cargoContent: string): string[] {
    const packages: string[] = [];
    const membersMatch = cargoContent.match(/members\s*=\s*\[([^\]]*)\]/);
    if (membersMatch && membersMatch[1]) {
      const members = membersMatch[1].split(',').map((m) => m.trim().replace(/['"]/g, ''));
      packages.push(...members.filter(Boolean));
    }
    return packages;
  }

  private parseRustPackageName(cargoContent: string): string | undefined {
    const nameMatch = cargoContent.match(/\[\[bin\]\][\s\S]*?name\s*=\s*["']([^"']+)["']/);
    if (nameMatch) {
      return nameMatch[1];
    }

    const packageMatch = cargoContent.match(/\[package\][\s\S]*?name\s*=\s*["']([^"']+)["']/m);
    return packageMatch?.[1];
  }

  private getLanguageForType(type: ProjectType): Language {
    const languageMap: Record<ProjectType, Language> = {
      'typescript': 'TypeScript',
      'typescript-monorepo': 'TypeScript',
      'javascript': 'JavaScript',
      'nextjs': 'TypeScript',
      'rust': 'Rust',
      'rust-workspace': 'Rust',
      'python': 'Python',
      'unknown': 'Unknown',
    };

    return languageMap[type] || 'Unknown';
  }

  private getRecommendations(type: ProjectType): string[] {
    const recommendations: Record<ProjectType, string[]> = {
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
      'rust-workspace': [
        'Run: ao init to generate Rust workspace workflows',
        'Consider adding cargo workspace-aware phases',
      ],
      'python': [
        'Run: ao init to generate Python optimized workflows',
        'Consider adding pytest and mypy phases',
      ],
      'typescript': [
        'Run: ao init to generate TypeScript workflows',
        'Consider adding lint and type-check phases',
      ],
      'javascript': [
        'Run: ao init to generate JavaScript workflows',
        'Consider adding ESLint and Prettier phases',
      ],
      'unknown': [],
    };

    return recommendations[type] || [];
  }
}
