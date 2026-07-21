import { readFile } from 'node:fs/promises';

const hostedClientMetadata =
  /^[ ]{2}\/\/ Allows to automatically instantiate createClient with right options\n[ ]{2}\/\/ instead of createClient<Database, \{ PostgrestVersion: 'XX' \}>\(URL, KEY\)\n[ ]{2}__InternalSupabase: \{\n[ ]{4}PostgrestVersion: "[^"]+"\n[ ]{2}\}\n/mu;

export function typeSchemaProjection(source) {
  return source.replace(hostedClientMetadata, '').replace(/\n+$/u, '\n');
}

export function verifyHostedDatabaseTypes(committedTypes, hostedTypes) {
  if (
    typeSchemaProjection(committedTypes) !== typeSchemaProjection(hostedTypes)
  ) {
    throw new Error(
      'Hosted database type schema differs from the committed migration-generated types.',
    );
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const [committedPath, hostedPath] = process.argv.slice(2);

  if (!committedPath || !hostedPath) {
    throw new Error(
      'Usage: node scripts/verify-hosted-database-types.mjs <committed-types> <hosted-types>',
    );
  }

  verifyHostedDatabaseTypes(
    await readFile(committedPath, 'utf8'),
    await readFile(hostedPath, 'utf8'),
  );
}
