#!/bin/sh
# Give the container an account whose uid/gid match the host's.
#
# Runs at image build time (see the Dockerfile). It lives in a script rather than
# an inline RUN so that `scripts/check-sandbox.py` can execute this exact file
# under `sh` with the account tooling stubbed: that is the only way to exercise
# the logic on a machine with no Docker, and this logic is what shipped broken.
#
# Why it matters at all: the compose service runs as `user: "${HOST_UID}:${HOST_GID}"`.
# With no passwd entry for that uid, every shell greets the user with "I have no
# name!", HOME points nowhere, and the bind-mounted workspace looks foreign.
set -eu

HOST_UID="${HOST_UID:-1000}"
HOST_GID="${HOST_GID:-1000}"
ACCOUNT=devuser
HOME_DIR=/home/devuser

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

case "${HOST_UID}${HOST_GID}" in
  *[!0-9]*) fail "HOST_UID and HOST_GID must be numeric (got '${HOST_UID}'/'${HOST_GID}'). Build args reach here exactly as compose passes them." ;;
esac

# uid/gid 0 is the host's root. Adopting it would run the container as root under
# a name nobody chose, which defeats the point of matching the host uid.
if [ "$HOST_UID" = "0" ] || [ "$HOST_GID" = "0" ]; then
  fail "HOST_UID/HOST_GID are 0. Set them to your own ids (id -u, id -g) instead of building as root."
fi

# A group with the host gid, whatever it is called: the base image already has
# one for gid 1000, and a second group with the same gid is an error.
if ! getent group "$HOST_GID" >/dev/null; then
  groupadd --gid "$HOST_GID" "$ACCOUNT"
fi

# The account is usually already there: node:22-bookworm ships uid 1000 as
# `node`, and uid 1000 is the first user on nearly every single-user Linux host.
# Adopt that account — rename it, keep its uid — rather than refusing to build,
# because refusing turns the default configuration into the one that cannot work.
if getent passwd "$HOST_UID" >/dev/null; then
  existing="$(getent passwd "$HOST_UID" | cut -d: -f1)"
  if [ "$existing" != "$ACCOUNT" ]; then
    usermod --login "$ACCOUNT" --home "$HOME_DIR" --shell /usr/bin/zsh "$existing"
  fi
else
  useradd --uid "$HOST_UID" --gid "$HOST_GID" --create-home --shell /usr/bin/zsh "$ACCOUNT"
fi

# It has to resolve by name, or `whoami` and rc-file lookup fall back to
# "I have no name!" — the failure this whole script exists to prevent.
getent passwd "$ACCOUNT" >/dev/null || fail "uid $HOST_UID is not resolvable as '$ACCOUNT' after setup."

mkdir -p "$HOME_DIR"
chown -R "$HOST_UID:$HOST_GID" "$HOME_DIR"

# A bind mount with foreign ownership trips git's dubious-ownership guard.
git config --system --add safe.directory /workspace
