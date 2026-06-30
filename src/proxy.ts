import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/events/create',
  '/api/bookings',
  '/api/organizer/dashboard',
  '/api/organizer/events',
  '/api/organizer/bookings',
  '/api/payments/webhooks',
  '/api/auth/me',
  '/api/users/profile',
  '/api/auth/change-password',
  '/api/events/',
  '/api/admin/'
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('session_token')?.value;

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication token missing.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(sessionToken, encodedSecret);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.userId));
    requestHeaders.set('x-user-email', String(payload.email));
    requestHeaders.set('x-user-role', String(payload.role));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired or token invalid.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};