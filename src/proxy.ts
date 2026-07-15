import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get("lms_admin_access_token");
  const isAuth = Boolean(authCookie?.value);

  if (!isAuth && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|firebase-messaging-sw\\.js|sitemap.xml|robots.txt).*)"],
};
