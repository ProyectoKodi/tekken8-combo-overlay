import { useEffect, useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import { pushToast } from '../store/toastStore'

/**
 * Botón pill de sincronización (estilo «Enfoque»/«Recientes»). Sincroniza
 * todos los personajes, informa por toasts y muestra el progreso en línea.
 */
export default function SyncButton() {
  const t = useOverlayStore((s) => s.t)
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null)

  useEffect(() => {
    const un = window.electronAPI.onSyncProgress((p) => setProgress(p))
    return () => { if (typeof un === 'function') un() }
  }, [])

  const sync = async () => {
    const res = await window.electronAPI.syncAllCharacters()
    setProgress(null)
    if (!res.alreadyRunning) {
      pushToast(t('toasts.sync_done', { total: res.total, nuevos: res.nuevos }), 'ok', 5000)
      if (res.failed?.length > 0) {
        pushToast(t('toasts.sync_failed', { count: res.failed.length, names: res.failed.join(', ') }), 'warn', 8000)
      }
    }
  }

  const busy = progress !== null && progress.done < progress.total

  return (
    <button
      onClick={sync}
      disabled={busy}
      className={`text-[9px] font-hud px-2 py-0.5 rounded border transition-colors no-drag cursor-pointer disabled:opacity-60 ${
        busy ? 'bg-sky-500/30 border-sky-500/60 text-sky-300' : 'bg-transparent border-white/8 text-white/40 hover:text-white/80'
      }`}
      title={t('tips.sync_all')}
    >
      {busy ? `Sync ${progress!.done}/${progress!.total}` : '↻ Sync'}
    </button>
  )
}
