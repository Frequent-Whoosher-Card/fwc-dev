import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // hanya handle dashboard
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get("fwc_role");
  const role = roleCookie?.value?.toLowerCase();

  const url = request.nextUrl.clone();

  // belum login
  if (!role) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // redirect default /dashboard
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    if (role === "superadmin") {
      url.pathname = "/dashboard/superadmin";
    } else if (role === "admin") {
      url.pathname = "/dashboard/admin";
    } else if (role === "petugas") {
      url.pathname = "/dashboard/petugas";
    }
    return NextResponse.redirect(url);
  }

  // PROTECT SUPERADMIN AREA
  if (pathname.startsWith("/dashboard/superadmin") && role !== "superadmin") {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  // PROTECT ADMIN AREA
  if (
    pathname.startsWith("/dashboard/admin") &&
    role !== "admin" &&
    role !== "superadmin"
  ) {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  // PROTECT PETUGAS AREA
  if (pathname.startsWith("/dashboard/petugas") && role !== "petugas") {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
