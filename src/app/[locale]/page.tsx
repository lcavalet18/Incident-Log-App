import { redirect } from '@/i18n/navigation';

export default async function RootPage({ params: { locale } }: { params: { locale: string } }) {
  redirect({ href: '/incidents/new', locale });
}
