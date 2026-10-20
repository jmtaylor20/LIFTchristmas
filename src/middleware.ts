import { NextResponse, type NextRequest } from "next/server";

export const FAMILY_COOKIE = "lift_family";

// When a parent opens their private family link, remember it on this device so
// the "LIFT Family" home-screen app (which always starts at /family) can take
// them straight back to their own page.
export function middleware(req: NextRequest) {
  const token = req.nextUrl.pathname.match(/^\/family\/([\w-]{16,})$/)?.[1];
  const res = NextResponse.next();
  if (token) {
    res.cookies.set(FAMILY_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = { matcher: ["/family/:token"] };
