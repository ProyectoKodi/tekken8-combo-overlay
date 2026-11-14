import { useState, useEffect } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import { CHARACTER_SLUGS } from '../types/combo'

const CHAR_BASE = 'https://tekken8combo.kagewebsite.com/tpl/img/char'

function CharacterCard({ name, slug, onSelect }: { name: string; slug: string; onSelect: () => void }) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <button onClick={onSelect} className="group relative flex flex-col items-center rounded-lg border border-white/8 bg-black/40 hover:border-overlay-accent/60 hover:bg-overlay-accent/20 transition-all cursor-pointer overflow-hidden no-drag" title={name}>
      <div className="w-full aspect-square overflow-hidden bg-black/40 relative">
        {!imgFailed ? (
          <img src={`${CHAR_BASE}/${slug}.jpg`} alt={name} draggable={false} className="w-full h-full object-cover object-top transition-transform duration-200 group-hover:scale-105" onError={() => setImgFailed(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5"><span className="text-xs font-hud font-bold text-white/50">{initials}</span></div>
        )}
      </div>
      <div className="w-full px-1 py-0.5 text-center bg-black/60">
        <span className="text-[8px] font-hud font-semibold text-white/65 group-hover:text-overlay-accent transition-colors leading-tight block truncate">{name}</span>
      </div>
    </button>
  )
}

export default function CharacterSelector() {
  const { setCharacter, loading, dynamicCharacters, loadDynamicCharacters, t } = useOverlayStore()
  useEffect(() => { loadDynamicCharacters() }, [loadDynamicCharacters])
  const rawList = dynamicCharacters || CHARACTER_SLUGS
  const uniqueList: Record<string, string> = {}
  Object.entries(rawList).forEach(([name, slug]) => { const cleanName = name.replace(/combos?/gi, '').trim(); if (!uniqueList[cleanName]) uniqueList[cleanName] = slug })

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 cursor-crosshair custom-scroll w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-[10px] text-white/50 font-hud uppercase tracking-widest">{t('labels.select_char') || 'Selecciona un personaje'}</p>
        {dynamicCharacters && <span className="text-[9px] text-emerald-400/70 font-hud">✓ Actualizado</span>}
      </div>
      {/* Cuadrícula de 5 columnas */}
      <div className="grid grid-cols-5 gap-1">
        {Object.entries(uniqueList).map(([name, slug]) => (
          <CharacterCard key={name} name={name} slug={slug} onSelect={() => !loading && setCharacter(name)} />
        ))}
      </div>
    </div>
  )
}