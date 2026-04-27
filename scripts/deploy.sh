#!/bin/bash
# Run this script ON THE SERVER after cloning the repo
# Usage: bash scripts/deploy.sh
set -e

REPO_DIR="/home/ap/libbord"

echo "=== Libbord Deploy ==="

# Pull latest code
if [ -d "$REPO_DIR/.git" ]; then
  echo "[1/4] Pulling latest code..."
  git -C "$REPO_DIR" pull origin master
else
  echo "[1/4] Cloning repo..."
  git clone https://github.com/andreiparhomenco/libboard.git "$REPO_DIR"
fi

cd "$REPO_DIR"

# Check .env.production exists
if [ ! -f ".env.production" ]; then
  echo "ERROR: .env.production not found!"
  echo "Copy .env.production.example to .env.production and fill in values."
  exit 1
fi

# Build and start
echo "[2/4] Building images..."
docker compose -f docker-compose.prod.yml build

echo "[3/4] Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "[4/4] Waiting for backend health..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Done! ==="
echo "Frontend: http://92.63.66.134:8100"
echo "Backend API: http://92.63.66.134:8100/api/docs"
