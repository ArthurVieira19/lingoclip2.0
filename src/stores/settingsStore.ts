import { create } from "zustand"
import type { Settings } from "@/types/Settings"
import { DEFAULT_SETTINGS, storageService } from "@/services/storage/storageService"

interface SettingsState {
  settings: Settings
}

interface SettingsActions {
  loadFromStorage: () => void
  updateSettings: (partial: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loadFromStorage: () => set({ settings: storageService.getSettings() }),
  updateSettings: (partial) => {
    const settings = { ...get().settings, ...partial }
    storageService.saveSettings(settings)
    set({ settings })
  },
}))
