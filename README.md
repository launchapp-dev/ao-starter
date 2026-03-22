# ao-starter

CLI tool to scaffold AO workflows for any project. Automatically detect project type and generate optimized workflow configurations.

## Features

- 🔍 **Auto-detection** - Automatically detects project type (TypeScript, Rust, Python, Next.js, etc.)
- 📦 **Monorepo support** - Supports monorepo structures (Nx, Turborepo, pnpm workspaces)
- 🎨 **Templates** - Pre-built templates for common project types
- ⚡ **Quick setup** - Get started with AO in seconds

## Installation

```bash
npm install -g ao-starter
```

Or use directly with npx:

```bash
npx ao-starter init
```

## Usage

### Initialize AO workflows

```bash
# Auto-detect project type and generate workflows
create-ao init

# Use a specific template
create-ao init --template nextjs
create-ao init --template rust
create-ao init --template python

# Preview changes without writing files
create-ao init --dry-run

# Specify output directory
create-ao init --output ./my-ao-config
```

### Detect project type

```bash
# Analyze the current project and show recommendations
create-ao detect
```

## Supported Project Types

- **TypeScript Monorepo** - Nx, Turborepo, pnpm workspaces, Lerna
- **Next.js** - React framework with SSR/SSG
- **TypeScript** - Standard TypeScript projects
- **JavaScript** - Node.js and frontend projects
- **Rust** - Cargo projects and workspaces
- **Python** - Poetry, Pipenv, and standard projects

## Generated Files

The tool generates the following files in the `.ao/` directory:

- `custom.yaml` - Custom configuration settings
- `agents.yaml` - Agent definitions and capabilities
- `phases.yaml` - Phase definitions for workflows
- `workflows.yaml` - Workflow compositions
- `README.md` - Documentation for the generated configuration

## Templates

### Default Template

Basic workflow configuration suitable for most projects.

### Next.js Template

Optimized for Next.js applications with:
- SSR/SSG phases
- API route testing
- E2E testing with Playwright

### Rust Template

Optimized for Rust projects with:
- Cargo build phases
- Clippy linting
- Rustfmt formatting
- Test phases

### Python Template

Optimized for Python projects with:
- Pytest testing
- MyPy type checking
- Black formatting
- Poetry/Pipenv support

## Development

```bash
# Clone the repository
git clone https://github.com/launchapp-dev/ao-starter.git
cd ao-starter

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js init
```

## Related Projects

- [AO CLI](https://github.com/launchapp-dev/ao) - Agent Orchestrator CLI
- [AO Skills](https://github.com/launchapp-dev/ao-skills) - Agent skills library
- [AO Docs](https://github.com/launchapp-dev/ao-docs) - Documentation

## License

MIT
