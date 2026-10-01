import { getSupabase, isSupabaseConfigured } from "@/services/supabase/client"
import { prepareSignOut } from "@/services/supabase/userDataSync"

export interface AuthResult {
  /** A message safe to show the player, or null on success. */
  error: string | null
}

const NOT_CONFIGURED = "Login isn't set up yet: the Supabase keys are missing from .env.local."

function friendlyMessage(message: string): string {
  const text = message.toLowerCase()
  if (text.includes("invalid login credentials")) return "Incorrect email or password."
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "An account with this email already exists. Try logging in instead."
  }
  if (text.includes("password") && text.includes("least")) return "Your password is too short — use at least 6 characters."
  if (text.includes("rate limit")) return "Too many attempts. Wait a moment and try again."
  if (text.includes("valid email") || text.includes("invalid email")) return "That doesn't look like a valid email address."
  if (text.includes("failed to fetch") || text.includes("network")) return "Couldn't reach the server. Check your connection."
  return message
}

export const authService = {
  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED }
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password })
      return { error: error ? friendlyMessage(error.message) : null }
    } catch (error) {
      return { error: friendlyMessage(error instanceof Error ? error.message : "Something went wrong.") }
    }
  },

  async signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
    if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED }
    try {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { data: displayName ? { display_name: displayName } : {} },
      })
      if (error) return { error: friendlyMessage(error.message) }
      // With email confirmation off, signUp returns a live session. No session means
      // confirmation got switched back on in the dashboard.
      if (!data.session) return { error: "Account created — check your email to confirm it, then log in." }
      return { error: null }
    } catch (error) {
      return { error: friendlyMessage(error instanceof Error ? error.message : "Something went wrong.") }
    }
  },

  /** Saves pending progress, signs out, and hard-navigates so no signed-in state survives in memory. */
  async signOut(): Promise<void> {
    try {
      await prepareSignOut()
      await getSupabase().auth.signOut()
    } finally {
      window.location.assign("/login")
    }
  },
}
