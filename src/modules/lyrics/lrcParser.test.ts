import { describe, expect, it } from "vitest"
import { parseLRC } from "./lrcParser"

describe("parseLRC", () => {
  it("parses a single line", () => {
    const result = parseLRC("[00:15.20]Hello world")

    expect(result).toEqual([{ start: 15.2, end: 19.2, text: "Hello world" }])
  })

  it("parses multiple lines in order and derives end from the next line", () => {
    const result = parseLRC(
      ["[00:00.00]First line", "[00:05.00]Second line", "[00:10.00]Third line"].join("\n"),
    )

    expect(result).toEqual([
      { start: 0, end: 5, text: "First line" },
      { start: 5, end: 10, text: "Second line" },
      { start: 10, end: 14, text: "Third line" },
    ])
  })

  it("ignores lines with invalid timestamps", () => {
    const result = parseLRC(
      ["[aa:bb.cc]Broken", "[00:05.00]Valid line", "[12:5]Also broken"].join("\n"),
    )

    expect(result).toEqual([{ start: 5, end: 9, text: "Valid line" }])
  })

  it("keeps both entries for duplicated timestamps deterministically", () => {
    const result = parseLRC(
      ["[00:10.00]First at ten", "[00:10.00]Second at ten", "[00:20.00]Later line"].join("\n"),
    )

    expect(result).toEqual([
      { start: 10, end: 10, text: "First at ten" },
      { start: 10, end: 20, text: "Second at ten" },
      { start: 20, end: 24, text: "Later line" },
    ])
  })

  it("ignores lines with missing timestamps", () => {
    const result = parseLRC(
      ["This is just plain text", "[00:03.00]Real line", "[ar:Some Artist]"].join("\n"),
    )

    expect(result).toEqual([{ start: 3, end: 7, text: "Real line" }])
  })

  it("ignores empty entries after stripping timestamps", () => {
    const result = parseLRC(["[00:01.00]   ", "[00:02.00]Actual content"].join("\n"))

    expect(result).toEqual([{ start: 2, end: 6, text: "Actual content" }])
  })

  it("expands a line with multiple timestamps into separate entries", () => {
    const result = parseLRC("[00:01.00][00:30.00]Repeated chorus")

    expect(result).toEqual([
      { start: 1, end: 30, text: "Repeated chorus" },
      { start: 30, end: 34, text: "Repeated chorus" },
    ])
  })

  it("returns an empty array for empty input", () => {
    expect(parseLRC("")).toEqual([])
  })

  it("is deterministic across repeated calls", () => {
    const input = ["[00:15.20]Hello", "[00:20.00]World", "[00:25.50]Again"].join("\n")

    const first = parseLRC(input)
    const second = parseLRC(input)

    expect(first).toEqual(second)
  })
})
