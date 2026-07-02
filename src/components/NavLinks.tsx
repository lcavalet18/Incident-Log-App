'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/incidents/new', key: 'newIncident' as const },
  { href: '/audit', key: 'audit' as const },
  { href: '/admin/codes', key: 'codeList' as const },
];

export function NavLinks() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav className="ms-2 flex gap-1">
      {LINKS.map((link) => {
        const active = pathname?.includes(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-[7px] px-[15px] py-2 text-sm font-semibold transition-colors',
              active ? 'bg-accent-tint text-brand-600' : 'text-secondary hover:bg-mist'
            )}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
