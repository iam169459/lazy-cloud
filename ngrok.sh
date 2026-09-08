#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# LazyDrop — Start dev server + ngrok tunnel
# Exposes localhost:5173 to the internet
# ──────────────────────────────────────────────

PORT=5173
NGROK_PORT=5173

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[ngrok]${NC} $*"; }
ok()    { echo -e "${GREEN}[ngrok]${NC} $*"; }
warn()  { echo -e "${YELLOW}[ngrok]${NC} $*"; }
err()   { echo -e "${RED}[ngrok]${NC} $*"; exit 1; }

# ── Check ngrok ──
if ! command -v ngrok >/dev/null 2>&1; then
  echo ""
  err "ngrok is not installed.

  Install it:
    macOS:   brew install ngrok
    Linux:   snap install ngrok
    Windows: choco install ngrok

  Then sign up at https://dashboard.ngrok.com and run:
    ngrok config add-authtoken <YOUR_TOKEN>"
fi

# ── Check for .env ──
if [ ! -f .env ]; then
  warn ".env not found — copying from .env.example if available"
  [ -f .env.example ] && cp .env.example .env
fi

echo ""
echo -e "${CYAN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║   LazyDrop + ngrok Tunnel            ║${NC}"
echo -e "${CYAN}  ╚══════════════════════════════════════╝${NC}"
echo ""

# ── Start dev server in background ──
log "Starting Vite dev server on port $PORT..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
sleep 3

# ── Start ngrok ──
log "Starting ngrok tunnel on port $NGROK_PORT..."
echo ""
ngrok http $NGROK_PORT --log=stdout &
NGROK_PID=$!

sleep 2

echo ""
ok "Tunnel is live!"
echo ""
echo "  Local:   http://localhost:$PORT"
echo "  Public:  http://localhost:4040  (ngrok dashboard)"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

# ── Cleanup on exit ──
cleanup() {
  log "Shutting down..."
  kill $DEV_PID 2>/dev/null || true
  kill $NGROK_PID 2>/dev/null || true
  wait $DEV_PID 2>/dev/null || true
  wait $NGROK_PID 2>/dev/null || true
  ok "Stopped."
}

trap cleanup EXIT INT TERM
wait
