import { useEffect, useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'

export default function SyncAllButton() {
  const { t, selectedCharacter, exportCustomCombos, importCustomCombos } = useOverlayStore()
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

  const handleExportCustom = () => {
    if (!selectedCharacter) return
    const json = exportCustomCombos()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tekken8-${selectedCharacter}-custom-combos.json`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMsg(`✅ Custom exportados`)
    setTimeout(() => setBackupMsg(''), 4000)
  }

  const handleImportCustom = () => {
    if (!selectedCharacter) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        await importCustomCombos(text)
        setBackupMsg(`✅ Custom importados`)
        setTimeout(() => setBackupMsg(''), 4000)
      } catch (err) {
        setBackupMsg(`❌ ${(err as Error).message}`)
        setTimeout(() => setBackupMsg(''), 4000)
      }
    }
    input.click()
  }

  const busy = progress !== null && progress.done < progress.total

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
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

      {selectedCharacter && (
        <>
          <div className="w-px h-3 bg-white/10" />
          <button onClick={handleExportCustom} className="text-[9px] font-hud text-emerald-400/70 hover:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 hover:border-emerald-500/40 no-drag" title="Exportar combos custom de este personaje">
            {t('rank.export_custom') || '⬇ Custom'}
          </button>
          <button onClick={handleImportCustom} className="text-[9px] font-hud text-emerald-400/70 hover:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 hover:border-emerald-500/40 no-drag" title="Importar combos custom de este personaje">
            {t('rank.import_custom') || '⬆ Custom'}
          </button>
        </>
      )}

      {done && <span className="text-[9px] text-emerald-400/80">{done.nuevos} nuevos</span>}
      {backupMsg && <span className="text-[9px] text-white/70">{backupMsg}</span>}
    </div>
  )
}
