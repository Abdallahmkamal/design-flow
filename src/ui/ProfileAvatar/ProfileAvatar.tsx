import { useQuery } from '@tanstack/react-query';

import { getSupabaseClient } from '../../shared/supabase/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  getAvatarToneClassName,
  getInitials,
} from '../primitives/avatar';
import { cn } from '../lib/cn';

const signedUrlSeconds = 60 * 60;

async function getSignedAvatarUrl(profileId: string) {
  const client = getSupabaseClient();
  const { data: profile, error } = await client
    .from('profiles')
    .select('avatar_path')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw error;
  if (!profile?.avatar_path) return null;
  const signed = await client.storage
    .from('profile-avatars')
    .createSignedUrl(profile.avatar_path, signedUrlSeconds);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}

export function ProfileAvatar({
  profileId,
  displayName,
  className,
  fallbackClassName,
  decorative = false,
  previewUrl,
}: {
  profileId: string;
  displayName: string;
  className?: string | undefined;
  fallbackClassName?: string | undefined;
  decorative?: boolean;
  previewUrl?: string | undefined;
}) {
  const avatar = useQuery({
    queryKey: ['profile-avatar', profileId],
    queryFn: () => getSignedAvatarUrl(profileId),
    staleTime: 45 * 60 * 1000,
    retry: 1,
    enabled: !previewUrl,
  });
  const imageUrl = previewUrl ?? avatar.data;

  return (
    <Avatar
      className={cn(getAvatarToneClassName(profileId), className)}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : displayName}
    >
      {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
      <AvatarFallback className={fallbackClassName}>
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
