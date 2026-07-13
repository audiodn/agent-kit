import { describe, expect, it } from 'vitest';
import { buildGuidanceBody } from '../src/core/render.js';

describe('canonical guidance content', () => {
  const body = buildGuidanceBody();

  it('expands the partials placeholder', () => {
    expect(body).not.toContain('{{PARTIALS}}');
  });

  it.each([
    ['server-key boundary', /never put server api credentials/i],
    ['no invented endpoints', /never invent endpoints/i],
    ['verify against OpenAPI', /audiodeliverynetwork\.com\/openapi\.json/],
    ['per-track upload requirement', /track_upload\.upload_url/],
    ['creating a session is not the whole flow', /creating an upload session is not the whole/i],
    ['readiness before playback', /track_status_id === 'ready'|processing readiness/i],
    ['compatibility', /preserve existing api compatibility/i],
    ['correct API host', /api\.audiodelivery\.net\/v1/],
  ])('includes required guidance: %s', (_label, re) => {
    expect(body).toMatch(re);
  });
});
