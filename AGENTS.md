## Agent skills

### Issue tracker

GitHub Issues (`wiggo-dev/wilab`); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical names: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### E2E tests

Browser smoke tests live in `e2e/` and run with `pnpm test:e2e`. Playwright starts a **separate** dev server on port **3001** with an isolated temp `WILAB_DATA_DIR` — it never touches `./data/config.json` used by `pnpm dev` on port 3000. First run may require `pnpm exec playwright install chromium`.
