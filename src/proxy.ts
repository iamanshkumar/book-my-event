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
  const isAuthenticated = !!sessionToken;
  console.log("[Proxy] Is Authenticated:", isAuthenticated);

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

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      console.log("[Proxy] Missing token for API path:", pathname);
      return NextResponse.json({ error: 'Authentication token missing.' }, { status: 401 });
    }
    console.log("[Proxy] Missing token for Page path:", pathname);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(sessionToken, encodedSecret);
    const userRole = String(payload.role);
    console.log("[Proxy] Valid token. User ID:", payload.userId, "Role:", userRole);

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

    console.log("[Proxy] Setting x-user-id header to:", payload.userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error: any) {
    console.log("[Proxy] JWT verification failed:", error.message);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired or token invalid.' }, { status: 401 });
    }
    
    const loginResponse = NextResponse.redirect(new URL('/login', request.url));
    loginResponse.cookies.delete('session_token');
    return loginResponse;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default proxy;
