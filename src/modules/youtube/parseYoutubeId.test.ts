import { describe, expect, it } from "vitest"
import { parseYoutubeId } from "./parseYoutubeId"

describe("parseYoutubeId", () => {
  it("passes through a bare 11-character id", () => {
    expect(parseYoutubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("extracts the id from a standard watch URL", () => {
    expect(parseYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("extracts the id from a watch URL with extra query params", () => {
    expect(parseYoutubeId("https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s")).toBe("dQw4w9WgXcQ")
  })

  it("extracts the id from a short youtu.be URL", () => {
    expect(parseYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("extracts the id from an embed URL", () => {
    expect(parseYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("extracts the id from a shorts URL", () => {
    expect(parseYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("returns null for garbage input", () => {
    expect(parseYoutubeId("not a url")).toBeNull()
    expect(parseYoutubeId("")).toBeNull()
    expect(parseYoutubeId("https://example.com/video")).toBeNull()
  })

  it("returns null for a malformed id length", () => {
    expect(parseYoutubeId("https://youtu.be/short")).toBeNull()
  })
})
