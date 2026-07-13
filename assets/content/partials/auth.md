## Authentication

AudioDN uses three credential types:

- **API Access key** (`Bearer` token): full server-side access. Server-only.
  Used to create upload sessions, read track status, and create play sessions.
- **Client-Side keys** (Player / Uploader): scoped keys safe to ship in a
  browser or app for the web components only.
- **Session IDs as capability tokens**: some endpoints are authorized by a
  session ID instead of a Bearer token and take **no** Authorization header:
  - `GET /v1/upload_session/{id}`
  - `POST /v1/upload/{upload_session_id}/track`
  - `GET /v1/play/{play_session_id}/{play_track_id}`
  - `GET /v1/play/{play_session_id}/{play_track_id}/{variant_index}/download`

Rule: server code holds the Bearer key; the client only ever receives a session
ID or a finished signed URL. See `references/authentication.md` in the Skill.
