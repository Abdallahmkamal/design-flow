/**
 * Temporary empty shell.
 *
 * This file is replaced by `npm run db:types` after the complete first
 * migration is available and the local database has been reset. Never add
 * hand-authored application tables here.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
