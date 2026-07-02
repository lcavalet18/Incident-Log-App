import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const PUBLIC_PATHS = ['/login'];

function stripLocale(pathname: string) {
  const segments = pathname.split('/');
  if (locales.includes(segments[1] as (typeof locales)[number])) {
    return '/' + segments.slice(2).join('/');
  }
  return pathname;
}

export default async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  const { response, user } = await updateSession(request, intlResponse);

  const pathWithoutLocale = stripLocale(request.nextUrl.pathname) || '/';
  const isPublic = PUBLIC_PATHS.some((p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const locale = request.nextUrl.pathname.split('/')[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathWithoutLocale === '/login') {
    const locale = request.nextUrl.pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/incidents/new`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)'],
};
