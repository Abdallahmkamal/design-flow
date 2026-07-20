import {
  createSupabaseGateway,
  type SupabaseGateway,
} from './supabaseGateway.ts';

export function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required Edge Function environment: ${name}`);
  }

  return value;
}

export interface RuntimeDependencies {
  gateway: SupabaseGateway;
  allowedOrigins: string[];
}

export function optionalDefaultKeyEnvironment(name: string): string | null {
  const serialized = Deno.env.get(name);

  if (!serialized) {
    return null;
  }

  let keys: unknown;

  try {
    keys = JSON.parse(serialized);
  } catch {
    throw new Error(`Invalid Edge Function key dictionary: ${name}`);
  }

  if (
    !keys ||
    typeof keys !== 'object' ||
    !('default' in keys) ||
    typeof keys.default !== 'string' ||
    !keys.default
  ) {
    throw new Error(`Missing default Edge Function key: ${name}`);
  }

  return keys.default;
}

export function createRuntimeDependencies(): RuntimeDependencies {
  const supabaseUrl = requiredEnvironment('SUPABASE_URL');
  const publishableKey =
    optionalDefaultKeyEnvironment('SUPABASE_PUBLISHABLE_KEYS') ??
      Deno.env.get('SUPABASE_ANON_KEY') ??
      requiredEnvironment('SUPABASE_PUBLISHABLE_KEY');
  const serverKey = optionalDefaultKeyEnvironment('SUPABASE_SECRET_KEYS') ??
    requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY');
  const allowedOrigins = requiredEnvironment('DESIGN_FLOW_ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    gateway: createSupabaseGateway({
      supabaseUrl,
      publishableKey,
      serverKey,
    }),
    allowedOrigins,
  };
}
