#!/usr/bin/env node
// AudioDN project validator — portable, dependency-free (Node 18+).
//
// Detects common AudioDN integration mistakes. Runnable standalone:
//   node .agents/skills/audiodn/scripts/validate.mjs [path]
// or via the kit:
//   npx @audiodn/agent-kit validate [path]
//
// Exit code is non-zero when any error-severity finding is present.
import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from 'node:fs';
import { dirname, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const API_HOST = 'api.audiodelivery.net';
const MARKETING_HOST = 'audiodeliverynetwork.com';

const SCAN_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte', '.astro',
  '.py', '.go', '.rb', '.java', '.kt', '.php', '.swift', '.dart', '.cs',
  '.json', '.env', '.yml', '.yaml',
]);
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage',
  '.turbo', '.wrangler', 'vendor', '.venv', '__pycache__',
  // Agent tooling / guidance, not application code under test. Skipping avoids
  // scanning this validator's own source (which contains the very patterns it detects).
  '.agents',
]);

// ---- endpoint truth -------------------------------------------------------

function loadKnownEndpoints() {
  try {
    const raw = readFileSync(join(HERE, 'known-endpoints.json'), 'utf8');
    return JSON.parse(raw).paths || [];
  } catch {
    return ['/v1/upload_session', '/v1/upload/{upload_session_id}/track', '/v1/track/{track_id}'];
  }
}

function normalizePath(p) {
  const clean = p.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean
    .split('/')
    .map((seg) => {
      if (!seg) return seg;
      if (/^\{.*\}$/.test(seg)) return '*'; // {param}
      if (/^:/.test(seg)) return '*'; // :param
      if (/\$\{.*\}/.test(seg)) return '*'; // ${expr}
      if (/[$`+]/.test(seg)) return '*'; // concatenation / template fragment
      if (/^[A-Z0-9_]+$/.test(seg) && seg.length >= 3) return '*'; // SESSION_ID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}/.test(seg)) return '*'; // uuid
      return seg;
    })
    .join('/');
}

// ---- config + ignores -----------------------------------------------------

function loadConfig(root) {
  const p = join(root, '.audiodn-validate.json');
  if (!existsSync(p)) return { ignore: [], ignoreFiles: [] };
  try {
    const cfg = JSON.parse(readFileSync(p, 'utf8'));
    return { ignore: cfg.ignore || [], ignoreFiles: cfg.ignoreFiles || [] };
  } catch {
    return { ignore: [], ignoreFiles: [] };
  }
}

// ---- file collection ------------------------------------------------------

function collectFiles(root) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!SKIP_DIRS.has(name)) walk(full);
      } else if (SCAN_EXT.has(extname(name)) || name === '.env') {
        if (st.size <= 2_000_000) out.push(full);
      }
    }
  };
  if (statSync(root).isDirectory()) walk(root);
  else out.push(root);
  return out;
}

function isClientFile(relPath, content) {
  const p = relPath.toLowerCase();
  if (/(^|\/)(public|static|assets|www)\//.test(p)) return true;
  if (/(^|\/)(ios|android|mobile|app-native|flutter)\//.test(p)) return true;
  if (/\.(vue|svelte|jsx|tsx)$/.test(p)) return true;
  if (/['"]use client['"]/.test(content)) return true;
  // Browser globals with no server markers.
  if (/\b(window|document|localStorage)\b/.test(content) && !/\b(process\.env|import\s+.*from\s+['"]node:)/.test(content)) {
    return true;
  }
  return false;
}

// ---- rules ----------------------------------------------------------------

const SECRET_LITERAL = /adn_[a-z]+_[A-Za-z0-9]{6,}/;
const BEARER_LITERAL = /Bearer\s+adn_[A-Za-z0-9_]{6,}/i;
const V1_URL = /\/v1\/[A-Za-z0-9_\-/{}:$.]+/g;
const HOST_V1 = /https?:\/\/([A-Za-z0-9.\-]+)\/v1\b/g;

const PLACEHOLDER = /(your|example|xxxx|placeholder|changeme|\.\.\.|<[^>]+>|env\.|process\.env|import\.meta\.env)/i;

function ruleFindings(file, relPath, content, known, config) {
  const findings = [];
  const lines = content.split('\n');
  const clientFile = isClientFile(relPath, content);
  const add = (rule, severity, lineIdx, message, remedy) => {
    if (config.ignore.includes(rule)) return;
    const raw = lineIdx >= 0 ? lines[lineIdx] : '';
    if (/audiodn-validate-ignore/.test(raw)) return;
    findings.push({ rule, severity, file: relPath, line: lineIdx + 1, message, remedy });
  };

  lines.forEach((line, i) => {
    // 6. hardcoded-secret
    if ((SECRET_LITERAL.test(line) || BEARER_LITERAL.test(line)) && !PLACEHOLDER.test(line)) {
      add('hardcoded-secret', 'error', i, 'Hardcoded AudioDN key/secret literal.', 'Read the key from an environment variable instead.');
    } else {
      const assign = line.match(/\b(signing[_-]?secret|api[_-]?key|secret|token)\b\s*[:=]\s*['"]([A-Za-z0-9_\-]{16,})['"]/i);
      if (assign && !PLACEHOLDER.test(line)) {
        add('hardcoded-secret', 'error', i, 'Hardcoded secret assigned inline.', 'Move the secret to an environment variable.');
      }
    }

    // 1. server-key-in-client
    if (clientFile && (/ADN_API_KEY/.test(line) || BEARER_LITERAL.test(line) || SECRET_LITERAL.test(line) || /Authorization\s*:\s*[`'"]?Bearer/i.test(line))) {
      add('server-key-in-client', 'error', i, 'Server API credential referenced in client-side code.', 'Move server API calls behind your backend; the browser must never hold a Bearer/API Access key.');
    }

    // 7. incorrect-api-origin
    let hm;
    HOST_V1.lastIndex = 0;
    while ((hm = HOST_V1.exec(line)) !== null) {
      const host = hm[1];
      if (host === MARKETING_HOST) {
        add('incorrect-api-origin', 'error', i, `Marketing host used as API origin (${host}/v1).`, `Use https://${API_HOST}/v1/ for API requests.`);
      } else if (host !== API_HOST) {
        add('incorrect-api-origin', 'error', i, `Unexpected API origin "${host}" for a /v1 request.`, `AudioDN's API host is ${API_HOST}.`);
      } else if (/^http:\/\//.test(hm[0])) {
        add('incorrect-api-origin', 'error', i, 'Insecure http:// used for the API.', 'Use https://.');
      }
    }

    // 2. invented-endpoint
    let m;
    V1_URL.lastIndex = 0;
    while ((m = V1_URL.exec(line)) !== null) {
      const raw = m[0].replace(/[.,'"`);]+$/, '');
      const norm = normalizePath(raw);
      if (!known.has(norm)) {
        add('invented-endpoint', 'error', i, `Unknown AudioDN endpoint "${raw}".`, 'Verify the path against https://audiodeliverynetwork.com/openapi.json — do not invent endpoints.');
      }
    }

    // 4. upload-url-treated-permanent
    if (/upload_url/.test(line) && /(localStorage|sessionStorage|INSERT\s+INTO|\.insert\(|\.save\(|\.update\(|prisma\.|db\.|writeFile|fs\.write|redis\.|cache\.set)/i.test(line)) {
      add('upload-url-treated-permanent', 'warn', i, 'Upload URL appears to be persisted/cached.', 'The per-track upload_url is short-lived and single-use; do not store it. Create a fresh track if it expires.');
    }

    // 8. obsolete-doc-url
    const OBSOLETE = [
      [/\/v1\/upload-session/, 'Use the underscore path /v1/upload_session.'],
      [/\/v1\/play-session/, 'Use the underscore path /v1/play_session.'],
      [/\bttl_seconds\b/, 'Use expires_in, not ttl_seconds.'],
      [/session\.url\b/, 'Upload sessions do not return a URL; create a per-track upload URL (track_upload.upload_url).'],
      [new RegExp(`${MARKETING_HOST.replace('.', '\\.')}/docs`), 'Docs live at https://audiodeliverynetwork.com/docs (marketing host), API at api.audiodelivery.net.'],
    ];
    for (const [re, remedy] of OBSOLETE) {
      if (re.test(line)) add('obsolete-doc-url', 'warn', i, 'Obsolete or incorrect AudioDN reference.', remedy);
    }
  });

  return findings;
}

// Project-level rules (need the whole codebase).
function projectFindings(scanned, config) {
  const findings = [];
  const anyText = scanned.map((s) => s.content).join('\n');
  const add = (rule, severity, file, message, remedy) => {
    if (config.ignore.includes(rule)) return;
    findings.push({ rule, severity, file, line: 0, message, remedy });
  };

  // 3. missing-per-track-request
  const createsSession = scanned.find((s) => /upload_session\b/.test(s.content) && /(POST|fetch|axios|\.post\(|method\s*:\s*['"]POST)/i.test(s.content));
  const createsTrack = /upload\/[^'"`\s]*\/track|track_upload|\/track['"`]/.test(anyText);
  if (createsSession && !createsTrack) {
    add('missing-per-track-request', 'warn', createsSession.rel, 'Creates an upload session but never creates a per-track upload URL.', 'After POST /v1/upload_session, call POST /v1/upload/{id}/track per file to get track_upload.upload_url, then PUT the bytes.');
  }

  // 5. playback-before-ready
  const doesPlayback = scanned.find((s) => /(play_session|<audio|\.play\(|audiodn-player|createPlaySession)/.test(s.content));
  const checksReady = /(track_status_id|['"]ready['"]|waitForReady|files_completed_at|webhook|status_changed)/.test(anyText);
  if (doesPlayback && !checksReady) {
    add('playback-before-ready', 'warn', doesPlayback.rel, 'Playback is set up without any processing-readiness check.', 'Gate playback on readiness: poll GET /v1/track/{id} until track_status_id === "ready", or use the Track Processing webhook.');
  }

  return findings;
}

// ---- public API -----------------------------------------------------------

export function runValidation(root, _opts = {}) {
  const known = new Set(loadKnownEndpoints().map(normalizePath));
  const config = loadConfig(root);
  const files = collectFiles(root).filter((f) => {
    const rel = relative(root, f).split('\\').join('/');
    return !config.ignoreFiles.some((pat) => rel.includes(pat));
  });

  const findings = [];
  const scanned = [];
  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const rel = relative(root, file).split('\\').join('/') || file;
    scanned.push({ rel, content });
    findings.push(...ruleFindings(file, rel, content, known, config));
  }
  findings.push(...projectFindings(scanned, config));

  const errorCount = findings.filter((f) => f.severity === 'error').length;
  const warnCount = findings.filter((f) => f.severity === 'warn').length;
  return { findings, errorCount, warnCount, filesScanned: scanned.length };
}

export function printFindings(result) {
  if (result.findings.length === 0) {
    console.log(`audiodn-validate: no issues found across ${result.filesScanned} file(s).`);
    return;
  }
  for (const f of result.findings) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`${f.severity.toUpperCase()}  ${loc}  [${f.rule}]`);
    console.log(`    ${f.message}`);
    if (f.remedy) console.log(`    -> ${f.remedy}`);
  }
  console.log(`\naudiodn-validate: ${result.errorCount} error(s), ${result.warnCount} warning(s) across ${result.filesScanned} file(s).`);
}

// CLI entry when run directly (symlink-robust — /tmp is a symlink on macOS).
function invokedDirectly() {
  try {
    return (
      Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  const target = process.argv[2] || '.';
  const json = process.argv.includes('--json');
  const result = runValidation(target, {});
  if (json) console.log(JSON.stringify(result, null, 2));
  else printFindings(result);
  process.exit(result.errorCount > 0 ? 1 : 0);
}
