'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales } from '@/i18n/config';
import { cn } from '@/lib/utils';

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
    <div className="flex overflow-hidden rounded-md border border-border" aria-label={t('language')}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          className={cn(
            'px-[11px] py-[6px] text-[12.5px] font-semibold uppercase',
            l === locale ? 'bg-brand-600 text-white' : 'bg-surface text-muted'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
