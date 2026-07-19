import { z } from 'zod';

const localSupabaseHostnames = new Set(['127.0.0.1', 'localhost']);

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLocalSupabaseUrl(value: string): boolean {
  const url = parseUrl(value);

  return url !== null && localSupabaseHostnames.has(url.hostname);
}

function hasAllowedProtocol(value: string): boolean {
  const url = parseUrl(value);

  return (
    url !== null &&
    (url.protocol === 'https:' ||
      (url.protocol === 'http:' && localSupabaseHostnames.has(url.hostname)))
  );
}

const publicEnvironmentSchema = z
  .object({
    VITE_APP_ENV: z.enum(['local', 'test', 'preview', 'staging', 'production']),
    VITE_SUPABASE_URL: z.url().refine(hasAllowedProtocol, {
      message: 'Use HTTPS except for the local Supabase address.',
    }),
    VITE_SUPABASE_PUBLISHABLE_KEY: z
      .string()
      .min(1, 'A Supabase publishable key is required.')
      .refine(
        (value) =>
          !value.startsWith('sb_secret_') &&
          !value.toLowerCase().includes('service_role'),
        {
          message:
            'A server-held Supabase secret must never be exposed to Vite.',
        },
      ),
  })
  .superRefine((environment, context) => {
    const isLocalUrl = isLocalSupabaseUrl(environment.VITE_SUPABASE_URL);

    if (environment.VITE_APP_ENV !== 'local' && isLocalUrl) {
      context.addIssue({
        code: 'custom',
        path: ['VITE_SUPABASE_URL'],
        message:
          'Test, preview, staging, and production builds cannot use a local Supabase URL.',
      });
    }

    if (environment.VITE_APP_ENV === 'local' && !isLocalUrl) {
      context.addIssue({
        code: 'custom',
        path: ['VITE_SUPABASE_URL'],
        message: 'Local development must use local Supabase.',
      });
    }
  });

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export function parsePublicEnvironment(
  source: Record<string, unknown>,
): PublicEnvironment {
  return publicEnvironmentSchema.parse(source);
}

let cachedEnvironment: PublicEnvironment | undefined;

export function getPublicEnvironment(): PublicEnvironment {
  cachedEnvironment ??= parsePublicEnvironment(import.meta.env);
  return cachedEnvironment;
}
