import { globalShortcut, BrowserWindow } from 'electron'
import { getUserPrefs } from './userPrefs'

export type HotkeyAction = 'toggleClickThrough' | 'toggleOverlay' | 'streamerMode' | 'practiceNext' | 'practicePrev'

interface HotkeyActions {
  toggleClickThrough: () => void
  toggleOverlay: () => void
  streamerMode: () => void
  practiceNext: () => void
  practicePrev: () => void
}

const DEFAULT_HOTKEYS: Record<HotkeyAction, string> = {
  toggleClickThrough: 'F8',
  toggleOverlay: 'F9',
  streamerMode: 'F3',
  practiceNext: 'F7',
  practicePrev: 'F6',
}

let actions: HotkeyActions | null = null

/** Atajos actuales: guardados en user-prefs sobre los valores por defecto. */
export function getHotkeyAccelerators(): Record<HotkeyAction, string> {
  const saved = (getUserPrefs().hotkeys ?? {}) as Partial<Record<HotkeyAction, string>>
  return { ...DEFAULT_HOTKEYS, ...saved }
}

function registerAll(win: BrowserWindow): void {
  if (!actions) return
  const acc = getHotkeyAccelerators()
  const safeRegister = (accelerator: string | undefined, fn: () => void): void => {
    if (!accelerator) return
    try {
      globalShortcut.register(accelerator, fn)
    } catch (e) {
      console.error('[hotkeys] falló al registrar', accelerator, (e as Error).message)
    }
  }

  safeRegister(acc.toggleOverlay, () => {
    if (win.isVisible()) win.hide()
    else { win.show(); win.focus() }
  })
  safeRegister(acc.toggleClickThrough, () => actions?.toggleClickThrough())
  safeRegister(acc.streamerMode, () => win.webContents.send('hotkey-streamer-mode'))
  safeRegister(acc.practiceNext, () => actions?.practiceNext())
  safeRegister(acc.practicePrev, () => actions?.practicePrev())
}

export function registerHotkeys(win: BrowserWindow, hotkeyActions: HotkeyActions): void {
  actions = hotkeyActions
  registerAll(win)
}

/** Re-registra todos los atajos (se usa tras cambiar uno desde la UI). */
export function reapplyHotkeys(win: BrowserWindow): void {
  globalShortcut.unregisterAll()
  registerAll(win)
}

export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
}
