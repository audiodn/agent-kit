## Authentication

AudioDN credentials:

- **API Access key** (`Bearer` token): full server-side access. Server-only.
  Used to create upload/play sessions, mint scoped keys, and manage resources.
  Created only in the dashboard.
- **Client-Side keys** (`player` / `uploader`): scoped keys safe to ship in a
  browser or app for web components **and** custom clients that call the
  session routes. Mint via `POST /v1/api_key` with an API Access key.
- **Inline Share key** (`share`): path credential for
  `GET /v1/stream/{track_id}/{share_key}` (exactly one variant). Also creatable
  via `POST /v1/api_key`.
- **URL Signing key**: HMAC secret for signed delivery URLs. Dashboard-only.
- **Session IDs as capability tokens**: some endpoints are authorized by a
  session ID instead of a Bearer token and take **no** Authorization header:
  - `GET /v1/upload_session/{id}`
  - `POST /v1/upload/{upload_session_id}/track`
  - `GET /v1/play_session/{play_session_id}`
  - `GET /v1/play/{play_session_id}/{play_track_id}`
  - `GET /v1/play/{play_session_id}/{play_track_id}/{variant_index}/download`

Rule: never ship an API Access key or URL Signing secret to a client. Do not set
both an `api-key` and a session ID on a component, and do not feed signed URLs to
the ADN Player. See `references/authentication.md` in the Skill.
