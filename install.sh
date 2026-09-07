#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# LazyDrop — One-command installer
# https://github.com/iam169459/lazy-cloud
# ──────────────────────────────────────────────

REPO="https://github.com/iam169459/lazy-cloud.git"
BRANCH="dev"
APP_DIR="lazydrop"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[lazydrop]${NC} $*"; }
ok()    { echo -e "${GREEN}[lazydrop]${NC} $*"; }
warn()  { echo -e "${YELLOW}[lazydrop]${NC} $*"; }
err()   { echo -e "${RED}[lazydrop]${NC} $*"; exit 1; }

# ── Preflight checks ──
command -v git    >/dev/null || err "git is not installed. Install it first."
command -v node   >/dev/null || err "node is not installed. Install Node.js 18+."
command -v npm    >/dev/null || err "npm is not installed."

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
[ "$NODE_VER" -ge 18 ] || err "Node.js 18+ required (found $(node -v))"

echo ""
echo -e "${CYAN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║       LazyDrop Installer             ║${NC}"
echo -e "${CYAN}  ╚══════════════════════════════════════╝${NC}"
echo ""

# ── Clone or update ──
if [ -d "$APP_DIR/.git" ]; then
  log "Directory '$APP_DIR' exists. Pulling latest changes..."
  cd "$APP_DIR"
  git checkout "$BRANCH" 2>/dev/null
  git pull origin "$BRANCH"
else
  log "Cloning repository..."
  git clone --branch "$BRANCH" --depth 1 "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Install dependencies ──
log "Installing dependencies..."
npm install

# ── Environment file ──
if [ ! -f .env ]; then
  log "Creating .env from template..."
  cat > .env <<'ENVEOF'
# Database (required)
DATABASE_URL=postgresql://user:password@host/dbname

# Admin credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-now
ENVEOF
  warn ".env created — edit it with your DATABASE_URL and admin credentials"
else
  ok ".env already exists, skipping"
fi

# ── Build ──
log "Building production bundle..."
npm run build

echo ""
ok "Installation complete!"
echo ""
echo "  Next steps:"
echo "    1. Edit ${APP_DIR}/.env with your DATABASE_URL and credentials"
echo "    2. Run:  cd ${APP_DIR} && npm run dev"
echo "    3. Open  http://localhost:5173"
echo ""
echo "  For production (Render, Railway, etc.):"
echo "    - Build command:  cd ${APP_DIR} && npm install && npm run build"
echo "    - Start command:  cd ${APP_DIR} && npm run dev"
echo ""
