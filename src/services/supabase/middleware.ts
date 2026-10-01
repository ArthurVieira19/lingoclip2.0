import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isPublicPath } from "@/lib/authPaths"

/**
 * Refreshes the Supabase session cookie and gates every page behind login.
 * Signed-out visitors are sent to /login (remembering where they were going);
 * signed-in users skip the login/signup screens.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let isSignedIn = false

  // Missing env vars are treated as "signed out" so the login page can explain
  // the misconfiguration instead of the whole app throwing a 500.
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })

    // getUser() revalidates the token with the auth server; getSession() alone
    // would trust whatever is in the cookie.
    const { data } = await supabase.auth.getUser()
    isSignedIn = Boolean(data.user)
  }

  const { pathname, search } = request.nextUrl

  if (!isSignedIn && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`)
    return redirectWithCookies(loginUrl, response)
  }

  if (isSignedIn && isPublicPath(pathname)) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = "/library"
    homeUrl.search = ""
    return redirectWithCookies(homeUrl, response)
  }

  return response
}

/** A redirect must carry any refreshed auth cookies, or the session is silently dropped. */
function redirectWithCookies(target: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(target)
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}
