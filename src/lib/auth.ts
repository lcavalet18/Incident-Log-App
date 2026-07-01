import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

export async function getCurrentUserAndProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return { user, profile: profile as Profile | null };
}

export function isStaff(profile: Pick<Profile, 'role'> | null) {
  return profile?.role === 'admin' || profile?.role === 'supervisor';
}

/** Redirects non-staff users away from admin/supervisor-only pages. */
export async function requireStaff(locale: string) {
  const { profile } = await getCurrentUserAndProfile();
  if (!isStaff(profile)) {
    redirect({ href: '/incidents', locale });
  }
  return profile!;
}
