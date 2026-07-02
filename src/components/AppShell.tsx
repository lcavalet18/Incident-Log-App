import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { LanguageToggle } from './LanguageToggle';
import { LogoutButton } from './LogoutButton';
import { SyncStatusBadge } from './SyncStatusBadge';
import { NavLinks } from './NavLinks';
import { Logo } from './Logo';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations('common');

  if (!user) {
    return <div className="min-h-screen bg-page">{children}</div>;
  }

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  const role = profile?.role ?? 'invigilator';

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-[22px] px-6 py-3">
          <div className="flex shrink-0 items-center gap-3">
            <Logo size="md" />
            <div className="leading-[1.15]">
              <div className="text-[15.5px] font-bold tracking-[-.01em] text-ink">{t('appName')}</div>
              <div className="text-[11.5px] font-medium text-muted">{t('tagline')}</div>
            </div>
          </div>

          <NavLinks role={role} />

          <div className="ms-auto flex items-center gap-4">
            <SyncStatusBadge />
            <LanguageToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-6 pb-[72px] pt-[34px]">{children}</main>
    </div>
  );
}
