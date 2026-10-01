"use client"

import { useEffect, useRef } from "react"
import { resolveGameShortcut, type GameShortcutAction } from "@/modules/game/gameShortcuts"

/**
 * Listens for the game's keyboard shortcuts (see gameShortcuts) for as long as
 * the screen is mounted. Handlers are read through a ref, so callers can pass
 * fresh closures every render without re-subscribing the window listener.
 */
export function useGameShortcuts(handlers: Record<GameShortcutAction, () => void>, enabled = true) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(event: KeyboardEvent) {
      const action = resolveGameShortcut(event)
      if (!action) return

      // Stops Space from scrolling the page and Alt+letter from reaching browser menus.
      event.preventDefault()
      handlersRef.current[action]()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [enabled])
}
