import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export function expiredBackupKeys(payload, prefix, limit) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Retention limit must be a positive integer.');
  }
  if (!/^backups\/(daily|weekly|monthly)\/$/u.test(prefix)) {
    throw new Error('Retention prefix is not an approved backup tier.');
  }

  const contents = Array.isArray(payload?.Contents) ? payload.Contents : [];
  const backups = contents
    .filter(
      (object) =>
        typeof object?.Key === 'string' &&
        object.Key.startsWith(prefix) &&
        object.Key.endsWith('.dump.enc') &&
        !object.Key.includes('\n'),
    )
    .map((object) => ({
      key: object.Key,
      modified: Date.parse(String(object.LastModified ?? '')),
    }))
    .filter((object) => Number.isFinite(object.modified))
    .sort(
      (left, right) =>
        right.modified - left.modified || right.key.localeCompare(left.key),
    );

  return backups.slice(limit).flatMap(({ key }) => [key, `${key}.sha256`]);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [inputPath, prefix, rawLimit] = process.argv.slice(2);
  if (!inputPath || !prefix || !rawLimit) {
    throw new Error('Usage: retention.mjs <r2-list.json> <prefix> <limit>');
  }
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  process.stdout.write(
    `${expiredBackupKeys(payload, prefix, Number(rawLimit)).join('\n')}\n`,
  );
}
