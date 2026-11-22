import { useEffect, useRef, useState } from 'react'
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
  if (token.type === 'image') return <img src={token.src} alt={token.alt} title={token.alt} draggable={false} className="h-[26px] w-auto select-none" loading="eager" onError={(e) => { const span = document.createElement('span'); span.textContent = token.alt; span.className = 'text-[10px] text-white/70 font-mono'; e.currentTarget.parentElement?.replaceChild(span, e.currentTarget) }} />
  if (token.type === 'badge') return <span className={`text-[9px] font-hud px-1.5 py-0.5 rounded ${BADGE_STYLES[token.color]}`}>{token.value}</span>
  return <span className="font-hud text-[10px] text-white/70">{token.value}</span>
}

/** Segundos -> m:ss (o h:mm:ss si supera la hora). */
function fmtSeconds(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`
}

function tagLabel(tag: string, t: (path: string) => string): string {
  // Los tags de escenario no tienen clave de traducción: se muestran con 📍
  if (/^stage:/i.test(tag)) return `📍 ${tag.replace(/^stage:\s*/i, '')}`
  const key = `filters.tags.${tag}`
  const translated = t(key)
  // Si la traducción no existe, getTranslation devuelve la ruta completa
  return translated === key ? tag : translated
}

export default function PracticeView() {
  const [state, setState] = useState<{ combo: Combo | null; index: number; total: number }>({ combo: null, index: -1, total: 0 })
  const [mini, setMini] = useState(false)
  const t = useOverlayStore((s) => s.t)
  const rowRef = useRef<HTMLDivElement>(null)
  // Temporizador y racha (viene del main)
  const [stats, setStats] = useState<{ todaySeconds: number; streak: number } | null>(null)

  useEffect(() => {
    // 1. Al abrir la ventana, pedimos el combo que se quedó "pendiente" en el proceso principal
    window.electronAPI.getPendingPracticeCombo().then((p) => setState(p))

    // 2. Si la ventana ya estaba abierta y hacemos clic en otro combo, lo recibimos por aquí
    const unlisten = window.electronAPI.onPracticeCombo((p) => setState(p))
    const unMini = window.electronAPI.onPracticeMini((m) => setMini(m))
    window.electronAPI.getPracticeMini().then(setMini).catch(() => {})
    return () => { if (typeof unlisten === 'function') unlisten(); unMini() }
  }, [])

  // Temporizador de práctica: 1 latido por segundo + refresco de stats cada 30 s
  useEffect(() => {
    const beat = setInterval(() => window.electronAPI.practiceHeartbeat(), 1000)
    const pull = () => window.electronAPI.getPracticeStats().then(setStats).catch(() => {})
    pull()
    const refresh = setInterval(pull, 30000)
    return () => { clearInterval(beat); clearInterval(refresh) }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.electronAPI.closePractice()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const combo = state.combo
  const tokens = parseNotation(combo?.notation ?? '')

  if (!combo) {
    return <div className="h-full w-full bg-[#0a0a0f] flex items-center justify-center text-white/50 text-xs font-mono">Cargando combo...</div>;
  }

  if (mini) {
    // Mini-tarjeta anclada a la esquina: solo notación + daño, y todo el
    // cuerpo es zona de arrastre para moverla donde no estorbe.
    return (
      <div className="h-full w-full flex items-center gap-2 px-2.5 drag-region bg-[#12121a]/95 border border-white/15 rounded-lg overflow-hidden">
        <span className="text-overlay-accent font-bold uppercase text-[9px] font-hud tracking-wider flex-shrink-0">{combo.character}</span>
        {combo.damage > 0 && <span className="text-[9px] font-mono text-white/60 flex-shrink-0">{combo.damage} DMG</span>}
        <span className="text-white/20 flex-shrink-0">|</span>
        <div ref={rowRef} className="flex-1 flex items-center overflow-x-auto no-drag min-w-0" style={{ scrollbarWidth: 'none' }}
          onWheel={(e) => { if (rowRef.current) rowRef.current.scrollLeft += e.deltaY }}>
          <div className="flex items-center flex-nowrap gap-0 w-max">
            {tokens.map((token, i) => <PracticeToken key={i} token={token} />)}
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {state.total > 1 && <span className="text-white/50 font-mono text-[8px]">{state.index + 1}/{state.total}</span>}
          <button onClick={() => window.electronAPI.togglePracticeMini()} className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 no-drag text-[10px]" title={t('tips.mini_exit')}>⤢</button>
          <button onClick={() => window.electronAPI.closePractice()} className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 no-drag text-[10px]" title={t('tips.close_escape')}>✕</button>
        </div>
      </div>
    )
  }

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
                  {tagLabel(tag, t)}
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

        {/* Modo drill: posición en la lista + navegación ◀ ▶ (también F6/F7) */}
        {state.total > 1 && (
          <>
            <span className="text-white/20">|</span>
            <span className="text-white/50 font-mono">{state.index + 1}/{state.total}</span>
            <button onClick={() => window.electronAPI.practiceNavigate(-1)} className="text-white/40 hover:text-white transition-colors no-drag px-0.5" title={t('tips.prev_combo')}>◀</button>
            <button onClick={() => window.electronAPI.practiceNavigate(1)} className="text-white/40 hover:text-white transition-colors no-drag px-0.5" title={t('tips.next_combo')}>▶</button>
          </>
        )}
        
        <button onClick={async () => { await window.electronAPI.togglePracticePosition() }} className="ml-auto text-white/40 hover:text-white transition-colors no-drag px-1" title={t('tips.position')}>⬍</button>
        <button onClick={() => window.electronAPI.togglePracticeMini()} className="text-white/40 hover:text-white transition-colors no-drag px-1" title={t('tips.mini')}>−</button>
        <button onClick={() => window.electronAPI.closePractice()} className="text-white/30 hover:text-white transition-colors no-drag px-1" title={t('tips.close_escape')}>✕</button>
      </div>

      <div
        ref={rowRef}
        className="flex-1 flex items-center px-2 overflow-x-auto no-drag"
        style={{ scrollbarWidth: 'none' }}
        onWheel={(e) => { if (rowRef.current) rowRef.current.scrollLeft += e.deltaY }}
      >
        <div className="flex items-center flex-nowrap gap-0 w-max">
          {tokens.map((token, i) => <PracticeToken key={i} token={token} />)}
        </div>
      </div>

    </div>
  )
}