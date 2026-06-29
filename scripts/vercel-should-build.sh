#!/bin/sh
# Skip Vercel builds for the standalone feedback media branch (API uploads only).
if [ "$VERCEL_GIT_COMMIT_REF" = "issues_medias" ]; then
  exit 0
fi
exit 1
