// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { resolveGameShortcut, type ShortcutKeyEvent } from "./gameShortcuts"

function key(code: string, overrides: Partial<ShortcutKeyEvent> = {}): ShortcutKeyEvent {
  return {
    code,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    repeat: false,
    target: null,
    ...overrides,
  }
}

function target(html: string): Element {
  const host = document.createElement("div")
  host.innerHTML = html
  document.body.appendChild(host)
  return host.firstElementChild as Element
}

describe("resolveGameShortcut", () => {
  it("maps the bare keys when nothing interactive has focus", () => {
    expect(resolveGameShortcut(key("Space", { target: document.body }))).toBe("togglePlayback")
    expect(resolveGameShortcut(key("KeyR", { target: document.body }))).toBe("replayLine")
    expect(resolveGameShortcut(key("KeyS", { target: document.body }))).toBe("skipLine")
    expect(resolveGameShortcut(key("KeyB", { target: document.body }))).toBe("rewind5")
  })

  it("never hijacks bare keys while typing in a blank", () => {
    const input = target("<input />")
    expect(resolveGameShortcut(key("KeyR", { target: input }))).toBeNull()
    expect(resolveGameShortcut(key("Space", { target: input }))).toBeNull()
  })

  it("leaves Space alone on a focused button so it still activates the button", () => {
    const button = target("<button>Skip</button>")
    expect(resolveGameShortcut(key("Space", { target: button }))).toBeNull()
  })

  it("leaves bare keys alone inside an open dialog or popover", () => {
    const dialog = target("<div role='dialog'><span>word</span></div>")
    expect(resolveGameShortcut(key("KeyR", { target: dialog.firstElementChild }))).toBeNull()
  })

  it("lets Alt + key through even while typing", () => {
    const input = target("<input />")
    expect(resolveGameShortcut(key("KeyR", { altKey: true, target: input }))).toBe("replayLine")
    expect(resolveGameShortcut(key("KeyP", { altKey: true, target: input }))).toBe("togglePlayback")
    expect(resolveGameShortcut(key("KeyS", { altKey: true, target: input }))).toBe("skipLine")
  })

  it("does not bind Alt + Space (the OS window menu)", () => {
    expect(resolveGameShortcut(key("Space", { altKey: true, target: document.body }))).toBeNull()
  })

  it("ignores browser/OS chords, held keys, IME composition and handled events", () => {
    expect(resolveGameShortcut(key("KeyR", { ctrlKey: true, target: document.body }))).toBeNull()
    expect(resolveGameShortcut(key("KeyR", { metaKey: true, target: document.body }))).toBeNull()
    expect(resolveGameShortcut(key("KeyR", { shiftKey: true, target: document.body }))).toBeNull()
    expect(resolveGameShortcut(key("KeyR", { repeat: true, target: document.body }))).toBeNull()
    expect(resolveGameShortcut(key("KeyR", { isComposing: true, target: document.body }))).toBeNull()
    expect(resolveGameShortcut(key("KeyR", { defaultPrevented: true, target: document.body }))).toBeNull()
  })

  it("ignores keys that aren't shortcuts", () => {
    expect(resolveGameShortcut(key("KeyZ", { target: document.body }))).toBeNull()
    expect(resolveGameShortcut(key("Enter", { target: document.body }))).toBeNull()
  })
})
