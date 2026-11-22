import { contextBridge, ipcRenderer } from 'electron'
import type { Combo } from '../renderer/types/combo'

contextBridge.exposeInMainWorld('electronAPI', {
  // Combos
  fetchCombos: (character: string) => ipcRenderer.invoke('fetch-combos', character),
  getDynamicCharacters: () => ipcRenderer.invoke('get-dynamic-characters'),
  clearCache: (character?: string) => ipcRenderer.invoke('clear-cache', character),
  syncAllCharacters: () => ipcRenderer.invoke('sync-all-characters'),
  onSyncProgress: (cb: (p: any) => void) => { const h = (_: any, p: any) => cb(p); ipcRenderer.on('sync-progress', h); return () => ipcRenderer.removeListener('sync-progress', h) },
  onNewCharactersFound: (cb: (p: { names: string[] }) => void) => { const h = (_: any, p: { names: string[] }) => cb(p); ipcRenderer.on('new-characters-found', h); return () => ipcRenderer.removeListener('new-characters-found', h) },

  // "Mi rutina": favoritos de todos los personajes en una lista
  getRoutineCombos: () => ipcRenderer.invoke('get-routine-combos'),
  // Búsqueda global Ctrl+F y frescura del caché
  getGlobalCombos: (query: string) => ipcRenderer.invoke('global-search', query),
  getCacheFreshness: () => ipcRenderer.invoke('get-cache-freshness'),
  // Respaldos
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (file: string) => ipcRenderer.invoke('restore-backup', file),
  
  // Ventana
  toggleClickThrough: () => ipcRenderer.send('toggle-click-through'),
  setClickThroughHover: (safe: boolean) => ipcRenderer.send('set-click-through-hover', safe),
  getTekkenStatus: () => ipcRenderer.invoke('get-tekken-status'),
  onTekkenStatus: (cb: (running: boolean) => void) => { const h = (_e: unknown, v: boolean) => cb(v); ipcRenderer.on('tekken-status', h); return () => ipcRenderer.removeListener('tekken-status', h) },
  setOpacity: (opacity: number) => ipcRenderer.send('set-opacity', opacity),
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  // ... (el resto de tus funciones se mantienen igual)
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  toggleFavorite: (id: string) => ipcRenderer.invoke('toggle-favorite', id),
  toggleLearned: (id: string) => ipcRenderer.invoke('toggle-learned', id),
  getLearnedCombos: () => ipcRenderer.invoke('get-learned-combos'),
  saveCustomNote: (comboId: string, note: string) => ipcRenderer.invoke('save-custom-note', { comboId, note }),
  exportProfile: () => ipcRenderer.invoke('export-profile'),
  importProfile: () => ipcRenderer.invoke('import-profile'),
  openPractice: (combo: Combo) => ipcRenderer.send('open-practice', combo),
  closePractice: () => ipcRenderer.send('close-practice'),
  getPendingPracticeCombo: () => ipcRenderer.invoke('get-pending-practice-combo'),
  practiceNavigate: (dir: 1 | -1) => ipcRenderer.send('practice-navigate', dir),
  getPracticeMini: () => ipcRenderer.invoke('get-practice-mini'),
  togglePracticeMini: () => ipcRenderer.send('toggle-practice-mini'),
  onPracticeMini: (cb: (mini: boolean) => void) => { const h = (_e: unknown, mini: boolean) => cb(mini); ipcRenderer.on('practice-mini', h); return () => ipcRenderer.removeListener('practice-mini', h) },
  getPracticeStats: () => ipcRenderer.invoke('get-practice-stats'),
  practiceHeartbeat: () => ipcRenderer.send('practice-heartbeat'),

  // Vídeo del combo (ventana flotante)
  openVideo: (url: string) => ipcRenderer.send('open-video', url),
  closeVideo: () => ipcRenderer.send('close-video'),
  getPendingVideo: () => ipcRenderer.invoke('get-pending-video'),
  onVideoUrl: (cb: (url: string) => void) => { const h = (_e: unknown, url: string) => cb(url); ipcRenderer.on('video-url', h); return () => ipcRenderer.removeListener('video-url', h) },
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('set-auto-launch', enable),

  // Hotkeys
  onPracticeCombo: (cb: (payload: { combo: Combo | null; index: number; total: number }) => void) => { const h = (_e: unknown, p: { combo: Combo | null; index: number; total: number }) => cb(p); ipcRenderer.on('practice-combo', h); return () => ipcRenderer.removeListener('practice-combo', h) },
  onHotkeyClickThrough: (cb: (isIgnoring: boolean) => void) => { const h = (_: any, v: boolean) => cb(v); ipcRenderer.on('hotkey-click-through-toggle', h); return () => ipcRenderer.removeListener('hotkey-click-through-toggle', h) },
  onHotkeyStreamer: (cb: () => void) => { ipcRenderer.on('hotkey-streamer-mode', cb); return () => ipcRenderer.removeListener('hotkey-streamer-mode', cb) },
  
  // Preferencias de usuario (persistidas en el proceso main)
  getUserPrefs: () => ipcRenderer.invoke('get-user-prefs'),
  setUserPref: (key: string, value: unknown) => ipcRenderer.invoke('set-user-pref', key, value),
  applyUiScale: (scale: number) => ipcRenderer.invoke('apply-ui-scale', scale),
  migrateLegacyPrefs: (patch: Record<string, unknown>) => ipcRenderer.invoke('migrate-legacy-prefs', patch),

  // Atajos reasignables
  getHotkeys: () => ipcRenderer.invoke('get-hotkeys'),
  setHotkey: (action: string, accelerator: string) => ipcRenderer.invoke('set-hotkey', action, accelerator),

  // Estado de sincronización
  onSyncInProgress: (cb: () => void) => { const h = () => cb(); ipcRenderer.on('sync-in-progress', h); return () => ipcRenderer.removeListener('sync-in-progress', h) },

  // Progreso de maestría por personaje
  getMasteryProgress: () => ipcRenderer.invoke('get-mastery-progress'),

  // Aviso de combos nuevos pendientes
  getPendingNews: () => ipcRenderer.invoke('get-pending-news'),

  // Personalización visual
  pickBannerImage: () => ipcRenderer.invoke('pick-banner-image'),
  togglePracticePosition: () => ipcRenderer.invoke('toggle-practice-position'),
  getSharePortrait: (name: string) => ipcRenderer.invoke('get-share-portrait', name),

  // Discord Rich Presence
  getDiscordStatus: () => ipcRenderer.invoke('get-discord-status'),
  setDiscordClientId: (clientId: string) => ipcRenderer.invoke('set-discord-client-id', clientId),

  // Actualizador
  onUpdateAvailable: (cb: (info: any) => void) => { ipcRenderer.on('update-available', (_, info) => cb(info)); return () => ipcRenderer.removeAllListeners('update-available') },
  onUpdateDownloaded: (cb: () => void) => { ipcRenderer.on('update-downloaded', cb); return () => ipcRenderer.removeAllListeners('update-downloaded') },
  startUpdateDownload: () => ipcRenderer.send('start-update-download'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
})