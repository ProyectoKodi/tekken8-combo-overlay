import type { Combo, FetchResult } from './types/combo'

declare global {
  interface Window {
    electronAPI: {
      fetchCombos: (character: string) => Promise<FetchResult>
      getCharacterList: () => Promise<string[]>
      getDynamicCharacters: () => Promise<Record<string, string>>
      clearCache: (character?: string) => Promise<boolean>
      syncAllCharacters: () => Promise<{ total: number; nuevos: number }>
      onSyncProgress: (cb: (p: any) => void) => () => void

      toggleClickThrough: () => void
      toggleCollapse: () => void
      toggleHorizontal: () => void
      setOpacity: (opacity: number) => void
      closeWindow: () => void
      minimizeWindow: () => void

      getFavorites: () => Promise<string[]>
      toggleFavorite: (id: string) => Promise<boolean>
      isFavorite: (id: string) => Promise<boolean>
      toggleLearned: (id: string) => Promise<boolean>
      getLearnedCombos: () => Promise<string[]>
      saveCustomNote: (comboId: string, note: string) => Promise<{ ok: boolean }>
      getCustomNotes: () => Promise<Record<string, string>>
      exportProfile: () => Promise<{ ok: boolean; error?: string }>
      importProfile: () => Promise<{ ok: boolean; added?: number; error?: string }>
      addCustomCombo: (c: Partial<Combo>) => Promise<{ ok: boolean }>
      getCustomCombos: (character?: string) => Promise<Combo[]>
      deleteCustomCombo: (id: string) => Promise<{ ok: boolean }>
      fetchYouTubeMeta: (url: string) => Promise<{ ok: boolean; title?: string }>

      openPractice: (combo: Combo) => void
      closePractice: () => void
      getPendingPracticeCombo: () => Promise<Combo | null>

      getAutoLaunch: () => Promise<boolean>
      setAutoLaunch: (enable: boolean) => Promise<boolean>

      fetchPlayerStats: (tekkenId: string) => Promise<any>
      fetchPlayerStatsWithApiKey: (apiKey: string, tekkenId?: string) => Promise<any>

      onHotkeyToggle: (cb: () => void) => () => void
      onHorizontalChanged: (cb: (isHorizontal: boolean) => void) => () => void
      onPracticeCombo: (cb: (combo: Combo) => void) => () => void
      onHotkeyClickThrough: (cb: (isIgnoring: boolean) => void) => () => void
      onHotkeyAddCombo: (cb: () => void) => () => void
      onHotkeyStreamer: (cb: () => void) => () => void

      onUpdateAvailable: (cb: (info: any) => void) => () => void
      onUpdateDownloaded: (cb: () => void) => () => void
      startUpdateDownload: () => void
      quitAndInstall: () => void
    }
  }
}

export {}
