import { app, BrowserWindow, shell, globalShortcut, ipcMain } from 'electron'
import { join } from 'path'
import { exec } from 'child_process'
import { registerIpcHandlers } from './ipc-handlers'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'

let mainWindow: BrowserWindow | null = null
let isIgnoringMouse = false // ESTADO GLOBAL
const TEKKEN_EXE = 'TekkenGame-Win64-Shipping.exe'
let tekkenRunning = false
let watcherInterval: ReturnType<typeof setInterval> | null = null

function checkTekken(): void {
  exec(`tasklist /FI "IMAGENAME eq ${TEKKEN_EXE}" /NH`, { windowsHide: true }, (err, stdout) => {
    if (err) return
    const isRunning = stdout.toLowerCase().includes(TEKKEN_EXE.toLowerCase())
    if (isRunning && !tekkenRunning) {
      tekkenRunning = true
      if (mainWindow) { mainWindow.showInactive(); mainWindow.setAlwaysOnTop(true, 'screen-saver') }
    } else if (!isRunning && tekkenRunning) {
      tekkenRunning = false
      if (mainWindow) mainWindow.hide()
    }
  })
}

function startWatcher(): void {
  stopWatcher(); // Stop any existing watcher first
  watcherInterval = setInterval(checkTekken, 3000)
}

function stopWatcher(): void { if (watcherInterval) { clearInterval(watcherInterval); watcherInterval = null } }

function toggleClickThrough(forceState?: boolean) {
  if (!mainWindow) return
  isIgnoringMouse = forceState !== undefined ? forceState : !isIgnoringMouse
  mainWindow.setIgnoreMouseEvents(isIgnoringMouse, { forward: true })
  // Avisamos a la interfaz para que actualice el icono del candado
  mainWindow.webContents.send('hotkey-click-through-toggle', isIgnoringMouse)
}

function createWindow(): void {
  const preload = join(__dirname, '../preload/index.js')
  mainWindow = new BrowserWindow({
    width: 600,  // Tu tamaño preferido
    height: 600, // Tu tamaño preferido
    minWidth: 400, minHeight: 200,
    transparent: true, frame: false, alwaysOnTop: true, skipTaskbar: false, hasShadow: false, resizable: true,
    backgroundColor: '#00000000',
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: false },
  })

  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    // En desarrollo la ventana se muestra al instante. Si no, `npm run dev`
    // parece no hacer nada: en producción se oculta hasta detectar Tekken 8.
    mainWindow.loadURL(devServerUrl)
    mainWindow.showInactive()

    // DevTools provoca los avisos "Autofill.enable/setAddresses failed" de Chromium,
    // así que solo se abren si se piden explícitamente.
    if (process.env['OPEN_DEVTOOLS'] === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    mainWindow.hide()
  }
}

app.whenReady().then(() => {
  createWindow()
  if (mainWindow) { registerIpcHandlers(mainWindow); registerHotkeys(mainWindow) }
  startWatcher(); checkTekken()

  // F8: Le pide al "jefe" que cambie el estado
  globalShortcut.register('F8', () => {
    toggleClickThrough()
  })

  // Escuchar cuando la interfaz hace clic en el candado
  ipcMain.on('toggle-click-through', () => {
    toggleClickThrough()
  })

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('will-quit', () => { unregisterHotkeys(); stopWatcher(); globalShortcut.unregisterAll() })