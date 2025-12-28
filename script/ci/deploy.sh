#!/bin/bash

set -exuo pipefail

cd "$(dirname "$0")/../.."

tempfile="$(mktemp)"
printf "%s" "$FTP_PASSWORD" > "$tempfile"
chmod 600 "$tempfile"

mkdir -p ~/.ssh
ssh-keyscan -H "$FTP_HOST" >> ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts

sshpass -f "$tempfile" \
  rsync \
    -avzh --delete --checksum \
    ./dist/ \
    "$FTP_USER@$FTP_HOST:$FTP_ROOT_PATH"

rm -f "$tempfile"
