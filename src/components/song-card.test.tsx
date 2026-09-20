// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SongCard } from "./song-card"
import type { Song } from "@/types/Song"

const song: Song = {
  id: "test-song",
  title: "Test Song",
  artist: "Test Artist",
  youtubeId: "abc12345678",
  thumbnail: "https://i.ytimg.com/vi/abc12345678/hqdefault.jpg",
  difficulty: "intermediate",
  lyrics: [],
}

describe("SongCard", () => {
  it("renders title, artist, and difficulty", () => {
    render(<SongCard song={song} />)
    expect(screen.getByText("Test Song")).toBeInTheDocument()
    expect(screen.getByText("Test Artist")).toBeInTheDocument()
    expect(screen.getByText("intermediate")).toBeInTheDocument()
  })

  it("links to the song's game page", () => {
    render(<SongCard song={song} />)
    expect(screen.getByRole("link")).toHaveAttribute("href", "/game/test-song")
  })

  it("falls back through lower-resolution thumbnails when one fails to load", () => {
    render(<SongCard song={song} />)
    const img = screen.getByRole("img", { name: "Test Song" }) as HTMLImageElement
    expect(img.src).toBe(song.thumbnail)

    fireEvent.error(img)
    expect(img.src).toBe("https://i.ytimg.com/vi/abc12345678/mqdefault.jpg")

    fireEvent.error(img)
    expect(img.src).toBe("https://i.ytimg.com/vi/abc12345678/default.jpg")

    // Already at the last fallback — another error must not change the src again.
    fireEvent.error(img)
    expect(img.src).toBe("https://i.ytimg.com/vi/abc12345678/default.jpg")
  })

  it("shows a delete trigger only when onDelete is provided", () => {
    const { rerender } = render(<SongCard song={song} />)
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument()

    rerender(<SongCard song={song} onDelete={vi.fn()} />)
    expect(
      screen.getByRole("button", { name: "Remove Test Song from library" }),
    ).toBeInTheDocument()
  })
})
