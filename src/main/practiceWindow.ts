import { BrowserWindow, screen, ipcMain } from 'electron'
import { join } from 'path'
import type { Combo } from '../renderer/types/combo'

let practiceWindow: BrowserWindow | null = null
let pendingCombo: Combo | null = null // Guardamos el combo temporalmente aquí

export function openPracticeWindow(combo: Combo): void {
  // Guardamos el combo para que la ventana lo recoja
  pendingCombo = combo

  // Si la ventana ya existe, solo le enviamos el nuevo combo y la traemos al frente
  if (practiceWindow) {
    practiceWindow.webContents.send('practice-combo', combo)
    practiceWindow.showInactive()
    return
  }

  const { width: screenW } = screen.getPrimaryDisplay().workAreaSize

  practiceWindow = new BrowserWindow({
    width: screenW,
    height: 45,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  practiceWindow.setAlwaysOnTop(true, 'screen-saver')
  practiceWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  practiceWindow.setIgnoreMouseEvents(false)

  if (process.env['ELECTRON_RENDERER_URL']) {
    practiceWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?mode=practice`)
  } else {
    practiceWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: 'mode=practice' })
  }

  practiceWindow.on('closed', () => {
    practiceWindow = null
  })
}

export function registerPracticeIpc(): void {
  // La ventana de práctica llamará a esto en cuanto esté lista
  ipcMain.handle('get-pending-practice-combo', () => {
    return pendingCombo
  })

  ipcMain.on('close-practice', () => {
    if (practiceWindow) {
      practiceWindow.close()
      practiceWindow = null
    }
    pendingCombo = null
  })
}