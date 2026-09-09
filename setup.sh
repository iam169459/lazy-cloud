#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# LazyDrop — CLI Manager
# Install, start, stop, update, and manage LazyDrop
# https://github.com/iam169459/lazy-cloud
# ──────────────────────────────────────────────

REPO="https://github.com/iam169459/lazy-cloud.git"
BRANCH="dev"
APP_DIR="lazydrop"
NODE_VERSION="20"
SERVICE_NAME="lazydrop"
PORT=3000

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log()   { echo -e "${CYAN}[lazydrop]${NC} $*"; }
ok()    { echo -e "${GREEN}[lazydrop]${NC} $*"; }
warn()  { echo -e "${YELLOW}[lazydrop]${NC} $*"; }
err()   { echo -e "${RED}[lazydrop]${NC} $*"; exit 1; }

# ── Detect if running from inside the repo ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/.git" ] && grep -q "lazy-cloud" "$SCRIPT_DIR/.git/config" 2>/dev/null; then
  APP_DIR="$SCRIPT_DIR"
  RUNNING_IN_REPO=true
else
  RUNNING_IN_REPO=false
fi

# ── Find the app directory ──
find_app() {
  if [ "$RUNNING_IN_REPO" = true ]; then
    cd "$APP_DIR"
  elif [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
  elif [ -d "$HOME/$APP_DIR/.git" ]; then
    APP_DIR="$HOME/$APP_DIR"
    cd "$APP_DIR"
  else
    err "LazyDrop not found. Run: lazydrop install"
  fi
}

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

  if command -v fnm >/dev/null 2>&1; then
    log "Using fnm..."
    fnm install "$NODE_VERSION" && fnm use "$NODE_VERSION" && return
  fi

  if [ -d "$HOME/.nvm" ]; then
    log "Using nvm..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install "$NODE_VERSION" && nvm use "$NODE_VERSION" && return
  fi

  if command -v volta >/dev/null 2>&1; then
    log "Using volta..."
    volta install "node@$NODE_VERSION" && return
  fi

  if command -v apt-get >/dev/null 2>&1; then
    log "Using apt..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    return
  fi

  if command -v brew >/dev/null 2>&1; then
    log "Using Homebrew..."
    brew install "node@${NODE_VERSION}"
    return
  fi

  log "Downloading Node.js binary..."
  detect_platform
  NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}.0.0/node-v${NODE_VERSION}.0.0-${PLATFORM}-${ARCH}.tar.gz"
  TMP_DIR=$(mktemp -d)
  curl -fsSL "$NODE_URL" -o "$TMP_DIR/node.tar.gz"
  tar -xzf "$TMP_DIR/node.tar.gz" -C "$TMP_DIR"
  NODE_BIN="$TMP_DIR/node-v${NODE_VERSION}.0.0-${PLATFORM}-${ARCH}/bin"
  export PATH="$NODE_BIN:$PATH"

  PROFILE=""
  [ -f "$HOME/.bashrc" ] && PROFILE="$HOME/.bashrc"
  [ -f "$HOME/.zshrc" ] && PROFILE="$HOME/.zshrc"
  [ -f "$PROFILE" ] || PROFILE="$HOME/.profile"
  if [ -n "$PROFILE" ] && ! grep -q "lazydrop-node" "$PROFILE" 2>/dev/null; then
    echo "" >> "$PROFILE"
    echo "# LazyDrop Node.js" >> "$PROFILE"
    echo "export PATH=\"$NODE_BIN:\$PATH\"" >> "$PROFILE"
  fi
  rm -rf "$TMP_DIR"
}

# ── Ensure Node.js is available ──
ensure_node() {
  if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    [ "$NODE_VER" -ge 18 ] && return
    warn "Node.js $NODE_VER found but 18+ required. Upgrading..."
  fi
  install_node
  command -v node >/dev/null || err "Node.js installation failed."
  command -v npm >/dev/null || err "npm installation failed."
}

# ── Ensure git is available ──
ensure_git() {
  command -v git >/dev/null 2>&1 && return
  log "git not found. Installing..."
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y git
  elif command -v brew >/dev/null 2>&1; then
    brew install git
  else
    err "git is not installed. Install it manually."
  fi
}

# ── Get public IP ──
get_ip() {
  for url in "https://api.ipify.org" "https://ifconfig.me" "https://icanhazip.com"; do
    PUBLIC_IP=$(curl -fsSL --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]') && break
  done
  echo "${PUBLIC_IP:-unknown}"
}

# ── Check if service is running ──
is_running() {
  if command -v systemctl >/dev/null 2>&1; then
    systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null
  elif command -v pgrep >/dev/null 2>&1; then
    pgrep -f "dist-server/production.js" >/dev/null 2>&1
  fi
}

# ═══════════════════════════════════════════════
# COMMANDS
# ═══════════════════════════════════════════════

cmd_install() {
  ensure_git
  ensure_node

  echo ""
  echo -e "${CYAN}  ╔══════════════════════════════════════╗${NC}"
  echo -e "${CYAN}  ║     LazyDrop — Install               ║${NC}"
  echo -e "${CYAN}  ╚══════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Node.js: $(node -v)  |  npm: $(npm -v)"
  echo ""

  if [ "$RUNNING_IN_REPO" = true ]; then
    log "Running from inside the repo..."
    cd "$APP_DIR"
  elif [ -d "$APP_DIR/.git" ]; then
    err "Already installed. Run: lazydrop update"
  else
    log "Cloning LazyDrop..."
    git clone --branch "$BRANCH" --depth 1 "$REPO" "$APP_DIR"
    cd "$APP_DIR"
  fi

  log "Installing dependencies..."
  npm install

  if [ ! -f .env ]; then
    log "Creating .env..."

    # Prompt for database URL
    echo ""
    read -rp "$(echo -e "${CYAN}[lazydrop]${NC} Database URL (or press Enter to skip): ")" INPUT_DB

    cat > .env <<ENVEOF
# ═══════════════════════════════════════
# LazyDrop Configuration
# ═══════════════════════════════════════

# Database (required — get from https://neon.tech)
DATABASE_URL=${INPUT_DB:-postgresql://user:password@host/dbname}

# Admin credentials (set via web UI on first visit)
# ADMIN_USERNAME=
# ADMIN_PASSWORD=
ENVEOF
    echo ""
    ok "Created .env"
    echo ""
    warn "Setup your admin account in the browser:"
    echo "    Open the admin page and create your username & password"
    echo ""
  else
    warn ".env already exists, skipping"
  fi

  log "Building production bundle..."
  npm run build

  # Offer systemd service on Linux
  if command -v systemctl >/dev/null 2>&1; then
    echo ""
    read -rp "$(echo -e "${CYAN}[lazydrop]${NC} Install as system service (runs on boot)? [Y/n]: ")" INSTALL_SVC
    if [ "${INSTALL_SVC,,}" != "n" ]; then
      install_systemd_service
    fi
  fi

  # Open firewall
  open_firewall

  local IP
  IP=$(get_ip)

  echo ""
  ok "Installation complete!"
  echo ""
  echo -e "  ${BOLD}Edit config:${NC}    nano .env"
  echo -e "  ${BOLD}Start dev server:${NC}  lazydrop start"
  echo -e "  ${BOLD}Local:${NC}  http://localhost:5173"
  echo -e "  ${BOLD}Network:${NC} http://${IP}:5173"
  echo ""
}

cmd_start() {
  find_app
  log "Starting LazyDrop..."

  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    sudo systemctl start "$SERVICE_NAME"
    ok "Service started."
  else
    # Kill any existing instance first
    if [ -f /tmp/lazydrop.pid ] && kill -0 "$(cat /tmp/lazydrop.pid)" 2>/dev/null; then
      kill "$(cat /tmp/lazydrop.pid)" 2>/dev/null || true
      sleep 1
    fi

    log "Starting dev server in background..."
    nohup npm run dev > /tmp/lazydrop.log 2>&1 &
    echo $! > /tmp/lazydrop.pid
    sleep 3

    # Check if process is alive (not just PID file)
    if kill -0 "$(cat /tmp/lazydrop.pid 2>/dev/null)" 2>/dev/null; then
      ok "Dev server started (PID: $(cat /tmp/lazydrop.pid))"
    else
      err "Failed to start. Check: cat /tmp/lazydrop.log"
    fi
  fi

  # Grab actual port from log
  local PORT_ACTUAL
  PORT_ACTUAL=$(grep -oP 'http://localhost:\K[0-9]+' /tmp/lazydrop.log 2>/dev/null | head -1 || echo "$PORT")

  local IP
  IP=$(get_ip)
  echo -e "  ${BOLD}Local:${NC}  http://localhost:${PORT_ACTUAL}"
  echo -e "  ${BOLD}Network:${NC} http://${IP}:${PORT_ACTUAL}"
  echo ""
}

cmd_stop() {
  find_app
  log "Stopping LazyDrop..."

  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    sudo systemctl stop "$SERVICE_NAME"
    ok "Service stopped."
  else
    local killed=false
    if [ -f /tmp/lazydrop.pid ]; then
      PID=$(cat /tmp/lazydrop.pid)
      if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null || true
        killed=true
      fi
      rm -f /tmp/lazydrop.pid
    fi
    # Also kill any stray vite processes
    pkill -f "vite" 2>/dev/null || true
    if [ "$killed" = true ]; then
      ok "Dev server stopped."
    else
      warn "No running instance found."
    fi
  fi
}

cmd_restart() {
  cmd_stop
  sleep 1
  cmd_start
}

cmd_status() {
  find_app

  local IP
  IP=$(get_ip)

  echo ""
  echo -e "${CYAN}  ╔══════════════════════════════════════╗${NC}"
  echo -e "${CYAN}  ║     LazyDrop — Status                ║${NC}"
  echo -e "${CYAN}  ╚══════════════════════════════════════╝${NC}"
  echo ""

  # Version / branch
  if [ -d .git ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    COMMIT=$(git log --oneline -1 2>/dev/null | cut -d' ' -f1 || echo "unknown")
    echo -e "  ${BOLD}Branch:${NC}    $BRANCH ($COMMIT)"
  fi

  # Node.js
  if command -v node >/dev/null 2>&1; then
    echo -e "  ${BOLD}Node.js:${NC}   $(node -v)"
  else
    echo -e "  ${BOLD}Node.js:${NC}   ${RED}not installed${NC}"
  fi

  # .env
  if [ -f .env ]; then
    if grep -q "DATABASE_URL=postgresql://user:password" .env 2>/dev/null; then
      echo -e "  ${BOLD}Database:${NC}  ${YELLOW}not configured${NC} (edit .env)"
    else
      echo -e "  ${BOLD}Database:${NC}  ${GREEN}configured${NC}"
    fi
  else
    echo -e "  ${BOLD}Database:${NC}  ${RED}.env not found${NC}"
  fi

  # Build
  if [ -f dist-server/production.js ]; then
    echo -e "  ${BOLD}Build:${NC}     ${GREEN}ready${NC}"
  else
    echo -e "  ${BOLD}Build:${NC}     ${YELLOW}not built${NC} (run: lazydrop install)"
  fi

  # Service
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
      echo -e "  ${BOLD}Service:${NC}   ${GREEN}running${NC} (systemd)"
    else
      echo -e "  ${BOLD}Service:${NC}   ${RED}stopped${NC} (systemd)"
    fi
  elif [ -f /tmp/lazydrop.pid ] && kill -0 "$(cat /tmp/lazydrop.pid)" 2>/dev/null; then
    echo -e "  ${BOLD}Process:${NC}   ${GREEN}running${NC} (PID: $(cat /tmp/lazydrop.pid))"
  elif pgrep -f "vite" >/dev/null 2>&1; then
    echo -e "  ${BOLD}Process:${NC}   ${GREEN}running${NC} (PID: $(pgrep -f vite | head -1))"
  else
    echo -e "  ${BOLD}Process:${NC}   ${RED}not running${NC}"
  fi

  local ACTUAL_PORT
  ACTUAL_PORT=$(grep -oP 'http://localhost:\K[0-9]+' /tmp/lazydrop.log 2>/dev/null | head -1 || echo "$PORT")
  [ -z "$ACTUAL_PORT" ] && ACTUAL_PORT="$PORT"

  echo -e "  ${BOLD}Local:${NC}    http://localhost:${ACTUAL_PORT}"
  echo -e "  ${BOLD}Network:${NC}   http://${IP}:${ACTUAL_PORT}"
  echo ""
}

cmd_update() {
  find_app

  echo ""
  log "Updating LazyDrop..."
  echo -e "  Branch: ${BOLD}$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')${NC}"
  echo -e "  Current: ${DIM}$(git log --oneline -1 2>/dev/null || echo 'unknown')${NC}"
  echo ""

  # Stash local changes
  if ! git diff --quiet 2>/dev/null; then
    log "Stashing local changes..."
    git stash push -m "auto-stash before update $(date +%Y%m%d-%H%M%S)" || true
  fi

  # Pull latest
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "$BRANCH")
  log "Pulling latest from '$BRANCH'..."
  if ! git pull origin "$BRANCH" 2>&1; then
    err "git pull failed. Check your network or git config."
  fi

  echo -e "  Latest: ${DIM}$(git log --oneline -1 2>/dev/null)${NC}"
  echo ""

  # Install deps
  log "Installing dependencies..."
  npm install 2>&1 | tail -3

  # Rebuild
  log "Rebuilding..."
  if ! npm run build 2>&1 | tail -5; then
    err "Build failed. Check the errors above."
  fi

  # Restart service if running
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    log "Restarting service..."
    sudo systemctl restart "$SERVICE_NAME"
    ok "Service restarted."
  elif [ -f /tmp/lazydrop.pid ] && kill -0 "$(cat /tmp/lazydrop.pid)" 2>/dev/null; then
    log "Restarting dev server..."
    kill "$(cat /tmp/lazydrop.pid)" 2>/dev/null || true
    rm -f /tmp/lazydrop.pid
    sleep 1
    cmd_start >/dev/null 2>&1
    ok "Dev server restarted."
  fi

  echo ""
  ok "Update complete!"
  echo ""
}

cmd_logs() {
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    journalctl -u "$SERVICE_NAME" -f --no-pager
  elif [ -f /tmp/lazydrop.log ]; then
    tail -f /tmp/lazydrop.log
  else
    err "No logs found. Start the server first: lazydrop start"
  fi
}

cmd_uninstall() {
  find_app
  echo ""
  warn "This will remove LazyDrop completely."
  read -rp "$(echo -e "${RED}Are you sure? [y/N]:${NC} ")" CONFIRM
  [ "${CONFIRM,,}" = "y" ] || { log "Cancelled."; exit 0; }

  cmd_stop 2>/dev/null || true

  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    sudo systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    sudo rm -f /etc/systemd/system/$SERVICE_NAME.service
    sudo systemctl daemon-reload
  fi

  rm -f /tmp/lazydrop.log /tmp/lazydrop.pid

  if [ "$RUNNING_IN_REPO" = false ] && [ -d "$APP_DIR" ]; then
    rm -rf "$APP_DIR"
    ok "Removed $APP_DIR"
  else
    log "Running from inside repo — not deleting. Remove manually if needed."
  fi

  ok "Uninstalled."
}

cmd_service() {
  find_app
  install_systemd_service
}

install_systemd_service() {
  log "Installing systemd service..."

  NODE_PATH=$(which node 2>/dev/null || echo "/usr/local/bin/node")
  ABS_APP_DIR="$(cd "$APP_DIR" && pwd)"

  sudo tee /etc/systemd/system/$SERVICE_NAME.service >/dev/null <<SVC
[Unit]
Description=LazyDrop File Sharing Server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${ABS_APP_DIR}
ExecStart=${NODE_PATH} dist-server/production.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=${ABS_APP_DIR}/.env

[Install]
WantedBy=multi-user.target
SVC

  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME"
  sudo systemctl start "$SERVICE_NAME"
  ok "Service installed and started!"
  echo ""
  echo "  Commands:"
  echo "    lazydrop status     — check status"
  echo "    lazydrop restart    — restart"
  echo "    lazydrop stop       — stop"
  echo "    lazydrop logs       — view logs"
  echo ""
}

open_firewall() {
  if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow $PORT/tcp >/dev/null 2>&1 && ok "Firewall: opened port $PORT" || true
  elif command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --permanent --add-port=$PORT/tcp >/dev/null 2>&1
    sudo firewall-cmd --reload >/dev/null 2>&1
    ok "Firewall: opened port $PORT"
  fi
}

# ═══════════════════════════════════════════════
# INTERACTIVE MENU
# ═══════════════════════════════════════════════

show_menu() {
  clear
  echo ""
  echo -e "${CYAN}  ╔══════════════════════════════════════╗${NC}"
  echo -e "${CYAN}  ║       LazyDrop — Manager             ║${NC}"
  echo -e "${CYAN}  ╚══════════════════════════════════════╝${NC}"
  echo ""

  # Status indicator
  local STATUS_COLOR="$RED"
  local STATUS_TEXT="not running"
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    STATUS_COLOR="$GREEN"
    STATUS_TEXT="running (service)"
  elif [ -f /tmp/lazydrop.pid ] && kill -0 "$(cat /tmp/lazydrop.pid)" 2>/dev/null; then
    STATUS_COLOR="$GREEN"
    STATUS_TEXT="running"
  fi
  echo -e "  Status: ${STATUS_COLOR}${STATUS_TEXT}${NC}"
  echo ""
  echo -e "  ${BOLD}What do you want to do?${NC}"
  echo ""
  echo "    1)  Install / Reinstall"
  echo "    2)  Start server"
  echo "    3)  Stop server"
  echo "    4)  Restart server"
  echo "    5)  Update (pull + rebuild)"
  echo "    6)  View status"
  echo "    7)  View logs"
  echo "    8)  Install as system service"
  echo "    9)  Uninstall"
  echo "    0)  Exit"
  echo ""
  read -rp "  Pick [0-9]: " CHOICE
  echo ""

  case "$CHOICE" in
    1) cmd_install ;;
    2) cmd_start ;;
    3) cmd_stop ;;
    4) cmd_restart ;;
    5) cmd_update ;;
    6) cmd_status ;;
    7) cmd_logs ;;
    8) cmd_service ;;
    9) cmd_uninstall ;;
    0|q|Q) echo "  Bye!"; exit 0 ;;
    *) warn "Invalid choice"; sleep 1; show_menu ;;
  esac
}

# ═══════════════════════════════════════════════
# HELP
# ═══════════════════════════════════════════════

cmd_help() {
  echo ""
  echo -e "${CYAN}  LazyDrop CLI${NC}"
  echo ""
  echo -e "  ${BOLD}Usage:${NC}"
  echo "    ./setup.sh              Interactive menu (recommended)"
  echo "    ./setup.sh <command>    Direct command"
  echo ""
  echo -e "  ${BOLD}Commands:${NC}"
  echo "    install       Install LazyDrop (auto-installs Node.js if needed)"
  echo "    start         Start the dev server"
  echo "    stop          Stop the server"
  echo "    restart       Restart the server"
  echo "    status        Show status, config, and connection info"
  echo "    update        Pull latest changes and rebuild"
  echo "    logs          Follow live logs"
  echo "    service       Install/reinstall as systemd service"
  echo "    uninstall     Remove LazyDrop completely"
  echo ""
  echo -e "  ${BOLD}Quick start:${NC}"
  echo "    curl -fsSL https://raw.githubusercontent.com/iam169459/lazy-cloud/dev/setup.sh | bash"
  echo ""
}

# ═══════════════════════════════════════════════
# ROUTER
# ═══════════════════════════════════════════════

CMD="${1:-}"
shift 2>/dev/null || true

if [ -z "$CMD" ]; then
  show_menu
else
  case "$CMD" in
    install)   cmd_install ;;
    start)     cmd_start ;;
    stop)      cmd_stop ;;
    restart)   cmd_restart ;;
    status)    cmd_status ;;
    update)    cmd_update ;;
    logs)      cmd_logs ;;
    service)   cmd_service ;;
    uninstall) cmd_uninstall ;;
    help|-h|--help) cmd_help ;;
    *)
      err "Unknown command: $CMD\n\nRun: ./setup.sh for interactive menu"
      ;;
  esac
fi
