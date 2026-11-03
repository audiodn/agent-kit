# @audiodn/agent-kit

Install AudioDN-specific guidance for AI coding agents into any repository, and
validate AudioDN integrations for common mistakes.

```bash
npx @audiodn/agent-kit init
```

## What it installs

`init` writes guidance in the formats you select. All installs are **merge-safe**
(they never clobber your own content) and **idempotent** (re-running reports
`unchanged`):

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.cursor/rules/audiodn.mdc`
- `.agents/skills/audiodn/` — the portable Skill (same content as `@audiodn/ai-plugin`)

Kit-owned content lives inside a managed block:

```
<!-- AUDIODN:BEGIN v0.2.0 (managed by @audiodn/agent-kit — do not edit inside) -->
...
<!-- AUDIODN:END -->
```

Anything outside that block is yours and is preserved.

The Skill payload is **synced from `ai-plugin`** (`npm run sync:skill`). Do not
hand-edit `assets/skill/` as a second product voice. Managed-block prose in
`assets/content/` is a short pointer that must stay aligned with that skill.

## Commands

```bash
npx @audiodn/agent-kit init                 # interactive
npx @audiodn/agent-kit init --yes           # non-interactive (all formats)
npx @audiodn/agent-kit init --formats agents,cursor,skill
npx @audiodn/agent-kit init --dry-run       # preview, no writes
npx @audiodn/agent-kit init --force         # overwrite unmanaged conflicts

npx @audiodn/agent-kit validate [path]      # scan a project for AudioDN mistakes
npx @audiodn/agent-kit validate . --json

npx @audiodn/agent-kit uninstall            # remove managed blocks / kit files only
npx @audiodn/agent-kit list                 # show formats + bundled doc versions
```

## What the validator catches

Server API key exposed to client code, invented endpoints, a missing per-track
upload request, treating an upload URL as permanent, playback before processing
is ready, hardcoded secrets, incorrect API origin, mixed component credentials,
and obsolete documentation URLs. Implementation:
`assets/skill/scripts/validate-audiodn-project.mjs` (from ai-plugin), with a
`validate.mjs` shim for older paths.

## Canonical sources

- Skill + references: synced from `../ai-plugin/src/skills/audiodn`
- OpenAPI snapshot: `npm run sync` from `https://audiodeliverynetwork.com/openapi.json`
  (or local mono via `AUDIODN_LOCAL_PUBLIC`)

If you also install the Cursor/Claude/Codex AudioDN plugin in the same repo,
prefer one skill source — this kit and the plugin ship the same skill after
`sync:skill`.

## Development

```bash
npm install
npm run sync:skill   # copy ai-plugin skill into assets/skill
npm run build        # tsc -> dist
npm test             # vitest
npm run smoke        # build + init into a temp dir + validate
```

## License

MIT
