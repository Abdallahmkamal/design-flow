import { describe, expect, it } from 'vitest';

import { expiredBackupKeys } from './retention.mjs';

describe('expiredBackupKeys', () => {
  it('keeps the newest tier artifacts and expires encrypted/checksum pairs', () => {
    const payload = {
      Contents: Array.from({ length: 9 }, (_, index) => ({
        Key: `backups/daily/design-flow_scheduled_202607${String(index + 1).padStart(2, '0')}T010000Z.dump.enc`,
        LastModified: `2026-07-${String(index + 1).padStart(2, '0')}T01:00:00Z`,
      })),
    };

    expect(expiredBackupKeys(payload, 'backups/daily/', 7)).toEqual([
      'backups/daily/design-flow_scheduled_20260702T010000Z.dump.enc',
      'backups/daily/design-flow_scheduled_20260702T010000Z.dump.enc.sha256',
      'backups/daily/design-flow_scheduled_20260701T010000Z.dump.enc',
      'backups/daily/design-flow_scheduled_20260701T010000Z.dump.enc.sha256',
    ]);
  });

  it('rejects an unapproved prefix or invalid limit', () => {
    expect(() => expiredBackupKeys({}, 'customer-data/', 7)).toThrow(
      /approved backup tier/u,
    );
    expect(() => expiredBackupKeys({}, 'backups/monthly/', 0)).toThrow(
      /positive integer/u,
    );
  });
});
