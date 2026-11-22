import { useEffect, useRef, useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'

/**
 * Ventana flotante de vídeo del combo: YouTube embebido con autoplay,
 * siempre visible encima del juego. Barra mínima con cierre (Escape o ✕).
 *
 * YouTube elige la calidad según el TAMAÑO del reproductor: a 560 px arranca
 * en 360p. Para fijar 720p el iframe se renderiza a 1280×720 reales y se
 * escala con CSS al tamaño de la ventana.
 */

// Tamaño interno del reproductor que garantiza 720p en YouTube
const PLAYER_W = 1280
const PLAYER_H = 720

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    let id = ''
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1)
    else if (u.pathname.includes('/shorts/')) id = u.pathname.split('/shorts/')[1] ?? ''
    else if (u.pathname.includes('/embed/')) id = u.pathname.split('/embed/')[1] ?? ''
    else id = u.searchParams.get('v') ?? ''
    id = id.split('/')[0]
    if (!id) return url
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&iv_load_policy=3`
  } catch {
    return url
  }
}

export default function VideoView() {
  const t = useOverlayStore((s) => s.t)
  const [src, setSrc] = useState<string | null>(null)
  const [scale, setScale] = useState(() =>
    Math.min((window.innerWidth - 0) / PLAYER_W, (window.innerHeight - 32) / PLAYER_H)
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.electronAPI.getPendingVideo().then(setSrc)
    const un = window.electronAPI.onVideoUrl(setSrc)
    return () => { if (typeof un === 'function') un() }
  }, [])

  // El reproductor grande se escala al tamaño real de la ventana
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) setScale(Math.min(width / PLAYER_W, height / PLAYER_H))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [src])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.electronAPI.closeVideo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="h-screen w-screen bg-black flex flex-col no-drag">
      <div className="h-8 flex items-center justify-between px-2 bg-[#12121a] border-b border-white/10 shrink-0">
        <span className="text-[10px] font-hud text-white/50 uppercase tracking-widest">Vídeo del combo</span>
        <div className="flex items-center gap-1">
          {/* Respaldo: si el embed falla (vídeo con reproducción restringida),
              se abre en el navegador con un clic */}
          {src && (
            <button
              onClick={() => window.electronAPI.openExternal(src)}
              className="text-[9px] font-hud text-sky-300/70 hover:text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/20 hover:border-sky-500/40"
              title={t('tips.open_youtube')}
            >
              ↗ YouTube
            </button>
          )}
          <button
            onClick={() => window.electronAPI.closeVideo()}
            className="text-white/40 hover:text-white text-sm leading-none px-1"
            title={t('tips.close_escape')}
          >
            ✕
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 bg-black overflow-hidden flex items-center justify-center">
        {src ? (
          <iframe
            src={toEmbedUrl(src)}
            width={PLAYER_W}
            height={PLAYER_H}
            title={t('tips.video')}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{
              border: 0,
              flexShrink: 0,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-white/40 text-xs font-mono">
            Cargando vídeo...
          </div>
        )}
      </div>
    </div>
  )
}
