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
        { href: '/dashboard', label: t('dashboard') },
        { href: '/audit', label: t('audit') },
        { href: '/admin/codes', label: t('codeList') },
      ]
    : [
        { href: '/incidents', label: t('myReports') },
        { href: '/incidents/new', label: t('newIncident') },
      ];

  return (
    <nav className="flex gap-4">
      {links.map((link) => {
        const active = pathname?.includes(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-sm font-medium',
              active ? 'text-brand-600' : 'text-muted hover:text-ink'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
