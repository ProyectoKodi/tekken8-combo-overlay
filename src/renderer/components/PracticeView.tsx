import { useEffect, useState } from 'react'
import type { Combo } from '../types/combo'
import { parseNotation, type NotationToken, type BadgeColor } from '../utils/notationParser'
import { useOverlayStore } from '../store/overlayStore'

const BADGE_STYLES: Record<BadgeColor, string> = {
  wall: 'bg-green-500/90 text-black font-bold', heat: 'bg-red-600/90 text-white font-semibold', move: 'bg-teal-600/90 text-white font-semibold',
  counter: 'bg-amber-500/90 text-black font-bold', char: 'bg-orange-500/90 text-black font-semibold', rage: 'bg-purple-600/90 text-white font-semibold',
}

const TAG_COLORS: Record<string, string> = {
  Heat: 'text-red-400 bg-red-400/10 border-red-400/20', Wall: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Rage: 'text-purple-400 bg-purple-400/10 border-purple-400/20', CH: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Crouch: 'text-green-400 bg-green-400/10 border-green-400/20', Standing: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'No Wall': 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
}

function PracticeToken({ token }: { token: NotationToken }) {
  if (token.type === 'separator') return <img src="https://tekken8combo.kagewebsite.com/tpl/img/input/follow.svg" alt="►" className="h-3 w-auto mx-1 opacity-50" draggable={false} loading="eager" />
  if (token.type === 'image') return <img src={token.src} alt={token.alt} title={token.alt} draggable={false} className="h-[22px] w-auto select-none" loading="eager" onError={(e) => { const span = document.createElement('span'); span.textContent = token.alt; span.className = 'text-[10px] text-white/70 font-mono'; e.currentTarget.parentElement?.replaceChild(span, e.currentTarget) }} />
  if (token.type === 'badge') return <span className={`text-[9px] font-hud px-1.5 py-0.5 rounded ${BADGE_STYLES[token.color]}`}>{token.value}</span>
  return <span className="font-hud text-[10px] text-white/70">{token.value}</span>
}

export default function PracticeView() {
  const [combo, setCombo] = useState<Combo | null>(null)
  const { t } = useOverlayStore()

  useEffect(() => {
    // 1. Al abrir la ventana, pedimos el combo que se quedó "pendiente" en el proceso principal
    window.electronAPI.getPendingPracticeCombo().then((c) => {
      if (c) setCombo(c)
    })

    // 2. Si la ventana ya estaba abierta y hacemos clic en otro combo, lo recibimos por aquí
    const unlisten = window.electronAPI.onPracticeCombo((c) => setCombo(c))
    
    return () => { if (typeof unlisten === 'function') unlisten() }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.electronAPI.closePractice()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!combo) {
    return <div className="h-full w-full bg-[#0a0a0f] flex items-center justify-center text-white/50 text-xs font-mono">Cargando combo...</div>;
  }

  const tokens = parseNotation(combo.notation)

  return (
    <div className="h-full w-full flex flex-col drag-region bg-[#12121a] border-b border-white/20 shadow-lg overflow-hidden">
      
      <div className="flex items-center gap-2.5 px-2 py-0.5 bg-white/5 border-b border-white/10 text-[8px] font-hud">
        <span className="text-overlay-accent font-bold uppercase tracking-wider">{combo.character}</span>
        <span className="text-white/20">|</span>
        
        {combo.damage > 0 && <span className="text-white/60"><span className="text-white/30">DMG</span> {combo.damage}</span>}
        {combo.hits > 0 && <span className="text-white/60"><span className="text-white/30">HITS</span> {combo.hits}</span>}
        
        {combo.difficulty && (
          <>
            <span className="text-white/20">|</span>
            <span className={`font-bold uppercase ${combo.difficulty === 'facil' ? 'text-green-400' : combo.difficulty === 'media' ? 'text-yellow-400' : 'text-red-400'}`}>
              {t(`filters.${combo.difficulty}`)}
            </span>
          </>
        )}

        {combo.tags.length > 0 && (
          <>
            <span className="text-white/20">|</span>
            <div className="flex gap-1">
              {combo.tags.map(tag => (
                <span key={tag} className={`px-1.5 py-[1px] rounded border ${TAG_COLORS[tag] || 'text-white/60 bg-white/5 border-white/10'}`}>
                  {t(`filters.tags.${tag}`) || tag}
                </span>
              ))}
            </div>
          </>
        )}

        {combo.creator && (
          <>
            <span className="text-white/20">|</span>
            <span className="text-white/40 truncate max-w-[100px]">{t('labels.by')} {combo.creator}</span>
          </>
        )}
        
        <button onClick={() => window.electronAPI.closePractice()} className="ml-auto text-white/30 hover:text-white transition-colors no-drag px-1" title="Cerrar (Escape)">✕</button>
      </div>

      <div className="flex-1 flex items-center px-2 overflow-hidden no-drag">
        <div className="flex items-center flex-nowrap overflow-hidden gap-0">
          {tokens.map((token, i) => <PracticeToken key={i} token={token} />)}
        </div>
      </div>

    </div>
  )
}