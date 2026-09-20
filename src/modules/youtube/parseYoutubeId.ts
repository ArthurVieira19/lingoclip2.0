/**
 * Extracts a YouTube video ID from a pasted URL (watch, short, embed links)
 * or passes through a bare 11-character ID unchanged. Returns null when the
 * input doesn't look like a valid YouTube reference.
 */
export function parseYoutubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const bareIdPattern = /^[a-zA-Z0-9_-]{11}$/
  if (bareIdPattern.test(trimmed)) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      const id = url.pathname.slice(1)
      return bareIdPattern.test(id) ? id : null
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const vParam = url.searchParams.get("v")
      if (vParam && bareIdPattern.test(vParam)) return vParam

      const pathMatch = url.pathname.match(/^\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/)
      if (pathMatch) return pathMatch[1]
    }
  } catch {
    return null
  }

  return null
}
