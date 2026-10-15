# syntax=docker/dockerfile:1.6

# Dev sandbox for the portfolio site (React + TypeScript + Vite).
#
# The image carries the *system* toolchain only (git, gh, zsh, fonts). The
# project's own dependencies live in the bind-mounted workspace, so editing a
# file on the host is immediately visible inside the container.

FROM node:22-bookworm

# Build-time ARGs are declared here, AFTER the first FROM. An ARG declared
# before FROM is in scope only for the FROM lines themselves — every instruction
# after FROM sees it empty, so a download URL built from an unset version 404s
# at build time in a way no linter catches.
ARG GH_CLI_VERSION=v2.102.0
ARG TARGETARCH
# The host uid/gid, forwarded as build args by docker-compose.yml so the image
# can create a passwd entry + home matching the host user (kills "I have no
# name!"). Defaults keep a standalone `docker build` working.
ARG HOST_UID=1000
ARG HOST_GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
    zsh \
    jq \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# fonts-dejavu-core is deliberate: a capture environment with no fonts renders
# every glyph as nothing, so headless screenshots come out blank/black while
# still looking like valid PNG files.

# Optional: bake the Playwright browser so a screenshot harness works inside the
# sandbox with no extra setup (adds ~150 MB). Uncomment if you capture here:
# ENV PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
# RUN npx --yes playwright install --with-deps chromium && chmod -R a+rX /opt/ms-playwright

RUN if [ -z "$TARGETARCH" ]; then \
      case "$(uname -m)" in \
        x86_64|amd64) TARGETARCH=amd64 ;; \
        aarch64|arm64) TARGETARCH=arm64 ;; \
        *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;; \
      esac; \
    fi \
    && curl -fsSL "https://github.com/cli/cli/releases/download/${GH_CLI_VERSION}/gh_${GH_CLI_VERSION#v}_linux_${TARGETARCH}.tar.gz" -o /tmp/gh.tar.gz \
    && tar -xzf /tmp/gh.tar.gz -C /tmp \
    && mv "/tmp/gh_${GH_CLI_VERSION#v}_linux_${TARGETARCH}/bin/gh" /usr/local/bin/gh \
    && rm -rf /tmp/gh.tar.gz "/tmp/gh_${GH_CLI_VERSION#v}_linux_${TARGETARCH}" \
    && gh --version

# --- runtime user (matches the host uid/gid from docker-compose.yml) ---
# The compose service runs as `user: "${HOST_UID}:${HOST_GID}"`. Without a
# passwd entry for that uid (or a home it can write), interactive shells greet
# the user with "I have no name!" and rc files never load.
#
# The logic lives in its own script because `scripts/check-sandbox.py` runs that
# exact file under `sh` with the account tooling stubbed — the only way to
# exercise it where Docker is unavailable.
COPY scripts/setup-container-user.sh /usr/local/share/setup-container-user.sh
RUN sh /usr/local/share/setup-container-user.sh

# --- dev-sandbox rc (badge + terminal title, loaded for BOTH users) ---
# `make dev-shell` opens an interactive *non-login* bash, which reads only
# ~/.bashrc (HOME comes from the compose environment), never /etc/profile.d.
# So the sourcing hook must live in devuser's rc files — and in root's, so
# `docker compose exec -u root bash` debugging keeps the badge too.
COPY scripts/dev-sandbox-rc.sh /etc/profile.d/00-dev-sandbox.sh
RUN chsh -s /usr/bin/zsh root 2>/dev/null || true \
    && printf '%s\n' '[ -f /etc/profile.d/00-dev-sandbox.sh ] && . /etc/profile.d/00-dev-sandbox.sh' >> /root/.zshrc \
    && printf '%s\n' '[ -f /etc/profile.d/00-dev-sandbox.sh ] && . /etc/profile.d/00-dev-sandbox.sh' >> /root/.bashrc \
    && printf '%s\n' '[ -f /etc/profile.d/00-dev-sandbox.sh ] && . /etc/profile.d/00-dev-sandbox.sh' >> /root/.zprofile \
    && printf '%s\n' '[ -f /etc/profile.d/00-dev-sandbox.sh ] && . /etc/profile.d/00-dev-sandbox.sh' >> /home/devuser/.zshrc \
    && printf '%s\n' '[ -f /etc/profile.d/00-dev-sandbox.sh ] && . /etc/profile.d/00-dev-sandbox.sh' >> /home/devuser/.bashrc \
    && printf '%s\n' '[ -f /etc/profile.d/00-dev-sandbox.sh ] && . /etc/profile.d/00-dev-sandbox.sh' >> /home/devuser/.zprofile \
    && chown ${HOST_UID}:${HOST_GID} \
        /home/devuser/.bashrc /home/devuser/.zshrc /home/devuser/.zprofile

# Default to the non-root user so a service added to docker-compose.yml without
# a `user:` directive can't silently reintroduce root-owned workspace files.
# Compose still pins the exact UID/GID via `user:`.
USER devuser

WORKDIR /workspace

CMD ["sleep", "infinity"]
