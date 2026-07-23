# Changelog

All notable changes to `@audiodn/agent-kit` are documented here. This project
adheres to [Semantic Versioning](https://semver.org/).

## 0.1.1

- Point signed-delivery docs link at
  `/docs/integration/playback?option=signed-delivery` (retired path redirect).
- Clarify upload/play guidance: per-track upload URL creation after the upload
  session; keep `track.base_url` for signed delivery.
- Note the AudioDN MCP server (hosted or `npx @audiodn/mcp`) in instructions and
  the portable Skill as an alternative to raw HTTP.
- `validate`: skip `.agents` tooling directory to avoid self-scan false positives.
- Scope npm provenance to CI publishes; normalize repository URL.

## 0.1.0

- Initial release.
- `init` command: merge-safe installation of AudioDN coding-agent guidance in
  five formats (AGENTS.md, CLAUDE.md, `.github/copilot-instructions.md`,
  `.cursor/rules/audiodn.mdc`, `.agents/skills/audiodn/`).
- Interactive and non-interactive modes, `--dry-run`, `--force`, `--formats`.
- `validate` command: detects eight common AudioDN integration mistakes.
- `uninstall` and `list` commands.
- Portable AudioDN Skill payload with references, framework templates, and a
  standalone validation script.
- Bundled, versioned canonical documentation snapshots (OpenAPI + llms-full).
