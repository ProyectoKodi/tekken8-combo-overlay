import { createServer, type Server } from 'http'
import { join, extname } from 'path'
import { readFile } from 'fs/promises'

/**
 * Mini-servidor HTTP local para la ventana de vídeo.
 *
 * YouTube rechaza embeds cuyo documento tiene origen nulo (file:// en la
 * app empaquetada) con el "Error 153 del reproductor". Sirviendo el renderer
 * por http://127.0.0.1 el iframe tiene un origen http real y el embed carga.
 * Solo se usa en producción: en dev la ventana usa el servidor de Vite.
 */

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

let server: Server | null = null
let port = 0

export function startVideoServer(): Promise<number> {
  if (server && port) return Promise.resolve(port)
  return new Promise((resolve, reject) => {
    const base = join(__dirname, '../renderer')
    server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1')
        let pathname = decodeURIComponent(url.pathname)
        if (pathname === '/' || pathname === '/index.html') pathname = '/index.html'
        if (pathname.includes('..')) {
          res.writeHead(403)
          res.end()
          return
        }
        const data = await readFile(join(base, pathname))
        res.writeHead(200, {
          'Content-Type': MIME[extname(pathname).toLowerCase()] ?? 'application/octet-stream',
          'Cache-Control': 'no-store',
        })
        res.end(data)
      } catch {
        res.writeHead(404)
        res.end()
      }
    })
    server.listen(0, '127.0.0.1', () => {
      port = (server!.address() as { port: number }).port
      resolve(port)
    })
    server.on('error', reject)
  })
}

export function stopVideoServer(): void {
  server?.close()
  server = null
  port = 0
}
