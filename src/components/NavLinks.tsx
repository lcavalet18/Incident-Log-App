'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { UserRole } from '@/types/database';
import { cn } from '@/lib/utils';

export function NavLinks({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const isStaff = role === 'admin' || role === 'supervisor';

  const links = isStaff
    ? [
        { href: '/audit', label: t('audit') },
        { href: '/admin/codes', label: t('codeList') },
      ]
    : [
        { href: '/incidents', label: t('myReports') },
        { href: '/incidents/new', label: t('newIncident') },
      ];

  return (
    <nav className="ms-2 flex gap-1">
      {links.map((link) => {
        const active = pathname?.includes(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-[7px] px-[15px] py-2 text-sm font-semibold transition-colors',
              active ? 'bg-brand-50 text-brand-600' : 'text-secondary hover:bg-mist'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
