'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const t = useTranslations('common');
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-1 py-1.5 text-[13px] font-semibold text-muted hover:text-brand-600"
    >
      {t('logout')}
    </button>
  );
}
