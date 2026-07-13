## Security

- **Server key isolation**: API Access keys (Bearer) live only in server code and
  server-side environment variables. They must never appear in browser bundles,
  mobile apps, `public/` assets, client components, or committed files.
- **No hardcoded secrets**: read keys and signing secrets from environment
  variables. Never inline a literal `adn_...` key, `Bearer` token, or signing
  secret in source.
- **Signing secret stays server/edge-side**: URL Signing is done on your server or
  in an edge worker; the secret is never sent to the client.
- **Least privilege on the client**: use resource-scoped Client-Side keys and
  short-lived, per-listener play sessions.

See `references/security.md` in the Skill.
