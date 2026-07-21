import { describe, expect, it } from 'vitest';

import {
  typeSchemaProjection,
  verifyHostedDatabaseTypes,
} from './verify-hosted-database-types.mjs';

const localTypes = 'export type Database = {\n  public: {}\n}\n';
const hostedTypes =
  'export type Database = {\n' +
  '  // Allows to automatically instantiate createClient with right options\n' +
  "  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)\n" +
  '  __InternalSupabase: {\n' +
  '    PostgrestVersion: "14.5"\n' +
  '  }\n' +
  '  public: {}\n' +
  '}\n\n';

describe('hosted database type verification', () => {
  it('compares the generated schema while ignoring hosted client metadata', () => {
    expect(typeSchemaProjection(hostedTypes)).toBe(localTypes);
    expect(() =>
      verifyHostedDatabaseTypes(localTypes, hostedTypes),
    ).not.toThrow();
  });

  it('rejects a hosted schema difference', () => {
    expect(() =>
      verifyHostedDatabaseTypes(
        localTypes,
        hostedTypes.replace('public: {}', 'private: {}'),
      ),
    ).toThrow('Hosted database type schema differs');
  });
});
