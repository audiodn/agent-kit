import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mkTmp } from './helpers.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const validatorPath = join(HERE, '..', 'assets', 'skill', 'scripts', 'validate.mjs');
const { runValidation } = await import(validatorPath);

function project(files: Record<string, string>): string {
  const cwd = mkTmp();
  for (const [rel, content] of Object.entries(files)) {
    const full = join(cwd, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return cwd;
}

function rules(cwd: string): string[] {
  return runValidation(cwd, {}).findings.map((f: { rule: string }) => f.rule);
}

describe('validator rules', () => {
  it('server-key-in-client', () => {
    const cwd = project({
      'app/page.tsx': "'use client';\nconst k = process.env.ADN_API_KEY;\nconsole.log(k);\n",
    });
    expect(rules(cwd)).toContain('server-key-in-client');
  });

  it('invented-endpoint', () => {
    const cwd = project({
      'server.js': "fetch('https://api.audiodelivery.net/v1/tracks');\n",
    });
    expect(rules(cwd)).toContain('invented-endpoint');
  });

  it('missing-per-track-request', () => {
    const cwd = project({
      'server.js': "fetch('https://api.audiodelivery.net/v1/upload_session', { method: 'POST' });\n",
    });
    expect(rules(cwd)).toContain('missing-per-track-request');
  });

  it('upload-url-treated-permanent', () => {
    const cwd = project({
      'store.js': "localStorage.setItem('u', track_upload.upload_url);\n",
    });
    expect(rules(cwd)).toContain('upload-url-treated-permanent');
  });

  it('playback-before-ready', () => {
    const cwd = project({
      'play.js': 'createPlaySession(trackId);\nel.play();\n',
    });
    expect(rules(cwd)).toContain('playback-before-ready');
  });

  it('hardcoded-secret', () => {
    const cwd = project({
      'secret.js': "const key = 'adn_api_1234567890';\n",
    });
    expect(rules(cwd)).toContain('hardcoded-secret');
  });

  it('incorrect-api-origin', () => {
    const cwd = project({
      'server.js': "fetch('https://audiodeliverynetwork.com/v1/track');\n",
    });
    expect(rules(cwd)).toContain('incorrect-api-origin');
  });

  it('obsolete-doc-url', () => {
    const cwd = project({
      'body.js': 'const body = { ttl_seconds: 60 };\n',
    });
    expect(rules(cwd)).toContain('obsolete-doc-url');
  });
});

describe('validator clean pass + config', () => {
  const cleanFiles = {
    'server.mjs': [
      "const API = 'https://api.audiodelivery.net/v1';",
      'export async function createSession() {',
      '  const r = await fetch(`${API}/upload_session`, { method: "POST", headers: { Authorization: `Bearer ${process.env.ADN_API_KEY}` } });',
      '  return r.json();',
      '}',
      'export async function trackStatus(id) {',
      '  const r = await fetch(`${API}/track/${id}`, { headers: { Authorization: `Bearer ${process.env.ADN_API_KEY}` } });',
      '  const b = await r.json();',
      '  return b.track.track_status_id;',
      '}',
    ].join('\n'),
    'client.mjs': [
      'export async function upload(file, uploadSessionId) {',
      '  const res = await fetch(`https://api.audiodelivery.net/v1/upload/${uploadSessionId}/track`, { method: "POST", body: JSON.stringify({ file_name: file.name }) });',
      '  const { track_upload } = await res.json();',
      '  await fetch(track_upload.upload_url, { method: track_upload.method, body: file });',
      '}',
    ].join('\n'),
  };

  it('a correct integration produces no findings', () => {
    const cwd = project(cleanFiles);
    const result = runValidation(cwd, {});
    expect(result.findings).toEqual([]);
    expect(result.errorCount).toBe(0);
  });

  it('respects .audiodn-validate.json ignore list', () => {
    const cwd = project({
      'secret.js': "const key = 'adn_api_1234567890';\n",
      '.audiodn-validate.json': JSON.stringify({ ignore: ['hardcoded-secret'] }),
    });
    const result = runValidation(cwd, {});
    expect(result.findings.map((f: { rule: string }) => f.rule)).not.toContain('hardcoded-secret');
  });

  it('respects inline audiodn-validate-ignore', () => {
    const cwd = project({
      'secret.js': "const key = 'adn_api_1234567890'; // audiodn-validate-ignore\n",
    });
    expect(rules(cwd)).not.toContain('hardcoded-secret');
  });
});
