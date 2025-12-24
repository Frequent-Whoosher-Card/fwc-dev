import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get("fwc_role");
  const role = roleCookie?.value?.toLowerCase();

  const url = request.nextUrl.clone();

  // If no role cookie, force user back to login
  if (!role) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Handle direct access to /dashboard root
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    url.pathname = role === "petugas" ? "/dashboard/petugas" : "/dashboard/admin";
    return NextResponse.redirect(url);
  }

  // Role-based route protection between admin and petugas areas
  if (role === "petugas" && pathname.startsWith("/dashboard/admin")) {
    url.pathname = "/dashboard/petugas";
    return NextResponse.redirect(url);
  }

  if (role !== "petugas" && pathname.startsWith("/dashboard/petugas")) {
    url.pathname = "/dashboard/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};


