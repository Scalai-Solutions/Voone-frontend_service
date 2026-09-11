import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (process.env.AUTH_ENABLED !== "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isProtectedArea = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!isProtectedArea) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has("next-auth.session-token") || request.cookies.has("__Secure-next-auth.session-token");

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("callbackUrl", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};