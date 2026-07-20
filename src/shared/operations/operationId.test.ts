import { describe, expect, it, vi } from 'vitest';

import { createOperationId } from './operationId';

describe('createOperationId', () => {
  it('uses native randomUUID when the browser provides it', () => {
    const randomUUID = vi.fn(() => '00000000-0000-4000-8000-000000000001');
    const cryptoSource = {
      randomUUID,
    } as unknown as Crypto;

    expect(createOperationId(cryptoSource)).toBe(
      '00000000-0000-4000-8000-000000000001',
    );
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it('creates an RFC 4122 version 4 UUID when randomUUID is unavailable', () => {
    const cryptoSource = {
      getRandomValues(array: Uint8Array) {
        array.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        return array;
      },
    } as unknown as Crypto;

    expect(createOperationId(cryptoSource)).toBe(
      '00010203-0405-4607-8809-0a0b0c0d0e0f',
    );
  });
});
