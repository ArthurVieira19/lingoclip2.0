// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen, within, fireEvent } from "@testing-library/react"
import { DifficultySelector } from "./difficulty-selector"
import type { Song } from "@/types/Song"

const song: Song = {
  id: "test-song",
  title: "Test Song",
  artist: "Test Artist",
  youtubeId: "abc12345678",
  thumbnail: "https://i.ytimg.com/vi/abc12345678/hqdefault.jpg",
  difficulty: "beginner",
  lyrics: [
    { start: 0, end: 4, text: "The quick brown fox jumps over" },
    { start: 4, end: 8, text: "The lazy dog sleeps again today" },
  ],
}

describe("DifficultySelector", () => {
  it("renders the song title and artist", () => {
    render(<DifficultySelector song={song} onSelect={vi.fn()} />)
    expect(screen.getByRole("heading", { name: "Test Song" })).toBeInTheDocument()
    expect(screen.getByText("Test Artist")).toBeInTheDocument()
  })

  it("renders all four difficulty options with a word-count hint", () => {
    render(<DifficultySelector song={song} onSelect={vi.fn()} />)
    const group = screen.getByRole("group", { name: "Choose a difficulty" })
    const buttons = within(group).getAllByRole("button")

    expect(buttons).toHaveLength(4)
    expect(buttons.map((b) => b.textContent)).toEqual([
      expect.stringContaining("Beginner"),
      expect.stringContaining("Intermediate"),
      expect.stringContaining("Advanced"),
      expect.stringContaining("Expert"),
    ])
    buttons.forEach((button) => {
      expect(button.textContent).toMatch(/Fill in \d+ of \d+ words/)
    })
  })

  it("calls onSelect with the chosen difficulty", () => {
    const onSelect = vi.fn()
    render(<DifficultySelector song={song} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole("button", { name: /expert/i }))
    expect(onSelect).toHaveBeenCalledWith("expert")

    fireEvent.click(screen.getByRole("button", { name: /beginner/i }))
    expect(onSelect).toHaveBeenCalledWith("beginner")
  })
})
