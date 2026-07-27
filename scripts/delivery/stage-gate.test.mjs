import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { assertStageAllowed, completeStage } from './stage-gate.mjs';

const statePaths = [];

afterEach(() => {
  for (const statePath of statePaths.splice(0)) {
    fs.rmSync(path.dirname(statePath), { recursive: true, force: true });
  }
});

function newStatePath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'delivery-gate-'));
  const statePath = path.join(directory, 'state.json');
  statePaths.push(statePath);
  return statePath;
}

describe('delivery stage gate', () => {
  it('permits only the approved migration to live-smoke order', () => {
    const state = newStatePath();

    assertStageAllowed(state, 'migrations');
    completeStage(state, 'migrations');
    completeStage(state, 'functions');
    completeStage(state, 'pre_frontend_smoke');
    completeStage(state, 'frontend');
    completeStage(state, 'live_smoke');

    expect(JSON.parse(fs.readFileSync(state, 'utf8')).completed).toEqual([
      'migrations',
      'functions',
      'pre_frontend_smoke',
      'frontend',
      'live_smoke',
    ]);
  });

  it('demonstrates a failed migration cannot continue to Functions or frontend', () => {
    const state = newStatePath();

    assertStageAllowed(state, 'migrations');
    // A failed migration never completes the stage.
    expect(() => assertStageAllowed(state, 'functions')).toThrow(
      /incomplete: migrations/u,
    );
    expect(() => assertStageAllowed(state, 'frontend')).toThrow(
      /migrations, functions, pre_frontend_smoke/u,
    );
  });
});
