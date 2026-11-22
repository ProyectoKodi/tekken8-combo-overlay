import type { Combo, FetchResult } from './types/combo'

declare global {
  interface Window {
    electronAPI: {
      fetchCombos: (character: string) => Promise<FetchResult>
      getDynamicCharacters: () => Promise<Record<string, string>>
      clearCache: (character?: string) => Promise<boolean>
      syncAllCharacters: () => Promise<{ total: number; nuevos: number; failed: string[]; alreadyRunning?: boolean }>
      onSyncProgress: (cb: (p: any) => void) => () => void
      onNewCharactersFound: (cb: (p: { names: string[] }) => void) => () => void
      getRoutineCombos: () => Promise<Combo[]>
      getGlobalCombos: (query: string) => Promise<Array<{ character: string; combo: Combo }>>
      getCacheFreshness: () => Promise<Record<string, number>>
      listBackups: () => Promise<Array<{ file: string; mtimeMs: number; size: number }>>
      restoreBackup: (file: string) => Promise<{ ok: boolean; error?: string }>
      onSyncInProgress: (cb: () => void) => () => void
      getMasteryProgress: () => Promise<Record<string, { learned: number; total: number }>>
      getPendingNews: () => Promise<Record<string, number>>
      pickBannerImage: () => Promise<{ ok: boolean; url?: string; error?: string }>
      togglePracticePosition: () => Promise<{ ok: boolean; position: 'top' | 'bottom' }>
      getSharePortrait: (name: string) => Promise<{ url: string | null }>

      getDiscordStatus: () => Promise<'disabled' | 'not-running' | 'connected'>
      setDiscordClientId: (clientId: string) => Promise<{ ok: boolean; status: string }>

      toggleClickThrough: () => void
      setClickThroughHover: (safe: boolean) => void
      getTekkenStatus: () => Promise<boolean>
      onTekkenStatus: (cb: (running: boolean) => void) => () => void
      setOpacity: (opacity: number) => void
      closeWindow: () => void
      minimizeWindow: () => void

      getFavorites: () => Promise<string[]>
      toggleFavorite: (id: string) => Promise<boolean>
      toggleLearned: (id: string) => Promise<boolean>
      getLearnedCombos: () => Promise<string[]>
      saveCustomNote: (comboId: string, note: string) => Promise<{ ok: boolean }>
      exportProfile: () => Promise<{ ok: boolean; error?: string }>
      importProfile: () => Promise<{ ok: boolean; error?: string }>
      openPractice: (combo: Combo) => void
      closePractice: () => void
      getPendingPracticeCombo: () => Promise<{ combo: Combo | null; index: number; total: number }>
      practiceNavigate: (dir: 1 | -1) => void
      getPracticeMini: () => Promise<boolean>
      togglePracticeMini: () => void
      onPracticeMini: (cb: (mini: boolean) => void) => () => void
      getPracticeStats: () => Promise<{ todaySeconds: number; streak: number }>
      practiceHeartbeat: () => void

      openVideo: (url: string) => void
      closeVideo: () => void
      getPendingVideo: () => Promise<string | null>
      onVideoUrl: (cb: (url: string) => void) => () => void
      openExternal: (url: string) => void

      getAutoLaunch: () => Promise<boolean>
      setAutoLaunch: (enable: boolean) => Promise<boolean>

      getUserPrefs: () => Promise<Record<string, any>>
      setUserPref: (key: string, value: unknown) => Promise<{ ok: boolean }>
      applyUiScale: (scale: number) => Promise<{ ok: boolean }>
      migrateLegacyPrefs: (patch: Record<string, unknown>) => Promise<Record<string, any>>

      getHotkeys: () => Promise<Record<string, string>>
      setHotkey: (action: string, accelerator: string) => Promise<{ ok: boolean; error?: string }>

      onPracticeCombo: (cb: (payload: { combo: Combo | null; index: number; total: number }) => void) => () => void
      onHotkeyClickThrough: (cb: (isIgnoring: boolean) => void) => () => void
      onHotkeyStreamer: (cb: () => void) => () => void

      onUpdateAvailable: (cb: (info: any) => void) => () => void
      onUpdateDownloaded: (cb: () => void) => () => void
      startUpdateDownload: () => void
      quitAndInstall: () => void
    }
  }
}

export {}
