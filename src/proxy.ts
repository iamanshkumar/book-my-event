import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

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
  const sessionToken = request.cookies.get('session_token')?.value;
  const isAuthenticated = !!sessionToken;

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      try {
        const { payload } = await jwtVerify(sessionToken, encodedSecret);
        const role = String(payload.role);

        if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        if (role === 'ORGANIZER') return NextResponse.redirect(new URL('/organizer/dashboard', request.url));
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (e) {
        const response = NextResponse.next();
        response.cookies.delete('session_token');
        return response;
      }
    }
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication token missing.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(sessionToken, encodedSecret);
    const userRole = String(payload.role);

    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/organizer') && userRole !== 'ORGANIZER') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/dashboard') && userRole !== 'CUSTOMER') {
      if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (userRole === 'ORGANIZER') return NextResponse.redirect(new URL('/organizer/dashboard', request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.userId));
    requestHeaders.set('x-user-email', String(payload.email));
    requestHeaders.set('x-user-role', userRole);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired or token invalid.' }, { status: 401 });
    }
    
    const loginResponse = NextResponse.redirect(new URL('/login', request.url));
    loginResponse.cookies.delete('session_token');
    return loginResponse;
  }
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};