import { BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { startVideoServer, stopVideoServer } from './videoServer'

/** User-Agent de Chrome normal: YouTube a veces bloquea embeds a clientes
 * con UA de Electron/webview. */
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/**
 * Mini-ventana flotante con el vídeo del combo (YouTube embebido).
 * No abre el navegador: es una ventana propia del overlay, siempre visible
 * encima del juego, con autoplay y cierre con Escape.
 */

let videoWindow: BrowserWindow | null = null
let pendingVideo: string | null = null

export async function openVideoWindow(url: string): Promise<void> {
  if (!url) return
  pendingVideo = url

  if (videoWindow && !videoWindow.isDestroyed()) {
    videoWindow.webContents.send('video-url', pendingVideo)
    videoWindow.showInactive()
    videoWindow.setAlwaysOnTop(true, 'screen-saver')
    return
  }

  videoWindow = new BrowserWindow({
    width: 560,
    height: 352, // 32 px de barra + 16:9 de 560
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: true,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  })

  videoWindow.setAlwaysOnTop(true, 'screen-saver')
  videoWindow.webContents.setUserAgent(CHROME_UA)

  // Diagnóstico: si el embed falla, queda en el log del main
  videoWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[video] did-fail-load', code, desc, url)
  })
  videoWindow.webContents.on('console-message', (_e, level, msg) => {
    if (level >= 2) console.error('[video] console:', msg)
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    videoWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?mode=video`)
  } else {
    // Producción: servido por HTTP local (127.0.0.1). Con file:// el origen
    // del iframe de YouTube es nulo y el embed falla con "Error 153".
    const port = await startVideoServer()
    void videoWindow.loadURL(`http://127.0.0.1:${port}/index.html?mode=video`)
  }

  videoWindow.webContents.on('did-finish-load', () => {
    if (videoWindow && !videoWindow.isDestroyed() && pendingVideo) {
      videoWindow.webContents.send('video-url', pendingVideo)
    }
  })

  videoWindow.on('closed', () => {
    videoWindow = null
  })
}

export function registerVideoIpc(): void {
  ipcMain.handle('get-pending-video', () => pendingVideo)

  ipcMain.on('open-video', (_, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) void openVideoWindow(url)
  })

  ipcMain.on('close-video', () => {
    if (videoWindow && !videoWindow.isDestroyed()) videoWindow.close()
  })

  // Fallback: abrir el vídeo en el navegador del usuario
  ipcMain.on('open-external', (_, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) void shell.openExternal(url)
  })}

/** Se cierra junto con el programa. */
export function closeVideoWindow(): void {
  if (videoWindow && !videoWindow.isDestroyed()) videoWindow.close()
  videoWindow = null
  pendingVideo = null
  stopVideoServer()
}
