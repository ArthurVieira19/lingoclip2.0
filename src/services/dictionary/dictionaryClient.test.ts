import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchDefinition } from "./dictionaryClient"

function jsonResponse(data: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => data } as Response
}

const RAW_ENTRY = {
  word: "smile",
  phonetic: "/smaɪl/",
  phonetics: [{ text: "/smaɪl/" }],
  meanings: [
    {
      partOfSpeech: "verb",
      definitions: [
        { definition: "To form a smile.", example: "She smiled at me." },
        { definition: "A second sense.", example: undefined },
      ],
    },
  ],
}

describe("fetchDefinition", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns a parsed entry for a found word", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([RAW_ENTRY]))
    vi.stubGlobal("fetch", fetchMock)

    const entry = await fetchDefinition("Smile")

    expect(entry).not.toBeNull()
    expect(entry?.word).toBe("smile")
    expect(entry?.phonetic).toBe("/smaɪl/")
    expect(entry?.definitions).toHaveLength(2)
    expect(entry?.definitions[0]).toEqual({
      partOfSpeech: "verb",
      definition: "To form a smile.",
      example: "She smiled at me.",
    })
  })

  it("returns null when the word isn't found", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ title: "No Definitions Found" }, false, 404))
    vi.stubGlobal("fetch", fetchMock)

    expect(await fetchDefinition("asdfghjkl")).toBeNull()
  })

  it("returns null instead of throwing when the request fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"))
    vi.stubGlobal("fetch", fetchMock)

    expect(await fetchDefinition("network-fail-word")).toBeNull()
  })

  it("caches results and only fetches once per word", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([RAW_ENTRY]))
    vi.stubGlobal("fetch", fetchMock)

    await fetchDefinition("cache-me")
    await fetchDefinition("cache-me")

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("returns null for an empty word without calling fetch", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    expect(await fetchDefinition("   ")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
