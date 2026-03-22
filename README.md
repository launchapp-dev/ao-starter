<!-- markdownlint-disable MD033 MD041 -->

<div align="center">

# ao-starter

[![npm version](https://img.shields.io/npm/v/ao-starter.svg)](https://www.npmjs.com/package/ao-starter)
[![npm downloads](https://img.shields.io/npm/dm/ao-starter.svg)](https://www.npmjs.com/package/ao-starter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build Status](https://github.com/launchapp-dev/ao-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/launchapp-dev/ao-starter/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

**CLI tool to scaffold Agent Orchestrator (AO) workflows for any project.** Automatically detects project type and generates optimized workflow configurations.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Templates](#templates) • [Troubleshooting](#troubleshooting) • [Contributing](#contributing)

</div>

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [`ao init`](#ao-init)
  - [`ao detect`](#ao-detect)
  - [`ao templates`](#ao-templates)
- [Templates](#templates)
- [Generated Files](#generated-files)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Related Projects](#related-projects)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **🔍 Auto-detection** — Automatically detects project type (TypeScript, Rust, Python, Next.js, Go, and more)
- **📦 Monorepo Support** — Works with Nx, Turborepo, pnpm workspaces, and Lerna
- **🎨 Pre-built Templates** — Optimized workflow configurations for common project types
- **⚡ Quick Setup** — Get started with AO in seconds
- **🔧 Customizable** — Override auto-detection and customize templates

---

## Installation

### Global Installation (Recommended)

```bash
npm install -g ao-starter
```

This installs `ao` (or `create-ao`) globally, making it available from anywhere:

```bash
ao --version
ao init
```

### Using npx (No Installation)

Run directly without installing:

```bash
npx ao-starter init
```

Or use the shorter `create-ao` alias:

```bash
npx create-ao init
```

### Requirements

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or yarn/pnpm)

---

## Quick Start

1. **Navigate to your project:**

   ```bash
   cd your-project
   ```

2. **Initialize AO workflows (auto-detect):**

   ```bash
   ao init
   ```

3. **Start the AO daemon:**

   ```bash
   ao daemon start
   ```

4. **View available tasks:**

   ```bash
   ao task list
   ```

---

## Usage

### `ao init`

Initialize AO workflows for the current project. Automatically detects project type and generates optimized configurations.

#### Basic Usage

```bash
# Auto-detect project type and generate workflows
ao init

# Or use the full command name
create-ao init
```

#### Specify a Template

```bash
# Use a specific template
ao init --template nextjs
ao init --template rust
ao init --template python
ao init --template typescript-monorepo

# Shorthand
ao init -t nextjs
```

#### Preview Changes

```bash
# Preview changes without writing files
ao init --dry-run
```

#### Custom Output Directory

```bash
# Generate files to a custom directory
ao init --output ./my-ao-config

# Files will be created in ./my-ao-config/ instead of ./.ao/
```

#### Skip Auto-Detection

```bash
# Use default template without auto-detection
ao init --skip-detect
```

#### Force Override

```bash
# Force regeneration even if .ao directory exists
ao init --force
```

#### Combine Options

```bash
# Use specific template with dry-run
ao init --template nextjs --dry-run

# Force override with custom output
ao init --force --output ./config
```

#### `ao init` Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--template <id>` | `-t` | Template ID to use | Auto-detect |
| `--list` | `-l` | List available templates | - |
| `--output <path>` | `-o` | Output directory | `.ao` |
| `--skip-detect` | - | Skip auto-detection | `false` |
| `--force` | - | Force override existing files | `false` |
| `--dry-run` | - | Preview without writing | `false` |

---

### `ao detect`

Analyze the current project and display detected type, framework, and recommendations.

#### Human-Readable Output

```bash
ao detect
```

**Example Output:**

```
🚀 AO Starter - Scaffold AO workflows for any project

Analyzing project...

Project Detection Results:

  Type:       nextjs
  Framework:  Next.js
  Language:  TypeScript
  Package:   my-app

Recommendations:

  1. Use --template nextjs if this is a Next.js monorepo
  2. Consider using package-specific workflows for each app

Run `create-ao init` to generate AO workflow files.
```

#### JSON Output

```bash
# Output in JSON format for scripting
ao detect --json
```

**Example JSON Output:**

```json
{
  "type": "nextjs",
  "confidence": 95,
  "framework": "Next.js",
  "language": "TypeScript",
  "monorepo": false,
  "rootPackage": "my-app",
  "buildTool": "next",
  "indicators": ["package.json", "tsconfig.json"],
  "recommendations": [
    "Run: ao init to generate Next.js optimized workflows",
    "Consider adding e2e testing phases"
  ]
}
```

---

### `ao templates`

List all available templates with descriptions.

```bash
ao init --list
# or
ao templates
```

**Example Output:**

```
📦 Available Templates

  default                 Standard AO workflow configuration for general projects (default)
    Suitable for: Any project type

  typescript              TypeScript-optimized workflows with type checking phases
    Suitable for: TypeScript projects, Node.js backends

  typescript-monorepo     Multi-package workflows for Nx, Turborepo, or pnpm workspaces
    Suitable for: Monorepo projects, Shared libraries, Multiple packages

  javascript              JavaScript-focused workflows with linting and testing
    Suitable for: JavaScript projects, Legacy codebases

  nextjs                  Full-stack Next.js workflows with API routes and server components
    Suitable for: Next.js applications, React projects, Full-stack apps

  rust                    Rust-optimized workflows with clippy, fmt, and benchmarking
    Suitable for: Rust projects, Systems programming, CLI tools

  rust-workspace          Multi-crate Rust workflows for cargo workspaces
    Suitable for: Rust workspaces, Multiple crates, Library development

  python                  Python workflows with mypy, pytest, and poetry support
    Suitable for: Python projects, ML/data projects, API backends

Usage:
  ao init --template <template-id>

💡 Quick Recommendations:

  • For Next.js projects, use: --template nextjs
  • For Rust projects, use: --template rust
  • For Python projects, use: --template python
```

---

## Templates

| Template | Description | Project Types |
|----------|-------------|---------------|
| **default** | Standard AO workflow configuration | Any project |
| **typescript** | TypeScript-optimized with type checking | TypeScript, Node.js |
| **typescript-monorepo** | Multi-package for monorepos | Nx, Turborepo, pnpm workspaces |
| **javascript** | JavaScript with linting and testing | JavaScript, Legacy code |
| **nextjs** | Next.js with API routes | Next.js, React, Full-stack |
| **rust** | Rust with clippy and fmt | Rust, CLI tools |
| **rust-workspace** | Multi-crate for workspaces | Rust workspaces |
| **python** | Python with pytest and mypy | Python, ML, APIs |

### Template-Specific Features

#### Next.js Template

- SSR/SSG build phases
- API route testing
- E2E testing with Playwright
- Type checking with `tsc`

#### Rust Template

- Cargo build phases
- Clippy linting
- Rustfmt formatting
- Test and benchmark phases

#### Python Template

- Pytest testing
- MyPy type checking
- Black formatting
- Poetry/Pipenv support

#### TypeScript Monorepo Template

- Package-specific workflows
- Shared library builds
- Workspace dependency resolution

---

## Generated Files

The `ao init` command generates the following files in the `.ao/` directory:

| File | Description |
|------|-------------|
| `custom.yaml` | Custom configuration settings and scheduling |
| `agents.yaml` | Agent definitions and capabilities |
| `phases.yaml` | Phase definitions for workflows |
| `workflows.yaml` | Workflow compositions |
| `README.md` | Documentation for the generated configuration |

### File Structure Example

```
your-project/
├── .ao/
│   ├── custom.yaml      # Daemon settings, schedules
│   ├── agents.yaml      # Agent roles and capabilities
│   ├── phases.yaml      # Workflow phases
│   ├── workflows.yaml   # Workflow definitions
│   └── README.md        # Configuration documentation
├── package.json
└── src/
    └── index.ts
```

---

## Troubleshooting

### Common Issues

#### Permission Denied

```
Error: Permission denied: Cannot write to directory ".ao"
```

**Solutions:**

1. Check directory permissions:
   ```bash
   chmod u+w .ao
   ```

2. Run with elevated permissions if needed:
   ```bash
   sudo ao init
   ```

3. Use a different output directory:
   ```bash
   ao init --output ./my-ao-config
   ```

#### Invalid Template

```
Error: Invalid template "next". Available templates: default, typescript, nextjs, ...
```

**Solutions:**

1. Check available templates:
   ```bash
   ao init --list
   ```

2. Use the correct template name (e.g., `nextjs` not `next`):
   ```bash
   ao init --template nextjs
   ```

#### Project Not Detected

```
Detected project type: unknown
```

**Solutions:**

1. Verify you're in a project directory with recognizable files:
   ```bash
   # Check for expected files
   ls -la package.json Cargo.toml pyproject.toml
   ```

2. Manually specify a template:
   ```bash
   ao init --template default
   ```

3. Check project detection with verbose output:
   ```bash
   ao detect
   ```

#### Existing Files Warning

```
Warning: The following files already exist and will be overwritten:
  .ao/agents.yaml
  .ao/phases.yaml
```

**Solutions:**

1. Review the changes with dry-run:
   ```bash
   ao init --dry-run
   ```

2. Force override:
   ```bash
   ao init --force
   ```

3. Backup existing files first:
   ```bash
   cp -r .ao .ao.backup
   ao init --force
   ```

#### Node.js Version Requirement

```
npm install -g ao-starter
# Error: Unsupported engine
```

**Solution:** Upgrade Node.js to >= 18.0.0:

```bash
# Using nvm
nvm install 18
nvm use 18

# Or using official installer
# https://nodejs.org/
```

### Getting Help

1. **Check the documentation:**
   ```bash
   ao --help
   ao init --help
   ao detect --help
   ```

2. **View the generated README:**
   ```bash
   cat .ao/README.md
   ```

3. **Report an issue:**
   [GitHub Issues](https://github.com/launchapp-dev/ao-starter/issues)

---

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/launchapp-dev/ao-starter.git
cd ao-starter

# Install dependencies
npm install

# Build the project
npm run build
```

### Development Workflow

```bash
# Build in watch mode
npm run dev

# Run locally
npm start -- init

# Or run the built version
node dist/index.js init
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/commands/templates.test.ts
```

### Linting

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Type Checking

```bash
npm run typecheck
```

### Build

```bash
# Clean and rebuild
npm run clean
npm run build

# Prepare for publishing
npm run prepublishOnly
```

---

## Related Projects

| Project | Description |
|---------|-------------|
| [AO CLI](https://github.com/launchapp-dev/ao) | Agent Orchestrator CLI |
| [AO Skills](https://github.com/launchapp-dev/ao-skills) | Agent skills library |
| [AO Docs](https://github.com/launchapp-dev/ao-docs) | Documentation |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Getting Started

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Run `npm run lint` and `npm test` before submitting
- Add tests for new features
- Update documentation as needed

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance tasks

---

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2026 Launchapp.dev

---

<div align="center">

**[Back to top](#table-of-contents)**

</div>
