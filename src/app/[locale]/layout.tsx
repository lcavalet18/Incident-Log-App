import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Yellowtail } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';
import { locales, localeDirection, type Locale } from '@/i18n/config';
import { AppShell } from '@/components/AppShell';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { cn } from '@/lib/utils';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const yellowtail = Yellowtail({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'G12++ Exam Incident Log',
  description: 'Track technical issues and malpractice incidents during G12++ exam sittings.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c12c68',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = localeDirection[locale as Locale];

  return (
    <html lang={locale} dir={dir} className={cn(ibmPlexSans.variable, ibmPlexMono.variable, yellowtail.variable)}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ServiceWorkerRegister />
          <AppShell>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
