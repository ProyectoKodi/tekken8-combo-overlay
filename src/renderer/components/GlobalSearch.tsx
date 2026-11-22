import { useEffect, useRef, useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import type { Combo } from '../types/combo'

interface GlobalResult { character: string; combo: Combo }

/**
 * Búsqueda global (Ctrl+F): busca notación, autor, etiqueta o nota en el
 * caché de TODOS los personajes sincronizados, sin salir de la vista actual.
 */
export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const t = useOverlayStore((s) => s.t)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalResult[] | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResults(null); return }
    debounceRef.current = setTimeout(() => {
      window.electronAPI.getGlobalCombos(query).then(setResults).catch(() => setResults([]))
    }, 200)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const open = (r: GlobalResult) => {
    const store = useOverlayStore.getState()
    store.setCharacter(r.character)
    // Al abrir el personaje, dejar aplicado el filtro para ver solo las
    // coincidencias de esa búsqueda
    store.setFilter({ searchQuery: query })
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    if (e.key === 'Enter' && results && results.length > 0) open(results[0])
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4 cursor-crosshair" onClick={onClose}>
      <div className="w-full max-w-md bg-[#12121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <span className="text-white/40 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-white text-sm font-hud outline-none placeholder-white/25"
          />
          <button onClick={onClose} className="text-white/30 hover:text-white text-xs no-drag">✕</button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto custom-scroll">
          {results === null && (
            <p className="px-4 py-6 text-center text-[10px] text-white/30 font-hud">{t('search.hint')}</p>
          )}
          {results !== null && results.length === 0 && (
            <p className="px-4 py-6 text-center text-[10px] text-white/40 font-hud">{t('search.empty')}</p>
          )}
          {results?.map((r) => (
            <button
              key={r.combo.id}
              onMouseDown={() => open(r)}
              className="w-full text-left px-3 py-2 hover:bg-overlay-accent/15 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-hud font-bold uppercase text-overlay-accent">{r.character}</span>
                {r.combo.damage > 0 && <span className="text-[9px] font-mono text-white/40">{r.combo.damage} DMG</span>}
                {r.combo.creator && <span className="text-[9px] text-white/25 truncate">{r.combo.creator}</span>}
              </div>
              <p className="text-[11px] font-mono text-white/70 truncate">{r.combo.notation}</p>
            </button>
          ))}
        </div>

        <div className="px-3 py-1.5 border-t border-white/10 text-[8px] text-white/25 font-mono flex justify-between">
          <span>Ctrl+F</span>
          <span>Enter · Esc</span>
        </div>
      </div>
    </div>
  )
}
