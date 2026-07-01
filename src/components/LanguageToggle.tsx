'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales } from '@/i18n/config';

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');

  function switchTo(nextLocale: string) {
    const segments = pathname.split('/');
    segments[1] = nextLocale;
    router.push(segments.join('/') || '/');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1" aria-label={t('language')}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          className={`rounded px-2 py-1 text-xs font-semibold uppercase ${
            l === locale ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
