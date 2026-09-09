#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# LazyDrop — Auto Setup & Update
# Installs everything on a fresh host
# https://github.com/iam169459/lazy-cloud
# ──────────────────────────────────────────────

REPO="https://github.com/iam169459/lazy-cloud.git"
BRANCH="dev"
APP_DIR="lazydrop"
NODE_VERSION="20"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()   { echo -e "${CYAN}[lazydrop]${NC} $*"; }
ok()    { echo -e "${GREEN}[lazydrop]${NC} $*"; }
warn()  { echo -e "${YELLOW}[lazydrop]${NC} $*"; }
err()   { echo -e "${RED}[lazydrop]${NC} $*"; exit 1; }

# ── Detect OS and architecture ──
detect_platform() {
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64)  ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    armv7l)  ARCH="armv7l" ;;
    *) err "Unsupported architecture: $ARCH" ;;
  esac
  case "$OS" in
    linux)  PLATFORM="linux" ;;
    darwin) PLATFORM="darwin" ;;
    *) err "Unsupported OS: $OS. Use Linux or macOS." ;;
  esac
}

# ── Install Node.js if missing ──
install_node() {
  log "Node.js not found. Installing Node.js ${NODE_VERSION}..."

  # Try fnm first (fast)
  if command -v fnm >/dev/null 2>&1; then
    log "Using fnm to install Node.js..."
    fnm install "$NODE_VERSION"
    fnm use "$NODE_VERSION"
    return
  fi

  # Try nvm
  if [ -d "$HOME/.nvm" ]; then
    log "Using nvm to install Node.js..."
    export NVM_DIR="$HOME/.nvm"
    # shellcheck source=/dev/null
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"
    return
  fi

  # Try volta
  if command -v volta >/dev/null 2>&1; then
    log "Using volta to install Node.js..."
    volta install "node@$NODE_VERSION"
    return
  fi

  # Try apt (Debian/Ubuntu)
  if command -v apt-get >/dev/null 2>&1; then
    log "Installing Node.js via apt..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    return
  fi

  # Try brew (macOS)
  if command -v brew >/dev/null 2>&1; then
    log "Installing Node.js via Homebrew..."
    brew install "node@${NODE_VERSION}"
    return
  fi

  # Fallback: download official binary
  log "Downloading Node.js binary..."
  detect_platform
  NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}.0.0/node-v${NODE_VERSION}.0.0-${PLATFORM}-${ARCH}.tar.gz"
  TMP_DIR=$(mktemp -d)
  curl -fsSL "$NODE_URL" -o "$TMP_DIR/node.tar.gz"
  tar -xzf "$TMP_DIR/node.tar.gz" -C "$TMP_DIR"
  NODE_BIN="$TMP_DIR/node-v${NODE_VERSION}.0.0-${PLATFORM}-${ARCH}/bin"

  # Add to PATH for current session
  export PATH="$NODE_BIN:$PATH"

  # Persist to shell profile
  PROFILE=""
  [ -f "$HOME/.bashrc" ] && PROFILE="$HOME/.bashrc"
  [ -f "$HOME/.zshrc" ] && PROFILE="$HOME/.zshrc"
  [ -f "$PROFILE" ] || PROFILE="$HOME/.profile"

  if [ -n "$PROFILE" ]; then
    if ! grep -q "lazydrop-node" "$PROFILE" 2>/dev/null; then
      echo "" >> "$PROFILE"
      echo "# LazyDrop Node.js" >> "$PROFILE"
      echo "export PATH=\"$NODE_BIN:\$PATH\"" >> "$PROFILE"
      log "Added Node.js to PATH in $PROFILE"
    fi
  fi

  rm -rf "$TMP_DIR"
}

# ── Ensure Node.js is available ──
ensure_node() {
  if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VER" -ge 18 ]; then
      return
    fi
    warn "Node.js $NODE_VER found but 18+ required. Upgrading..."
  fi
  install_node

  # Verify installation
  command -v node >/dev/null || err "Node.js installation failed. Install manually: https://nodejs.org"
  command -v npm >/dev/null || err "npm installation failed."
}

# ── Preflight ──
command -v git >/dev/null || {
  log "git not found. Installing..."
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y git
  elif command -v brew >/dev/null 2>&1; then
    brew install git
  else
    err "git is not installed. Install it manually."
  fi
}

ensure_node

echo ""
echo -e "${CYAN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║     LazyDrop — Auto Setup            ║${NC}"
echo -e "${CYAN}  ╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  Node.js: $(node -v)  |  npm: $(npm -v)"
echo ""

# ── Detect mode: install or update ──
if [ -d "$APP_DIR/.git" ]; then
  MODE="update"
  log "Existing installation found — updating..."
  cd "$APP_DIR"

  if ! git diff --quiet 2>/dev/null; then
    log "Stashing local changes..."
    git stash push -m "auto-stash before update $(date +%Y%m%d-%H%M%S)"
  fi

  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "$BRANCH")
  log "Pulling latest from '$BRANCH'..."
  git pull origin "$BRANCH"
else
  MODE="install"
  log "Cloning LazyDrop..."
  git clone --branch "$BRANCH" --depth 1 "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Install dependencies ──
log "Installing dependencies..."
npm install

# ── Environment file (first install only) ──
if [ "$MODE" = "install" ] && [ ! -f .env ]; then
  log "Creating .env..."
  cat > .env <<'ENVEOF'
# ═══════════════════════════════════════
# LazyDrop Configuration
# ═══════════════════════════════════════

# Database (required — get from https://neon.tech)
DATABASE_URL=postgresql://user:password@host/dbname

# Admin credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-now

# Optional: Supabase (for additional features)
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Encryption
# LAZYDROP_ENCRYPTION_KEY=your-encryption-key

# Optional: Upload password (protects public uploads)
# LAZYDROP_UPLOAD_PASSWORD=your-upload-password
ENVEOF
  echo ""
  warn "Created .env — you MUST edit it before starting:"
  echo "    nano .env"
  echo ""
fi

# ── Build ──
log "Building production bundle..."
npm run build

# ── Get public IP ──
PUBLIC_IP=""
for url in "https://api.ipify.org" "https://ifconfig.me" "https://icanhazip.com"; do
  PUBLIC_IP=$(curl -fsSL --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]') && break
done

# ── Done ──
echo ""
if [ "$MODE" = "install" ]; then
  ok "Installation complete!"
  echo ""
  echo -e "  ${BOLD}Next steps:${NC}"
  echo "    1. Edit .env with your DATABASE_URL:"
  echo "       nano $APP_DIR/.env"
  echo ""
  echo "    2. Start the server:"
  echo "       cd $APP_DIR && npm run dev"
  echo ""
  echo -e "  ${BOLD}Local:${NC}   http://localhost:5173"
  [ -n "$PUBLIC_IP" ] && echo -e "  ${BOLD}Network:${NC} http://${PUBLIC_IP}:5173"
  echo ""
  echo -e "  ${BOLD}Production (Render):${NC}"
  echo "    - Push to GitHub, connect on render.com"
  echo "    - Set DATABASE_URL in Render dashboard"
  echo "    - Build:  npm install && npm run build"
  echo "    - Start:  npm start"
  echo ""
  echo -e "  ${BOLD}Expose to internet:${NC}"
  echo "    cd $APP_DIR && npm run tunnel"
  echo ""
else
  ok "Update complete!"
  echo ""
  echo "  If the dev server is running, it hot-reloads automatically."
  echo "  For production: restart your hosting service."
  echo ""
  echo -e "  ${BOLD}Local:${NC}   http://localhost:5173"
  [ -n "$PUBLIC_IP" ] && echo -e "  ${BOLD}Network:${NC} http://${PUBLIC_IP}:5173"
fi
echo ""
