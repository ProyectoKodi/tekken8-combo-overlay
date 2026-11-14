import { useState } from 'react'
import { CHARACTER_NAMES, DIFFICULTY_LABELS_ES, ALL_TAGS, TAG_LABELS_ES } from '../types/combo'

interface Props { onClose: () => void; onSaved: () => void }

export default function AddComboForm({ onClose, onSaved }: Props) {
  const [character, setCharacter] = useState(CHARACTER_NAMES[0])
  const [notation, setNotation] = useState('')
  const [damage, setDamage] = useState(0)
  const [hits, setHits] = useState(0)
  const [difficulty, setDifficulty] = useState<'facil' | 'media' | 'dificil' | ''>('')
  const [tags, setTags] = useState<string[]>([])
  const [creator, setCreator] = useState('')
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [ytUrl, setYtUrl] = useState('')
  const [ytLoading, setYtLoading] = useState(false)
  const [error, setError] = useState('')

  const importarYouTube = async () => {
    if (!ytUrl) return
    setYtLoading(true)
    const res = await window.electronAPI.fetchYouTubeMeta(ytUrl)
    setYtLoading(false)
    if (res.ok) {
      setCreator(res.uploader ?? '')
      setSource(res.source ?? ytUrl)
      if (!notes) setNotes(res.title ?? '')
    } else {
      setError(res.error ?? 'No se pudo leer el vídeo')
    }
  }

  const guardar = async () => {
    setError('')
    if (!notation.trim()) { setError('La notación es obligatoria'); return }
    const res = await window.electronAPI.addCustomCombo({
      character, notation, damage, hits, difficulty: difficulty || undefined,
      tags, creator, source, notes,
    })
    if (res.ok) { onSaved(); onClose() }
    else setError(res.error ?? 'Error al guardar')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 no-drag">
      <div className="bg-zinc-900 border border-white/10 rounded-lg w-full max-w-md p-4 space-y-3">
        <h2 className="text-sm font-hud font-bold text-overlay-accent">Añadir combo personalizado</h2>

        <div className="grid grid-cols-2 gap-2">
          <select value={character} onChange={(e) => setCharacter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
            {CHARACTER_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
            <option value="">Dificultad…</option>
            {Object.entries(DIFFICULTY_LABELS_ES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <input value={notation} onChange={(e) => setNotation(e.target.value)}
          placeholder="Notación (ej: d/f,2 ► b,1,4)"
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />

        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={damage} onChange={(e) => setDamage(+e.target.value)}
            placeholder="Daño" className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
          <input type="number" value={hits} onChange={(e) => setHits(+e.target.value)}
            placeholder="Golpes" className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
        </div>

        <div className="flex flex-wrap gap-1">
          {ALL_TAGS.map(t => (
            <button key={t}
              onClick={() => setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t])}
              className={`text-[10px] px-2 py-0.5 rounded border ${
                tags.includes(t) ? 'bg-overlay-accent/30 border-overlay-accent text-white' : 'bg-white/5 border-white/10 text-white/60'
              }`}>
              {TAG_LABELS_ES[t] ?? t}
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 pt-2 space-y-2">
          <div className="flex gap-2">
            <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)}
              placeholder="URL de YouTube (opcional)"
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
            <button onClick={importarYouTube} disabled={ytLoading}
              className="text-xs px-2 py-1 rounded bg-red-600/70 hover:bg-red-600 text-white">
              {ytLoading ? '…' : 'Importar'}
            </button>
          </div>
          <input value={creator} onChange={(e) => setCreator(e.target.value)}
            placeholder="Autor" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
          <input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas / título del vídeo"
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs px-3 py-1 rounded border border-white/10 text-white/60 hover:text-white">Cancelar</button>
          <button onClick={guardar} className="text-xs px-3 py-1 rounded bg-overlay-accent text-black font-bold hover:opacity-90">Guardar</button>
        </div>
      </div>
    </div>
  )
}