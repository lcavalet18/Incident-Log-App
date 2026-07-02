import { redirect } from '@/i18n/navigation';

// The dashboard's stat cards + table were merged into /audit to match the
// current design. Kept as a redirect so old links/bookmarks still resolve.
export default function DashboardRedirectPage({ params: { locale } }: { params: { locale: string } }) {
  redirect({ href: '/audit', locale });
}
