import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const deliveryStages = [
  'migrations',
  'functions',
  'pre_frontend_smoke',
  'frontend',
  'live_smoke',
];

function completedStages(statePath) {
  if (!fs.existsSync(statePath)) return [];
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return Array.isArray(state.completed) ? state.completed : [];
}

export function assertStageAllowed(statePath, stage) {
  const index = deliveryStages.indexOf(stage);
  if (index < 0) throw new Error(`Unknown delivery stage: ${stage}`);

  const completed = completedStages(statePath);
  const missing = deliveryStages
    .slice(0, index)
    .filter((requiredStage) => !completed.includes(requiredStage));
  if (missing.length > 0) {
    throw new Error(
      `Delivery stage ${stage} is blocked; incomplete: ${missing.join(', ')}`,
    );
  }
}

export function completeStage(statePath, stage) {
  assertStageAllowed(statePath, stage);
  const completed = completedStages(statePath);
  if (!completed.includes(stage)) completed.push(stage);
  fs.writeFileSync(statePath, `${JSON.stringify({ completed })}\n`, {
    mode: 0o600,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [operation, statePath, stage] = process.argv.slice(2);
  if (!operation || !statePath || !stage) {
    throw new Error('Usage: stage-gate.mjs <assert|complete> <state> <stage>');
  }
  if (operation === 'assert') assertStageAllowed(statePath, stage);
  else if (operation === 'complete') completeStage(statePath, stage);
  else throw new Error(`Unknown stage-gate operation: ${operation}`);
}
