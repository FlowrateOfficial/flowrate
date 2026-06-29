#!/bin/sh
# Exclude the feedback media orphan branch from git fetch (run once per clone).
set -e

BRANCH='issues_medias'
EXCLUDE="^refs/heads/${BRANCH}"

if git config --get-all remote.origin.fetch | grep -qF "$EXCLUDE"; then
  echo "Already ignoring origin/${BRANCH}"
else
  git config --add remote.origin.fetch "$EXCLUDE"
  echo "Added fetch exclude for origin/${BRANCH}"
fi

if git show-ref --verify --quiet "refs/remotes/origin/${BRANCH}"; then
  git branch -rd "origin/${BRANCH}"
  echo "Removed local remote-tracking ref origin/${BRANCH}"
fi

echo "Done. git fetch / git pull on master will skip ${BRANCH}."
