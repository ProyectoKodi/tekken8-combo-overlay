import { useEffect, useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'

export default function SyncAllButton() {
  const { t } = useOverlayStore()
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null)
  const [done, setDone] = useState<{ total: number; nuevos: number } | null>(null)
  const [backupMsg, setBackupMsg] = useState('')

  useEffect(() => {
    const un = window.electronAPI.onSyncProgress((p) => setProgress(p))
    return () => { if (typeof un === 'function') un() }
  }, [])

  const sync = async () => {
    setDone(null)
    const res = await window.electronAPI.syncAllCharacters()
    setProgress(null)
    setDone(res)
    setTimeout(() => setDone(null), 5000)
  }

  const handleExport = async () => {
    const res = await window.electronAPI.exportProfile()
    if (res.ok) {
      setBackupMsg(`✅ Perfil exportado`)
      setTimeout(() => setBackupMsg(''), 4000)
    }
  }

  const handleImport = async () => {
    const res = await window.electronAPI.importProfile()
    if (res.ok) {
      setBackupMsg(`✅ ${res.added} combos nuevos`)
      setTimeout(() => setBackupMsg(''), 4000)
    } else if (res.error && res.error !== 'Cancelado') {
      setBackupMsg(`❌ ${res.error}`)
      setTimeout(() => setBackupMsg(''), 4000)
    }
  }

  const busy = progress !== null && progress.done < progress.total

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={sync} disabled={busy} className="text-[9px] font-hud text-sky-400/70 hover:text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 hover:border-sky-500/40 no-drag disabled:opacity-40" title="Sincronizar todos los personajes">
        {busy ? `Sync ${progress!.done}/${progress!.total}…` : '↻ Sync'}
      </button>

      <div className="w-px h-3 bg-white/10" />

      <button onClick={handleExport} className="text-[9px] font-hud text-amber-400/70 hover:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 hover:border-amber-500/40 no-drag" title="Exportar mi perfil completo">
        ⬇ Perfil
      </button>
      <button onClick={handleImport} className="text-[9px] font-hud text-amber-400/70 hover:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 hover:border-amber-500/40 no-drag" title="Importar un perfil de un amigo">
        ⬆ Perfil
      </button>

      {done && <span className="text-[9px] text-emerald-400/80">{done.nuevos} nuevos</span>}
      {backupMsg && <span className="text-[9px] text-white/70">{backupMsg}</span>}
    </div>
  )
}