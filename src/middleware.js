import { NextResponse } from 'next/server';

export function middleware(request) {
  const session = request.cookies.get('further-admin-session');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Si no tiene cookie y quiere entrar al dashboard -> Login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si tiene cookie y quiere ir al login -> Dashboard
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};