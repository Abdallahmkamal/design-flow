import { getSupabaseClient } from '../../shared/supabase/client';
import type { Database } from '../../shared/supabase/database.types';

type TeamDirectoryRow = Database['public']['Views']['team_directory']['Row'];

export interface TeamMember {
  id: string;
  displayName: string;
  positionCode: string;
  positionLabel: string;
  isAdmin: boolean;
  reportsToDisplayName: string | null;
}

export async function getTeamDirectory(): Promise<TeamMember[]> {
  const { data, error } = await getSupabaseClient()
    .from('team_directory')
    .select('*')
    .order('display_name');

  if (error) {
    throw error;
  }

  return ((data ?? []) as TeamDirectoryRow[]).flatMap((row) => {
    if (
      !row.id ||
      !row.display_name ||
      !row.position_code ||
      !row.position_label ||
      row.is_admin === null
    ) {
      return [];
    }

    return [
      {
        id: row.id,
        displayName: row.display_name,
        positionCode: row.position_code,
        positionLabel: row.position_label,
        isAdmin: row.is_admin,
        reportsToDisplayName: row.reports_to_display_name,
      },
    ];
  });
}
