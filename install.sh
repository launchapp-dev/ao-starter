#!/usr/bin/env bash
#
# ao-starter Install Script
# Installs ao-starter CLI globally without requiring npm
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/launchapp-dev/ao-starter/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/launchapp-dev/ao-starter/main/install.sh | bash -s -- --uninstall
#
set -euo pipefail

# Configuration
REPO="launchapp-dev/ao-starter"
INSTALL_DIR="${HOME}/.local/share/ao-starter"
BIN_DIR="${HOME}/.local/bin"
TARBALL_NAME="ao-starter.tar.gz"

# Colors (fallback for terminals without color support)
if [[ -t 1 ]]; then
  BOLD='\033[1m'
  RESET='\033[0m'
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
else
  BOLD=''
  RESET=''
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  CYAN=''
fi

# Print functions
print_banner() {
  echo -e "${BOLD}${BLUE}"
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║          ${CYAN}ao-starter Installer${BLUE}                               ║"
  echo "║          CLI tool to scaffold AO workflows               ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo -e "${RESET}"
}

print_step() {
  echo -e "${BOLD}${BLUE}►${RESET} $1"
}

print_success() {
  echo -e "${GREEN}✓${RESET} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${RESET} $1"
}

print_error() {
  echo -e "${RED}✗${RESET} $1" >&2
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Get Node.js version as integer for comparison (e.g., "18.0.0" -> 180)
version_to_number() {
  local version="$1"
  echo "$version" | sed -E 's/^v?([0-9]+)\.([0-9]+).*/\1\2/'
}

# Check Node.js version requirement
check_node_version() {
  local required_major=18
  local required_minor=0

  if ! command_exists node; then
    print_error "Node.js is not installed."
    echo ""
    echo "Please install Node.js >= ${required_major}.${required_minor}.0"
    echo "  • Using nvm: nvm install 18 && nvm use 18"
    echo "  • Download: https://nodejs.org/"
    exit 1
  fi

  local node_version
  node_version=$(node --version | sed 's/^v//')
  local major minor
  major=$(echo "$node_version" | cut -d. -f1)
  minor=$(echo "$node_version" | cut -d. -f2)

  if ((major < required_major)) || ((major == required_major && minor < required_minor)); then
    print_error "Node.js version $node_version is too old."
    echo ""
    echo "ao-starter requires Node.js >= ${required_major}.${required_minor}.0"
    echo "Current version: $node_version"
    echo ""
    echo "Please upgrade Node.js:"
    echo "  • Using nvm: nvm install 18 && nvm use 18"
    echo "  • Download: https://nodejs.org/"
    exit 1
  fi

  print_success "Node.js version $node_version (>= ${required_major}.${required_minor}.0)"
}

# Check npm availability
check_npm() {
  if ! command_exists npm; then
    print_error "npm is not installed."
    echo ""
    echo "npm is required to install ao-starter."
    echo "This usually comes with Node.js."
    exit 1
  fi
  print_success "npm found"
}

# Get the latest release version
get_latest_version() {
  local version
  version=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

  if [[ -z "$version" ]]; then
    print_error "Failed to fetch latest release version."
    exit 1
  fi

  echo "$version"
}

# Download and install the package
download_and_install() {
  local version="$1"
  local temp_dir
  temp_dir=$(mktemp -d)

  print_step "Downloading ao-starter ${version}..."

  # Determine platform and architecture
  local platform arch tarball_url
  case "$(uname -s)" in
    Linux*)
      platform="linux"
      ;;
    Darwin*)
      platform="darwin"
      ;;
    *)
      print_error "Unsupported platform: $(uname -s)"
      exit 1
      ;;
  esac

  case "$(uname -m)" in
    x86_64)
      arch="x64"
      ;;
    aarch64|arm64)
      arch="arm64"
      ;;
    *)
      print_error "Unsupported architecture: $(uname -m)"
      exit 1
      ;;
  esac

  tarball_url="https://github.com/${REPO}/releases/download/${version}/ao-starter-${version}-${platform}-${arch}.tar.gz"

  cd "$temp_dir"

  if ! curl -fsSL -o "$TARBALL_NAME" "$tarball_url"; then
    print_warning "Pre-built binary not found, installing via npm..."
    install_via_npm "$version"
    return
  fi

  print_step "Installing to ${INSTALL_DIR}..."

  # Clean previous installation
  rm -rf "$INSTALL_DIR"
  mkdir -p "$INSTALL_DIR"

  # Extract tarball
  if tar -xzf "$TARBALL_NAME" -C "$INSTALL_DIR" --strip-components=1; then
    print_success "Extracted to ${INSTALL_DIR}"
  else
    print_error "Failed to extract package"
    rm -rf "$temp_dir"
    exit 1
  fi

  # Install globally via npm with our package
  print_step "Installing globally..."
  cd "$INSTALL_DIR"

  if npm install -g --ignore-scripts 2>/dev/null; then
    print_success "Installed ao-starter globally"
  else
    print_error "Failed to install globally"
    rm -rf "$temp_dir"
    exit 1
  fi

  # Cleanup
  rm -rf "$temp_dir"

  print_success "Installation complete!"
}

# Fallback: Install via npm
install_via_npm() {
  local version="${1:-latest}"

  print_step "Installing ao-starter via npm..."

  if [[ "$version" == "latest" ]]; then
    if npm install -g ao-starter 2>/dev/null; then
      print_success "Installed ao-starter via npm"
    else
      print_error "Failed to install via npm"
      exit 1
    fi
  else
    if npm install -g "ao-starter@${version}" 2>/dev/null; then
      print_success "Installed ao-starter@${version} via npm"
    else
      print_error "Failed to install ao-starter@${version} via npm"
      exit 1
    fi
  fi
}

# Verify installation
verify_installation() {
  print_step "Verifying installation..."

  # Reload shell paths
  if [[ ":${PATH}:" != *":${HOME}/.local/bin:"* ]]; then
    export PATH="${HOME}/.local/bin:${PATH}"
  fi

  if command_exists ao || command_exists create-ao; then
    local version
    version=$(ao --version 2>/dev/null || echo "unknown")
    print_success "ao-starter is installed (version: $version)"
    echo ""
    echo -e "Run ${BOLD}ao --help${RESET} to get started."
    return 0
  else
    print_warning "ao command not found in PATH."
    echo ""
    echo "Please add the following to your shell configuration:"
    echo ""
    echo -e "  ${BOLD}export PATH=\"\${HOME}/.local/bin:\${PATH}\"${RESET}"
    echo ""
    echo "Then restart your shell or run:"
    echo "  source ~/.bashrc   # for bash"
    echo "  source ~/.zshrc    # for zsh"
    return 1
  fi
}

# Uninstall ao-starter
uninstall() {
  print_step "Uninstalling ao-starter..."

  print_warning "This will remove ao-starter and all its data."
  echo ""
  read -p "Continue? [y/N] " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
  fi

  # Remove npm global package
  if command_exists npm; then
    npm uninstall -g ao-starter 2>/dev/null || true
    print_success "Removed npm package"
  fi

  # Remove installation directory
  if [[ -d "$INSTALL_DIR" ]]; then
    rm -rf "$INSTALL_DIR"
    print_success "Removed ${INSTALL_DIR}"
  fi

  # Remove npm package-lock if exists
  rm -rf "${INSTALL_DIR}.tmp" 2>/dev/null || true

  print_success "ao-starter has been uninstalled."
  echo ""
  echo "If you added PATH exports to your shell config, you may remove them:"
  echo "  ${HOME}/.local/bin"
}

# Print usage
usage() {
  echo "ao-starter Installer"
  echo ""
  echo "Usage:"
  echo "  curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | bash"
  echo "  curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | bash -s -- [options]"
  echo ""
  echo "Options:"
  echo "  --uninstall    Uninstall ao-starter"
  echo "  --version      Specify version to install (default: latest)"
  echo "  --npm          Force npm installation method"
  echo "  --help         Show this help message"
  echo ""
}

# Main function
main() {
  local install_method="auto"
  local uninstall_mode=false
  local specified_version=""

  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --uninstall)
        uninstall_mode=true
        shift
        ;;
      --npm)
        install_method="npm"
        shift
        ;;
      --version)
        specified_version="$2"
        shift 2
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        print_error "Unknown option: $1"
        usage
        exit 1
        ;;
    esac
  done

  print_banner

  if [[ "$uninstall_mode" == true ]]; then
    uninstall
    return
  fi

  print_step "Checking system requirements..."

  # Check Node.js version
  check_node_version

  # Check npm
  check_npm

  echo ""

  # Determine installation method and version
  local version
  if [[ -n "$specified_version" ]]; then
    version="$specified_version"
  else
    version=$(get_latest_version)
  fi

  echo ""
  echo -e "Installing ao-starter ${BOLD}${version}${RESET}"
  echo ""

  if [[ "$install_method" == "npm" ]]; then
    install_via_npm "$version"
  else
    download_and_install "$version"
  fi

  echo ""

  # Verify installation
  verify_installation
}

# Run main function
main "$@"
