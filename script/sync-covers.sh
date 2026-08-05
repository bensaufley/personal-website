#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/.."

uid="$(op item ls --vault Private | grep 'Dreamhost FTP: Bensaufley' | awk '{print $1}')"

SSHPASS="$(op read op://Private/"$uid"/password)" \
rsync \
  -avh \
  -e "sshpass -e ssh -l $(op read op://Private/"$uid"/username)" \
  --dry-run \
  ./covers/ \
  "$(op read op://Private/"$uid"/username)"@"$(op read op://Private/"$uid"/website)":/home/bensaufley/bensaufley.com/covers/
