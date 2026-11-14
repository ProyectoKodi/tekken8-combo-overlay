import { contextBridge, ipcRenderer } from 'electron'
import type { Combo } from '../renderer/types/combo'

contextBridge.exposeInMainWorld('electronAPI', {
  // Combos
  fetchCombos: (character: string) => ipcRenderer.invoke('fetch-combos', character),
  getCharacterList: () => ipcRenderer.invoke('get-character-list'),
  getDynamicCharacters: () => ipcRenderer.invoke('get-dynamic-characters'),
  clearCache: (character?: string) => ipcRenderer.invoke('clear-cache', character),
  syncAllCharacters: () => ipcRenderer.invoke('sync-all-characters'),
  onSyncProgress: (cb: (p: any) => void) => { const h = (_: any, p: any) => cb(p); ipcRenderer.on('sync-progress', h); return () => ipcRenderer.removeListener('sync-progress', h) },
  
  // Ventana
  toggleClickThrough: () => ipcRenderer.send('toggle-click-through'), // NUEVO
  toggleCollapse: () => ipcRenderer.send('toggle-collapse'),
  toggleHorizontal: () => ipcRenderer.send('toggle-horizontal'),
  setOpacity: (opacity: number) => ipcRenderer.send('set-opacity', opacity),
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  // ... (el resto de tus funciones se mantienen igual)
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  toggleFavorite: (id: string) => ipcRenderer.invoke('toggle-favorite', id),
  isFavorite: (id: string) => ipcRenderer.invoke('is-favorite', id),
  toggleLearned: (id: string) => ipcRenderer.invoke('toggle-learned', id),
  getLearnedCombos: () => ipcRenderer.invoke('get-learned-combos'),
  saveCustomNote: (comboId: string, note: string) => ipcRenderer.invoke('save-custom-note', { comboId, note }),
  getCustomNotes: () => ipcRenderer.invoke('get-custom-notes'),
  exportProfile: () => ipcRenderer.invoke('export-profile'),
  importProfile: () => ipcRenderer.invoke('import-profile'),
  addCustomCombo: (c: Partial<Combo>) => ipcRenderer.invoke('add-custom-combo', c),
  getCustomCombos: (character?: string) => ipcRenderer.invoke('get-custom-combos', character),
  deleteCustomCombo: (id: string) => ipcRenderer.invoke('delete-custom-combo', id),
  fetchYouTubeMeta: (url: string) => ipcRenderer.invoke('fetch-youtube-meta', url),
  openPractice: (combo: Combo) => ipcRenderer.send('open-practice', combo),
  closePractice: () => ipcRenderer.send('close-practice'),
  getPendingPracticeCombo: () => ipcRenderer.invoke('get-pending-practice-combo'),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('set-auto-launch', enable),
  
  // Hotkeys
  onHotkeyToggle: (cb: () => void) => { ipcRenderer.on('hotkey-toggle', cb); return () => ipcRenderer.removeListener('hotkey-toggle', cb) },
  onHorizontalChanged: (cb: (val: boolean) => void) => { const h = (_: any, v: boolean) => cb(v); ipcRenderer.on('horizontal-changed', h); return () => ipcRenderer.removeListener('horizontal-changed', h) },
  onPracticeCombo: (cb: (combo: Combo) => void) => { const h = (_: any, c: Combo) => cb(c); ipcRenderer.on('practice-combo', h); return () => ipcRenderer.removeListener('practice-combo', h) },
  onHotkeyClickThrough: (cb: (isIgnoring: boolean) => void) => { const h = (_: any, v: boolean) => cb(v); ipcRenderer.on('hotkey-click-through-toggle', h); return () => ipcRenderer.removeListener('hotkey-click-through-toggle', h) },
  onHotkeyAddCombo: (cb: () => void) => { ipcRenderer.on('hotkey-add-combo', cb); return () => ipcRenderer.removeListener('hotkey-add-combo', cb) },
  onHotkeyStreamer: (cb: () => void) => { ipcRenderer.on('hotkey-streamer-mode', cb); return () => ipcRenderer.removeListener('hotkey-streamer-mode', cb) },
  
  // Actualizador
  onUpdateAvailable: (cb: (info: any) => void) => { ipcRenderer.on('update-available', (_, info) => cb(info)); return () => ipcRenderer.removeAllListeners('update-available') },
  onUpdateDownloaded: (cb: () => void) => { ipcRenderer.on('update-downloaded', cb); return () => ipcRenderer.removeAllListeners('update-downloaded') },
  startUpdateDownload: () => ipcRenderer.send('start-update-download'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
})