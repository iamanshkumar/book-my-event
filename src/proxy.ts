import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { isAdmin, isOrganizer, isAttendee } from './backend/lib/role';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/admin',
  '/organizer',
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
    }
  }

  const userRole = payload ? String(payload.role) : null;
  const isUserAdmin = isAdmin(userRole);

  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isStatusApi = pathname === '/api/maintenance/status';
  const isMaintenancePage = pathname === '/maintenance';

  if (!isAdminPath && !isStatusApi && !isMaintenancePage && !isUserAdmin) {
    try {
      const baseUrl = request.nextUrl.origin;
      const maintenanceRes = await fetch(`${baseUrl}/api/maintenance/status?t=${Date.now()}`, { cache: 'no-store' });
      if (maintenanceRes.ok) {
        const maint = await maintenanceRes.json();
        if (maint.maintenanceModeEnabled === "1") {
          let clientIp = (request as any).ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
          if (clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim();
          }
          clientIp = clientIp.trim();
          if (clientIp.startsWith('::ffff:')) {
            clientIp = clientIp.substring(7);
          }

          const allowedIps = (maint.maintenanceAllowedIps || "")
            .split(',')
            .map((ip: string) => ip.trim())
            .filter(Boolean);

          const isIpAllowed = allowedIps.includes(clientIp);

          if (!isIpAllowed) {
            if (pathname.startsWith('/api/')) {
              return NextResponse.json(
                { error: "Service Temporarily Unavailable. The website is currently undergoing scheduled maintenance." },
                { status: 503 }
              );
            } else {
              return NextResponse.rewrite(new URL('/maintenance', request.url), {
                status: 503,
                headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("[Proxy] Maintenance check failed:", e);
    }
  }

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (payload) {
      const role = String(payload.role);
      if (isAdmin(role)) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (isOrganizer(role)) return NextResponse.redirect(new URL('/organizer/dashboard', request.url));
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  let isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

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
    if (pathname.startsWith('/admin') && !isAdmin(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/organizer') && !isOrganizer(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/dashboard') && !isAttendee(userRole)) {
      if (isAdmin(userRole)) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (isOrganizer(userRole)) return NextResponse.redirect(new URL('/organizer/dashboard', request.url));
    }
  }

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
