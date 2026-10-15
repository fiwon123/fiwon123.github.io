# Portfolio — React + TypeScript + Vite static site.
#
# This repo has no Docker/dev-sandbox layer: it is a single static frontend
# app, built with Vite and deployed to GitHub Pages on release.

.DEFAULT_GOAL := help

.PHONY: help check fmt lint typecheck test dev build preview clean

help: ## List available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

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

dev: ## Start the dev server
	npm run dev

build: ## Build the production bundle to dist/
	npm run build

preview: ## Preview the production build locally
	npm run preview

clean: ## Remove build output and tool caches
	rm -rf dist node_modules/.tmp node_modules/.vite
