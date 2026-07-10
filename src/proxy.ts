import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/events/create',
  '/api/bookings',
  '/api/organizer/',
  '/api/payments/webhooks',
  '/api/auth/me',
  '/api/users/profile',
  '/api/auth/change-password',
  '/api/events/',
  '/api/admin/'
];

export async function proxy(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;
  const encodedSecret = new TextEncoder().encode(JWT_SECRET);

  const { pathname } = request.nextUrl;
  console.log("[Proxy] Intercepted path:", pathname);

  const sessionToken = request.cookies.get('session_token')?.value;
  
  let payload: any = null;
  if (sessionToken) {
    try {
      const decoded = await jwtVerify(sessionToken, encodedSecret);
      payload = decoded.payload;
    } catch (e) {
      // Token invalid or expired
    }
  }

  // 1. Auth routes redirect logic
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (payload) {
      const role = String(payload.role);
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (role === 'ORGANIZER') return NextResponse.redirect(new URL('/organizer/dashboard', request.url));
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  let isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  // Exclude public GET endpoints under /api/events
  if (pathname.startsWith('/api/events/')) {
    const isPublicGet = (
      request.method === 'GET' && 
      (pathname === '/api/events/list' || pathname === '/api/events/search' || !pathname.includes('/create'))
    );
    if (isPublicGet) {
      isProtectedRoute = false;
    }
  }

  console.log("[Proxy] Is Protected Route:", isProtectedRoute);

  // If protected route and not authenticated (or invalid token)
  if (isProtectedRoute) {
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        console.log("[Proxy] Missing token for API path:", pathname);
        return NextResponse.json({ error: 'Authentication token missing.' }, { status: 401 });
      }
      console.log("[Proxy] Missing token for Page path:", pathname);
      const loginResponse = NextResponse.redirect(new URL('/login', request.url));
      if (sessionToken) {
        loginResponse.cookies.delete('session_token');
      }
      return loginResponse;
    }

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
  }

  // Inject headers if user is authenticated (whether public or protected route)
  if (payload) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.userId));
    requestHeaders.set('x-user-email', String(payload.email));
    requestHeaders.set('x-user-role', String(payload.role));

    console.log("[Proxy] Setting x-user-id header to:", payload.userId, "for path:", pathname);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default proxy;
