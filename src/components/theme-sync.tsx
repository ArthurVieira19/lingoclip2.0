"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useSettingsStore } from "@/stores/settingsStore"

/**
 * Applies the persisted theme setting to next-themes on load and whenever it
 * changes. settingsStore (LocalStorage-backed, via storageService) stays the
 * single source of truth for the player's *choice*; next-themes is only the
 * mechanism that turns that choice into a `.dark` class + system-preference
 * listener on `<html>`.
 */
export function ThemeSync() {
  const { setTheme } = useTheme()
  const theme = useSettingsStore((s) => s.settings.theme)

  useEffect(() => {
    setTheme(theme)
  }, [theme, setTheme])

  return null
}
