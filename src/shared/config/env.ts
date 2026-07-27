import { z } from 'zod';

const loopbackSupabaseHostnames = new Set(['127.0.0.1', 'localhost']);

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isPrivateIpv4Hostname(hostname: string): boolean {
  const octets = hostname.split('.').map(Number);

  if (
    octets.length !== 4 ||
    octets.some(
      (octet, index) =>
        !Number.isInteger(octet) ||
        octet < 0 ||
        octet > 255 ||
        String(octet) !== hostname.split('.')[index],
    )
  ) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 10 ||
    (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isLocalSupabaseHostname(hostname: string): boolean {
  return (
    loopbackSupabaseHostnames.has(hostname) || isPrivateIpv4Hostname(hostname)
  );
}

function isLocalSupabaseUrl(value: string): boolean {
  const url = parseUrl(value);

  return url !== null && isLocalSupabaseHostname(url.hostname);
}

function hasAllowedProtocol(value: string): boolean {
  const url = parseUrl(value);

  return (
    url !== null &&
    (url.protocol === 'https:' ||
      (url.protocol === 'http:' && isLocalSupabaseHostname(url.hostname)))
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
