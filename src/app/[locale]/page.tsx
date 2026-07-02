import { redirect } from '@/i18n/navigation';
import { getCurrentUserAndProfile, isStaff } from '@/lib/auth';

export default async function RootPage({ params: { locale } }: { params: { locale: string } }) {
  const { profile } = await getCurrentUserAndProfile();
  redirect({ href: isStaff(profile) ? '/audit' : '/incidents', locale });
}
