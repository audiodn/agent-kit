# AGENTS.md — @audiodn/agent-kit

Agent guide for working on the Agent Kit itself (this is dogfooding; the kit
also installs a similar file into user projects).

## What this repo is

An independent, published CLI (`@audiodn/agent-kit`) that installs AudioDN
coding-agent guidance into other repos and validates AudioDN integrations. It is
git-ignored inside the AudioDN monorepo and has its own git history, CI, and npm
release. The monorepo must never import from it.

## Layout

- `src/` — TypeScript CLI, compiled to `dist/` (ESM, Node >=18).
  - `cli.ts` — entry + arg parsing; `commands/` — `init`/`validate`/`uninstall`/`list`.
  - `core/` — `formats` (what to install where), `merge` (managed-block engine),
    `report`, `render`, `paths`.
- `assets/` — runtime data, shipped in the npm package:
  - `content/instructions.md` (+ `partials/`) — short managed-block prose for
    AGENTS.md / CLAUDE.md / Copilot / Cursor (must stay aligned with the skill).
  - `skill/` — portable Skill payload **copied from ai-plugin** via
    `npm run sync:skill`. Do not maintain a second product essay here.
  - `snapshots/` — bundled OpenAPI + llms-full + `sources.json`.
- `scripts/sync-from-plugin.mjs` — refresh `assets/skill` from ai-plugin.
- `scripts/sync-canonical.mjs` — refresh OpenAPI snapshots from the public site.
- `test/` — vitest.

## Invariants

- Never write real secrets into any generated file or template. Use env-var
  names and placeholders only. `test/no-secrets.test.ts` enforces this.
- Installs must stay merge-safe and idempotent. Any change to the merge engine
  must keep `test/merge.test.ts` and `test/idempotent.test.ts` green.
- Product truth for the Skill is **ai-plugin**. Run `npm run sync:skill` after
  skill changes; do not hand-edit `assets/skill/` independently.
- Managed-block prose (`assets/content/`) must not claim loudness normalization
  or say client keys are “web components only.”
- Endpoint allow-list for the validator is
  `assets/skill/scripts/known-endpoints.json` (from the plugin / OpenAPI).

## Verify

```bash
npm run lint    # tsc --noEmit
npm test        # vitest
npm run build && npm run smoke
```
