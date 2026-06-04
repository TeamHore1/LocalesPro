#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/hosting-package"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"

echo "==> Locales Pro - Prepare Hosting Package"

cd "$FRONTEND"
npm run build

rm -rf "$OUT"
mkdir -p "$OUT"

cp -R "$FRONTEND/dist/"* "$OUT/"
cp -R "$BACKEND" "$OUT/backend"

rm -f "$OUT/backend/.env" \
  "$OUT/backend/logs/"*.log \
  "$OUT/backend/logs/login_attempts.json" 2>/dev/null || true

cp "$ROOT/hosting/.htaccess" "$OUT/.htaccess"
cp "$BACKEND/.env.example" "$OUT/backend/.env.example"
cp "$ROOT/HOSTING.md" "$OUT/HOSTING.md"
cp "$ROOT/DB/locales_db.sql" "$OUT/locales_db.sql"

echo ""
echo "Selesai! Paket hosting: $OUT"
echo "Upload isi folder hosting-package ke public_html hosting Anda."
