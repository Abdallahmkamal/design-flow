import { z } from 'zod';

const publicEnvironmentSchema = z
  .object({
    VITE_APP_ENV: z.enum(['local', 'test', 'preview', 'staging', 'production']),
    VITE_SUPABASE_URL: z
      .url()
      .refine(
        (value) =>
          value.startsWith('https://') || value.startsWith('http://127.0.0.1'),
        {
          message: 'Use HTTPS except for the local Supabase address.',
        },
      ),
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
    const isLocalUrl =
      environment.VITE_SUPABASE_URL.includes('127.0.0.1') ||
      environment.VITE_SUPABASE_URL.includes('localhost');

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
