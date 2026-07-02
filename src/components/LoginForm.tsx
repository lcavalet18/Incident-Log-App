'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Logo } from '@/components/Logo';

export function LoginForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setError(t('error'));
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const isStaff = profile?.role === 'admin' || profile?.role === 'supervisor';
    const next = searchParams.get('next');
    router.push(next ?? (isStaff ? '/audit' : '/incidents'));
    router.refresh();
  }

  return (
    <div className="card">
      <div className="mb-6 flex justify-center">
        <Logo size="lg" />
      </div>
      <h1 className="mb-1 text-center text-xl font-bold text-ink">{t('title')}</h1>
      <p className="mb-6 text-center text-sm text-muted">{t('subtitle')}</p>

      {!isOnline && (
        <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{t('offlineWarning')}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            {t('emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            {t('passwordLabel')}
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-brand-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? tc('loading') : t('submit')}
        </button>
      </form>
    </div>
  );
}
