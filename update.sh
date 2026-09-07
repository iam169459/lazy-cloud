#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# LazyDrop — Update / Redeploy
# Pulls latest code, installs deps, rebuilds
# ──────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[lazydrop]${NC} $*"; }
ok()    { echo -e "${GREEN}[lazydrop]${NC} $*"; }
warn()  { echo -e "${YELLOW}[lazydrop]${NC} $*"; }
err()   { echo -e "${RED}[lazydrop]${NC} $*"; exit 1; }

# ── Find project root ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${CYAN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║      LazyDrop Updater                ║${NC}"
echo -e "${CYAN}  ╚══════════════════════════════════════╝${NC}"
echo ""

# ── Ensure git repo ──
[ -d .git ] || err "Not a git repository. Run install.sh first."

# ── Stash local changes ──
if ! git diff --quiet 2>/dev/null; then
  log "Stashing local changes..."
  git stash push -m "auto-stash before update $(date +%Y%m%d-%H%M%S)"
fi

# ── Pull latest ──
BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Pulling latest from '$BRANCH'..."
git pull origin "$BRANCH"

# ── Install / update dependencies ──
log "Installing dependencies..."
npm install

# ── Build ──
log "Building production bundle..."
npm run build

echo ""
ok "Update complete! Latest code is running."
echo ""
echo "  If the dev server is running, it hot-reloads automatically."
echo "  For production: restart your hosting service."
echo ""
