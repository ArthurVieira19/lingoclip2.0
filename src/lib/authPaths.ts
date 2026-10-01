/** Pages reachable without an account. Everything else requires login. */
const PUBLIC_PATHS = ["/login", "/signup"]

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/** Where to go after logging in: the page that bounced the visitor, if it's a safe same-site path. */
export function getPostLoginPath(search: string): string {
  const next = new URLSearchParams(search).get("next")
  if (next && next.startsWith("/") && !next.startsWith("//") && !isPublicPath(next)) return next
  return "/library"
}
