import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // redirect legacy
  if (pathname.startsWith('/superadmin')) {
    return NextResponse.redirect(
      new URL(`/dashboard${pathname}`, request.url)
    );
  }

  // hanya protect dashboard
  if (pathname.startsWith('/dashboard')) {
    // ❗ token dicek DI CLIENT, bukan middleware
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/superadmin/:path*'],
};
