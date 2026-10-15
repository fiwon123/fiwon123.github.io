# Portfolio — React + TypeScript + Vite static site.
#
# Two ways to work, both supported:
#   * on the host        — `make dev` / `make check` (needs Node 22 + npm)
#   * in the dev sandbox — `make dev-up` then `make opencode` (needs Docker;
#                          see README -> "Dev sandbox")

.DEFAULT_GOAL := help

COMPOSE ?= docker compose

# Extra flags for the opencode invocation. `make opencode-auto` sets this to
# --auto, which auto-approves permissions that are not explicitly denied; the
# secret-file deny rules still apply.
OPENCODE_ARGS ?=
OPENCODE_INSTALL_URL ?= https://opencode.ai/install

.PHONY: help check fmt lint typecheck test dev build preview clean \
        preflight dev-up dev-down dev-log dev-build dev-shell dev-opencode \
        dev-opencode-auto dev-restart reset shell opencode opencode-auto \
        opencode-version opencode-upgrade setup-host

help: ## List available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# --- host targets ------------------------------------------------------------

check: ## Full local gate: format-check, lint, type-check, test, build
	npm run check

fmt: ## Format all files in place
	npm run fmt

lint: ## Lint with oxlint
	npm run lint

typecheck: ## Type-check without emitting
	npm run typecheck

test: ## Run unit tests once
	npm run test

dev: ## Start the dev server on the host
	npm run dev

build: ## Build the production bundle to dist/
	npm run build

preview: ## Preview the production build locally
	npm run preview

clean: ## Remove build output and tool caches
	rm -rf dist node_modules/.tmp node_modules/.vite

# --- dev sandbox -------------------------------------------------------------
# The container binds this directory at /workspace, mounts the host's opencode
# binary read-only, and forwards the GitHub token at runtime — never at build.

setup-host: ## One-time host bootstrap (mise, gh login, config dirs)
	@scripts/setup-host-tools.sh

preflight:
	@command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found — the dev sandbox needs Docker" >&2; exit 1; }
	@test -x "$(HOME)/.opencode/bin/opencode" || echo "WARNING: opencode not found at ~/.opencode/bin/opencode — 'make opencode' will fail" >&2
	@mkdir -p "$(HOME)/.config/opencode" "$(HOME)/.config/gh" && touch "$(HOME)/.gitconfig"
	@scripts/resolve-gh-token.sh --check >/dev/null 2>&1 || true

dev-up: preflight ## Build and start the dev sandbox (idempotent)
	@HOST_UID=$$(id -u) HOST_GID=$$(id -g) \
	  GH_TOKEN=$$(scripts/resolve-gh-token.sh 2>/dev/null) \
	  GITHUB_TOKEN=$$(scripts/resolve-gh-token.sh 2>/dev/null) \
	  $(COMPOSE) up -d --build
	@echo "[sandbox] up — Vite on http://localhost:$${HOST_PORT:-5173} (make dev-log for output)"

dev-down: ## Stop the dev sandbox
	@$(COMPOSE) down

dev-log: ## Follow the dev sandbox logs
	@$(COMPOSE) logs -f dev

dev-build: preflight ## Rebuild the dev sandbox image
	@$(COMPOSE) build

dev-restart: ## Restart the dev container (e.g. after `make opencode-upgrade`)
	@$(COMPOSE) restart dev

reset: ## Stop the dev sandbox and drop its containers
	@$(COMPOSE) down -v

shell: dev-shell
opencode: dev-opencode
opencode-auto: dev-opencode-auto

dev-shell: preflight ## Open a shell inside the dev sandbox
	@scripts/open-in-sandbox.sh

dev-opencode: preflight ## Run opencode inside the dev sandbox
	@scripts/ensure-sandbox-running.sh >/dev/null
	@if [ -t 0 ]; then \
	  $(COMPOSE) exec -it dev zsh -lc "cd /workspace && opencode $(OPENCODE_ARGS)"; \
	else \
	  $(COMPOSE) exec -T dev zsh -lc "cd /workspace && opencode $(OPENCODE_ARGS)"; \
	fi

# Same recipe, with --auto: auto-approve permissions that are not explicitly
# denied (every secret-file deny rule still applies).
dev-opencode-auto: OPENCODE_ARGS = --auto
dev-opencode-auto: dev-opencode

# The host owns the opencode binary; the sandbox mounts it read-only, so it can
# only be upgraded here, on the host. A *file* bind mount pins the inode, so a
# running sandbox keeps the old binary until it restarts — this restarts it.
opencode-version: ## Print the host opencode version
	@command -v opencode >/dev/null 2>&1 || { echo "ERROR: opencode not on PATH — install it from $(OPENCODE_INSTALL_URL)" >&2; exit 1; }
	@opencode --version

opencode-upgrade: ## Upgrade host opencode and restart the sandbox
	@command -v opencode >/dev/null 2>&1 || { echo "ERROR: opencode not on PATH — install it from $(OPENCODE_INSTALL_URL)" >&2; exit 1; }
	@echo "opencode before: $$(opencode --version 2>/dev/null || echo unknown)"
	@opencode upgrade </dev/null || { echo "opencode upgrade unavailable — falling back to the install script"; curl -fsSL $(OPENCODE_INSTALL_URL) | bash; }
	@echo "opencode after:  $$(opencode --version 2>/dev/null || echo unknown)"
	@if [ -n "$$($(COMPOSE) ps -q dev 2>/dev/null)" ]; then \
	  echo "restarting the dev sandbox so the bind-mounted binary refreshes..."; \
	  $(COMPOSE) restart dev; \
	else \
	  echo "dev sandbox not running — nothing to refresh"; \
	fi
