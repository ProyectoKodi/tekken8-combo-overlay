import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { execFile } from 'child_process'
import { registerIpcHandlers } from './ipc-handlers'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { loadWindowState, saveWindowState } from './windowState'
import { closePracticeWindow, navigatePractice } from './practiceWindow'
import { closeVideoWindow } from './videoWindow'
import { registerBannerProtocolPrivileges, registerBannerProtocolHandler, prewarmSharePortraits } from './bannerProtocol'

// Privilegios del protocolo banner:// (debe ser antes de app ready)
registerBannerProtocolPrivileges()

let mainWindow: BrowserWindow | null = null
// Estado del candado (F8 / botón 🔒): mientras está activo los clics pasan al juego…
let clickThroughEnabled = false
// …excepto cuando el cursor está sobre un control marcado con [data-safe],
// así el candado siempre se puede desactivar con el mouse sin pulsar F8.
let pointerOverSafeZone = false
// Referencia del nombre típico del juego; la detección real (checkTekken)
// barre TODOS los procesos porque el nombre varía entre versiones/canales.
const TEKKEN_EXE = 'TekkenGame-Win64-Shipping.exe'
let tekkenRunning = false
// El aviso de "Tekken detectado" (mostrar overlay) solo se da una vez por sesión:
// al cerrar el juego se vuelve a armar para el siguiente arranque.
let tekkenRunningShown = false
let watcherInterval: ReturnType<typeof setInterval> | null = null

function checkTekken(): void {
  // Listado completo (CSV) en vez de filtro por nombre exacto: el nombre del
  // ejecutable del juego varía entre versiones/canales, y un nombre fijo
  // dejaba el indicador y el auto-show sin funcionar. Excluimos el propio
  // overlay (su exe también contiene "Tekken").
  execFile('tasklist', ['/FO', 'CSV', '/NH'], { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => {
    if (err) return
    const isRunning = stdout.split(/\r?\n/).some(
      (line) => /tekken/i.test(line) && !/overlay/i.test(line),
    )
    if (isRunning !== tekkenRunning) {
      tekkenRunning = isRunning
      // Avisar a la interfaz para el indicador "Tekken" de la barra
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('tekken-status', isRunning)
    }
    if (isRunning && !tekkenRunningShown) {
      // El juego se abrió: mostrar el overlay (una vez por sesión de juego)
      tekkenRunningShown = true
      if (mainWindow) { mainWindow.showInactive(); mainWindow.setAlwaysOnTop(true, 'screen-saver') }
    } else if (!isRunning && tekkenRunningShown) {
      // El juego se cerró: ocultar SOLO si estaba visible por el juego;
      // sin esta guarda, la ventana se escondía a los 3s de arrancar.
      tekkenRunningShown = false
      if (mainWindow) mainWindow.hide()
    }
  })
}

function startWatcher(): void {
  stopWatcher(); // Stop any existing watcher first
  watcherInterval = setInterval(checkTekken, 3000)
}

function stopWatcher(): void { if (watcherInterval) { clearInterval(watcherInterval); watcherInterval = null } }

function applyClickThrough(): void {
  if (!mainWindow) return
  mainWindow.setIgnoreMouseEvents(clickThroughEnabled && !pointerOverSafeZone, { forward: true })
}

function toggleClickThrough(forceState?: boolean) {
  clickThroughEnabled = forceState !== undefined ? forceState : !clickThroughEnabled
  applyClickThrough()
  // Avisamos a la interfaz para que actualice el icono del candado
  mainWindow?.webContents.send('hotkey-click-through-toggle', clickThroughEnabled)
}

function createWindow(): void {
  const preload = join(__dirname, '../preload/index.js')
  const saved = loadWindowState()
  mainWindow = new BrowserWindow({
    width: saved?.width ?? 600,  // Tu tamaño preferido
    height: saved?.height ?? 600, // Tu tamaño preferido
    ...(saved?.x !== undefined && saved?.y !== undefined ? { x: saved.x, y: saved.y } : {}),
    minWidth: 400, minHeight: 200,
    transparent: true, frame: false, alwaysOnTop: true, skipTaskbar: false, hasShadow: false, resizable: true,
    backgroundColor: '#00000000',
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: false },
  })

  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })

  // Recordar posición y tamaño: guardado con debounce en move/resize y al cerrar
  let saveStateTimer: ReturnType<typeof setTimeout> | null = null
  const scheduleSaveState = () => {
    if (saveStateTimer) clearTimeout(saveStateTimer)
    saveStateTimer = setTimeout(() => { if (mainWindow) saveWindowState(mainWindow) }, 500)
  }
  mainWindow.on('move', scheduleSaveState)
  mainWindow.on('resize', scheduleSaveState)
  mainWindow.on('close', () => { if (mainWindow) saveWindowState(mainWindow) })
  // Al cerrar la ventana principal se va también la tira de práctica:
  // el overlay de arriba no debe quedar visible con el programa cerrado.
  mainWindow.on('closed', () => { closePracticeWindow(); closeVideoWindow(); mainWindow = null })

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
  registerBannerProtocolHandler()
  createWindow()
  // Copia los retratos a userData para la tarjeta de progreso (solo faltantes)
  prewarmSharePortraits().catch(() => {})
  if (mainWindow) {
    registerIpcHandlers(mainWindow)
    registerHotkeys(mainWindow, {
      toggleClickThrough: () => toggleClickThrough(),
      toggleOverlay: () => {
        if (mainWindow?.isVisible()) mainWindow.hide()
        else { mainWindow?.show(); mainWindow?.focus() }
      },
      streamerMode: () => mainWindow?.webContents.send('hotkey-streamer-mode'),
      practiceNext: () => navigatePractice(1),
      practicePrev: () => navigatePractice(-1),
    })
  }
  startWatcher(); checkTekken()

  // Escuchar cuando la interfaz hace clic en el candado
  ipcMain.on('toggle-click-through', () => {
    toggleClickThrough()
  })

  // El renderer avisa en cada mousemove si el cursor está sobre un control
  // interactivo (barra superior). Solo ahí se reactiva el mouse aunque el
  // candado esté activo; el resto del overlay sigue dejando pasar los clics.
  ipcMain.on('set-click-through-hover', (_, safe: boolean) => {
    pointerOverSafeZone = !!safe
    applyClickThrough()
  })

  // El renderer consulta el estado del watcher de Tekken para el indicador
  ipcMain.handle('get-tekken-status', () => tekkenRunning)

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('will-quit', () => { closePracticeWindow(); closeVideoWindow(); unregisterHotkeys(); stopWatcher() })