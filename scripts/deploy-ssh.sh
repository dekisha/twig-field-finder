#!/usr/bin/env bash
# Builds for Apache and uploads dist/ to a cPanel-style host over SSH (no rsync
# needed on the server). Replaces the previous deploy but keeps the files cPanel
# manages: .well-known (AutoSSL), cgi-bin, php.ini and .user.ini.
#
#   pnpm deploy:ssh
#
#   DEPLOY_HOST  SSH host or ~/.ssh/config alias.
#   DEPLOY_PATH  Document root on the server, relative to the home directory.
#   SITE_URL     Public URL of the site.
set -euo pipefail

export SITE_URL="${SITE_URL:-https://twigfieldfinder.dejanaleksic.com}"
host="${DEPLOY_HOST:-dartlamp}"
path="${DEPLOY_PATH:-twigfieldfinder.dejanaleksic.com}"

if [[ -z "$path" || "$path" == "/" || "$path" == "." ]]; then
  echo "Refusing to deploy to DEPLOY_PATH='$path'." >&2
  exit 1
fi

pnpm build:apache

# Upload first, so a failed transfer leaves the live site untouched.
tar -C dist -czf - . | ssh "$host" 'cat > ~/.deploy-upload.tar.gz'

ssh "$host" "set -e
  cd ~/'$path'
  find . -mindepth 1 -maxdepth 1 ! -name .well-known ! -name cgi-bin ! -name php.ini ! -name .user.ini -exec rm -rf {} +
  tar -xzf ~/.deploy-upload.tar.gz
  rm ~/.deploy-upload.tar.gz"

echo "Deployed to $SITE_URL"
