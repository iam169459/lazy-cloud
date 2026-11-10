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

# ── Find and cd to the app directory ──
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
    fnm install "$NODE_VERSION" && fnm use "$NODE_VERSION" && return
  fi
  if [ -d "$HOME/.nvm" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install "$NODE_VERSION" && nvm use "$NODE_VERSION" && return
  fi
  if command -v volta >/dev/null 2>&1; then
    volta install "node@$NODE_VERSION" && return
  fi
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs && return
  fi
  if command -v brew >/dev/null 2>&1; then
    brew install "node@${NODE_VERSION}" && return
  fi

  # Binary fallback
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
    echo -e "\n# LazyDrop Node.js\nexport PATH=\"$NODE_BIN:\$PATH\"" >> "$PROFILE"
  fi
  rm -rf "$TMP_DIR"
}

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

get_ip() {
  for url in "https://api.ipify.org" "https://ifconfig.me" "https://icanhazip.com"; do
    PUBLIC_IP=$(curl -fsSL --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]') && break
  done
  echo "${PUBLIC_IP:-unknown}"
}

is_running() {
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "$SERVICE_NAME" 2>/dev/null; then
    systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null
  elif [ -f /tmp/lazydrop.pid ]; then
    kill -0 "$(cat /tmp/lazydrop.pid)" 2>/dev/null
  else
    false
  fi
}

has_service() {
  command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "$SERVICE_NAME" 2>/dev/null
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
    echo ""
    read -rp "$(echo -e "${CYAN}[lazydrop]${NC} Database URL (or Enter to skip): ")" INPUT_DB

    echo ""
    echo -e "  ${BOLD}Admin Account${NC}"
    read -rp "$(echo -e "${CYAN}[lazydrop]${NC} Admin email (or Enter to skip): ")" INPUT_EMAIL
    read -rp "$(echo -e "${CYAN}[lazydrop]${NC} Admin username [admin]: ")" INPUT_USER
    INPUT_USER="${INPUT_USER:-admin}"
    read -rsp "$(echo -e "${CYAN}[lazydrop]${NC} Admin password: ")" INPUT_PASS
    echo ""
    if [ -n "$INPUT_PASS" ]; then
      read -rsp "$(echo -e "${CYAN}[lazydrop]${NC} Confirm password: ")" INPUT_PASS2
      echo ""
      [ "$INPUT_PASS" = "$INPUT_PASS2" ] || err "Passwords do not match"
      [ ${#INPUT_PASS} -ge 6 ] || err "Password must be at least 6 characters"
    fi

    cat > .env <<ENVEOF
# LazyDrop Configuration
DATABASE_URL=${INPUT_DB:-postgresql://user:password@host/dbname}
ADMIN_EMAIL=${INPUT_EMAIL}
ADMIN_USERNAME=${INPUT_USER}
ADMIN_PASSWORD=${INPUT_PASS}
ENVEOF
    ok "Created .env"
    [ -n "$INPUT_PASS" ] && ok "Admin: ${INPUT_USER}" || warn "Set admin in browser on first visit"
  else
    warn ".env exists, skipping"
  fi

  log "Building..."
  npm run build

  if has_service; then
    read -rp "$(echo -e "${CYAN}[lazydrop]${NC} Install as system service? [Y/n]: ")" INSTALL_SVC
    [ "${INSTALL_SVC,,}" != "n" ] && install_systemd_service
  fi

  open_firewall

  echo ""
  ok "Installed!"
  echo -e "  ${BOLD}Start:${NC}  lazydrop start"
  echo -e "  ${BOLD}Local:${NC}  http://localhost:5173"
  echo -e "  ${BOLD}IP:${NC}     http://$(get_ip):5173"
  echo ""
}

# Internal stop — no messages, returns 0 if something was stopped
_stop_internal() {
  if has_service && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    sudo systemctl stop "$SERVICE_NAME" 2>/dev/null
    return 0
  fi
  local stopped=false
  if [ -f /tmp/lazydrop.pid ]; then
    local PID
    PID=$(cat /tmp/lazydrop.pid)
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" 2>/dev/null || true
      stopped=true
    fi
    rm -f /tmp/lazydrop.pid
  fi
  pkill -f "vite" 2>/dev/null || true
  $stopped
}

# Internal start — no messages, returns 0 if started
_start_internal() {
  if has_service; then
    sudo systemctl start "$SERVICE_NAME" 2>/dev/null
    sleep 2
    systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null
    return $?
  fi

  # Dev server
  if [ -f /tmp/lazydrop.pid ] && kill -0 "$(cat /tmp/lazydrop.pid)" 2>/dev/null; then
    return 0  # already running
  fi
  nohup npm run dev > /tmp/lazydrop.log 2>&1 &
  echo $! > /tmp/lazydrop.pid
  sleep 3
  kill -0 "$(cat /tmp/lazydrop.pid 2>/dev/null)" 2>/dev/null
}

cmd_start() {
  find_app

  if _start_internal; then
    ok "Started."
  else
    # Service exists but failed — try reinstalling
    if has_service; then
      warn "Service failed. Reinstalling..."
      install_systemd_service
    else
      err "Failed to start. Check: cat /tmp/lazydrop.log"
    fi
  fi

  local PORT_ACTUAL IP
  PORT_ACTUAL=$(grep -oP 'http://localhost:\K[0-9]+' /tmp/lazydrop.log 2>/dev/null | head -1 || echo "$PORT")
  IP=$(get_ip)
  echo -e "  ${BOLD}Local:${NC}  http://localhost:${PORT_ACTUAL}"
  echo -e "  ${BOLD}Network:${NC} http://${IP}:${PORT_ACTUAL}"
  echo ""
}

cmd_stop() {
  find_app
  if _stop_internal; then
    ok "Stopped."
  else
    warn "Not running."
  fi
}

cmd_restart() {
  find_app
  log "Restarting..."
  _stop_internal 2>/dev/null
  sleep 1
  if _start_internal; then
    ok "Restarted."
  else
    if has_service; then
      warn "Service failed. Reinstalling..."
      install_systemd_service
    else
      err "Failed to restart. Check: cat /tmp/lazydrop.log"
    fi
  fi
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

  if [ -d .git ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    COMMIT=$(git log --oneline -1 2>/dev/null | cut -d' ' -f1 || echo "unknown")
    echo -e "  ${BOLD}Branch:${NC}    $BRANCH ($COMMIT)"
  fi

  echo -e "  ${BOLD}Node.js:${NC}   $(node -v 2>/dev/null || echo 'not installed')"

  if [ -f .env ] && grep -q "DATABASE_URL=postgresql://user:password" .env 2>/dev/null; then
    echo -e "  ${BOLD}Database:${NC}  ${YELLOW}not configured${NC}"
  elif [ -f .env ]; then
    echo -e "  ${BOLD}Database:${NC}  ${GREEN}configured${NC}"
  else
    echo -e "  ${BOLD}Database:${NC}  ${RED}.env not found${NC}"
  fi

  if [ -f dist-server/production.js ]; then
    echo -e "  ${BOLD}Build:${NC}     ${GREEN}ready${NC}"
  else
    echo -e "  ${BOLD}Build:${NC}     ${YELLOW}not built${NC}"
  fi

  if has_service && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo -e "  ${BOLD}Service:${NC}   ${GREEN}running${NC}"
  elif [ -f /tmp/lazydrop.pid ] && kill -0 "$(cat /tmp/lazydrop.pid)" 2>/dev/null; then
    echo -e "  ${BOLD}Process:${NC}   ${GREEN}running${NC} (PID: $(cat /tmp/lazydrop.pid))"
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
  log "Checking for updates..."
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "$BRANCH")
  echo -e "  Branch: ${BOLD}${BRANCH}${NC}"
  echo -e "  Local:  ${DIM}$(git log --oneline -1 2>/dev/null || echo 'unknown')${NC}"

  git fetch origin "$BRANCH" 2>/dev/null || true

  LOCAL=$(git rev-parse HEAD 2>/dev/null)
  REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null)

  if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "  Remote: ${GREEN}up to date${NC}"
    ok "Already on the latest version!"
    echo ""
    return
  fi

  AHEAD=$(git rev-list HEAD..origin/"$BRANCH" --count 2>/dev/null || echo "?")
  echo -e "  Remote: ${YELLOW}${AHEAD} update(s) available${NC}"
  echo -e "  Latest: ${DIM}$(git log --oneline -1 "origin/$BRANCH" 2>/dev/null)${NC}"
  echo ""

  read -rp "$(echo -e "${CYAN}[lazydrop]${NC} Update now? [Y/n]: ")" CONFIRM
  [ "${CONFIRM,,}" != "n" ] || { log "Skipped."; return; }

  if ! git diff --quiet 2>/dev/null; then
    git stash push -m "auto-stash $(date +%Y%m%d-%H%M%S)" || true
  fi

  log "Pulling..."
  git pull origin "$BRANCH" 2>&1 || err "git pull failed."
  ok "Updated: $(git log --oneline -1 2>/dev/null)"

  log "Installing dependencies..."
  npm install 2>&1 | tail -3

  log "Rebuilding..."
  npm run build 2>&1 | tail -5 || err "Build failed."

  if is_running; then
    log "Restarting..."
    if has_service; then
      sudo systemctl restart "$SERVICE_NAME" && ok "Service restarted."
    else
      _stop_internal 2>/dev/null; sleep 1
      _start_internal && ok "Dev server restarted."
    fi
  fi

  echo ""
  ok "Done!"
  echo ""
}

cmd_logs() {
  if has_service; then
    journalctl -u "$SERVICE_NAME" -f --no-pager
  elif [ -f /tmp/lazydrop.log ]; then
    tail -f /tmp/lazydrop.log
  else
    err "No logs. Start the server first."
  fi
}

cmd_uninstall() {
  find_app
  echo ""
  warn "This will remove LazyDrop completely."
  read -rp "$(echo -e "${RED}Are you sure? [y/N]:${NC} ")" CONFIRM
  [ "${CONFIRM,,}" = "y" ] || { log "Cancelled."; exit 0; }

  _stop_internal 2>/dev/null || true

  if has_service; then
    sudo systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    sudo rm -f /etc/systemd/system/$SERVICE_NAME.service
    sudo systemctl daemon-reload
  fi

  rm -f /tmp/lazydrop.log /tmp/lazydrop.pid

  if [ "$RUNNING_IN_REPO" = false ] && [ -d "$APP_DIR" ]; then
    rm -rf "$APP_DIR"
    ok "Removed $APP_DIR"
  else
    log "Running from inside repo — not deleting."
  fi
  ok "Uninstalled."
}

install_systemd_service() {
  find_app
  ABS_APP_DIR="$(cd "$APP_DIR" && pwd)"

  if [ ! -f "$ABS_APP_DIR/dist-server/production.js" ]; then
    log "Building first..."
    cd "$ABS_APP_DIR" && npm run build 2>&1 | tail -3
  fi

  sudo tee /etc/systemd/system/$SERVICE_NAME.service >/dev/null <<SVC
[Unit]
Description=LazyDrop File Sharing Server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${ABS_APP_DIR}
ExecStart=/usr/bin/env node dist-server/production.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=${ABS_APP_DIR}/.env

[Install]
WantedBy=multi-user.target
SVC

  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME" 2>/dev/null
  sudo systemctl restart "$SERVICE_NAME" 2>/dev/null || sudo systemctl start "$SERVICE_NAME"
  sleep 2

  if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    ok "Service installed & running."
  else
    warn "Service installed but may have issues. Check: journalctl -u $SERVICE_NAME -n 20"
  fi
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

  local STATUS_COLOR="$RED" STATUS_TEXT="not running"
  if has_service && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    STATUS_COLOR="$GREEN"; STATUS_TEXT="running (service)"
  elif [ -f /tmp/lazydrop.pid ] && kill -0 "$(cat /tmp/lazydrop.pid)" 2>/dev/null; then
    STATUS_COLOR="$GREEN"; STATUS_TEXT="running"
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
    8) install_systemd_service ;;
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
  echo "    ./setup.sh              Interactive menu"
  echo "    ./setup.sh <command>    Direct command"
  echo ""
  echo -e "  ${BOLD}Commands:${NC}"
  echo "    install       Install LazyDrop"
  echo "    start         Start the server"
  echo "    stop          Stop the server"
  echo "    restart       Restart the server"
  echo "    status        Show status"
  echo "    update        Pull latest and rebuild"
  echo "    logs          Follow live logs"
  echo "    service       Install as systemd service"
  echo "    uninstall     Remove LazyDrop"
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
    service)   install_systemd_service ;;
    uninstall) cmd_uninstall ;;
    help|-h|--help) cmd_help ;;
    *) err "Unknown command: $CMD\n\nRun: ./setup.sh for interactive menu" ;;
  esac
fi
