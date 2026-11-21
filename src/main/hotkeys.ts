import { globalShortcut, BrowserWindow } from 'electron'

export function registerHotkeys(win: BrowserWindow): void {
  // F9: mostrar/ocultar overlay
  globalShortcut.register('F9', () => {
    if (win.isVisible()) win.hide()
    else { win.show(); win.focus() }
  })


  // NUEVO: F1 - Añadir combo rápido
  globalShortcut.register('F1', () => {
    win.webContents.send('hotkey-add-combo')
  })

  // NUEVO: F3 - Alternar Modo Streamer
  globalShortcut.register('F3', () => {
    win.webContents.send('hotkey-streamer-mode')
  })
}

export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
}