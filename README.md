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
- `.agents/skills/audiodn/` — a portable Skill (references, framework templates, and a validator)

Kit-owned content lives inside a managed block:

```
<!-- AUDIODN:BEGIN v0.1.0 (managed by @audiodn/agent-kit — do not edit inside) -->
...
<!-- AUDIODN:END -->
```

Anything outside that block is yours and is preserved.

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
is ready, hardcoded secrets, incorrect API origin, and obsolete documentation
URLs. See [`assets/skill/references/security.md`](assets/skill/references/security.md).

## Canonical sources

Guidance and the bundled OpenAPI snapshot derive from the public AudioDN docs
(`https://audiodeliverynetwork.com/openapi.json`, `/llms-full.txt`). The snapshot
is refreshed by `npm run sync` and pinned in
[`assets/snapshots/sources.json`](assets/snapshots/sources.json). This repository
never depends on the AudioDN monorepo; it only reads the public site.

## Development

```bash
npm install
npm run build     # tsc -> dist
npm test          # vitest
npm run smoke     # build + init into a temp dir + validate
```

## License

MIT
