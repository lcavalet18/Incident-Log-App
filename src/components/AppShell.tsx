import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { LanguageToggle } from './LanguageToggle';
import { LogoutButton } from './LogoutButton';
import { SyncStatusBadge } from './SyncStatusBadge';
import { NavLinks } from './NavLinks';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations('common');

  if (!user) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  const role = profile?.role ?? 'invigilator';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="text-base font-bold text-brand-700">{t('appName')}</span>
            <NavLinks role={role} />
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusBadge />
            <LanguageToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
