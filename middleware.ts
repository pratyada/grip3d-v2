import { NextRequest, NextResponse } from "next/server"

// Maps subdomain hosts → the path they should serve at root.
// Add more white-label subdomains here as you launch them.
const HOST_REWRITES: Record<string, string> = {
  "artemis.yprateek.com": "/uc3",
  "fifa2026.yprateek.com": "/uc31",
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase()
  const target = HOST_REWRITES[host]

  // Only rewrite the root path of the configured host — leave everything else alone.
  if (target && (req.nextUrl.pathname === "/" || req.nextUrl.pathname === "")) {
    const url = req.nextUrl.clone()
    url.pathname = target
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

// Don't run middleware on static assets / API / Next.js internals.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|img/|api/).*)",
  ],
}
