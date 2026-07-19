import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getPublicEnvironment } from '../config/env';
import type { Database } from './database.types';

let browserClient: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const environment = getPublicEnvironment();

    browserClient = createClient<Database>(
      environment.VITE_SUPABASE_URL,
      environment.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    );
  }

  return browserClient;
}
