import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function workflow(name) {
  return fs.readFileSync(
    path.join(process.cwd(), '.github', 'workflows', name),
    'utf8',
  );
}

function expectInOrder(source, labels) {
  let prior = -1;
  for (const label of labels) {
    const current = source.indexOf(label);
    expect(current, `missing workflow marker: ${label}`).toBeGreaterThan(prior);
    prior = current;
  }
}

describe('production delivery workflows', () => {
  it('requires verified offline backup evidence and preserves the contracted production stage order', () => {
    const production = workflow('production.yml');

    expect(production).toContain('workflow_dispatch:');
    expect(production).toContain('BACKUP_VERIFIED_OFFLINE');
    expect(production).toContain('backup_sha256:');
    expect(production).toContain(
      '[[ "$BACKUP_ARTIFACT_LABEL" =~ ^[a-z0-9][a-z0-9_-]{0,63}$ ]]',
    );
    expect(production).toContain('[[ "$BACKUP_SHA256" =~ ^[a-f0-9]{64}$ ]]');
    expect(production).toContain('needs: authorize');
    expect(production).not.toMatch(/R2_|backup\.yml/iu);
    expectInOrder(production, [
      'Preview pending production migrations',
      'Apply forward production migrations',
      'Verify migration history and generated schema',
      'Deploy Edge Functions',
      'Verify Auth, RLS, and Function origin before frontend',
      'Build production frontend',
      'Deploy Cloudflare Pages production',
      'Verify live production and record success',
    ]);
  });

  it('keeps known-good redeploy free of database mutation and orders live verification last', () => {
    const redeploy = workflow('redeploy-known-good.yml');

    expect(redeploy).not.toMatch(
      /supabase db push|pg_restore|scripts\/backups\/restore/iu,
    );
    expect(redeploy).not.toContain('--project-name=$PAGES_PROJECT');
    expect(redeploy).toContain('--project-name=${{ env.PAGES_PROJECT }}');
    expect(redeploy).toContain('git merge-base --is-ancestor');
    expectInOrder(redeploy, [
      'Redeploy known-good Edge Functions',
      'Verify backend before frontend redeploy',
      'Build known-good frontend',
      'Redeploy known-good Cloudflare Pages frontend',
      'Verify known-good live release',
    ]);
  });

  it('adds stage gates to the existing staging delivery', () => {
    const staging = workflow('ci.yml');

    expect(staging).toContain('rehearse_failed_migration');
    expect(staging).toContain('intentional Phase 7 failed migration rehearsal');
    expectInOrder(staging, [
      'Prepare synthetic failed migration rehearsal',
      'Preview pending staging migrations',
      'Apply staging migrations',
      'Verify staging migration history and generated type schema',
      'Deploy account-lifecycle Edge Functions',
      'Verify staging backend before frontend delivery',
      'Build the staging frontend',
      'Deploy Cloudflare Pages staging',
      'Verify the live complete staging checkpoint',
    ]);
    expect(staging.match(/stage-gate\.mjs/gu)).toHaveLength(10);
  });
});
