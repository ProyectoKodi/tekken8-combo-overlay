import { memo, useMemo, useState } from 'react'
import type { Combo } from '../types/combo'
import { parseNotation, type NotationToken, type BadgeColor } from '../utils/notationParser'
import { useOverlayStore } from '../store/overlayStore'
import { pushToast } from '../store/toastStore'
import { playDing } from '../utils/sound'

interface Props { combo: Combo; index?: number; style?: React.CSSProperties }

const BADGE_STYLES: Record<BadgeColor, string> = {
  wall: 'bg-green-500/90 text-black font-bold', heat: 'bg-red-600/90 text-white font-semibold', move: 'bg-teal-600/90 text-white font-semibold',
  counter: 'bg-amber-500/90 text-black font-bold', char: 'bg-orange-500/90 text-black font-semibold', rage: 'bg-purple-600/90 text-white font-semibold',
}
const TAG_STYLES: Record<string, string> = {
  Heat: 'bg-red-900/60 text-red-300 border-red-700/50', Wall: 'bg-blue-900/60 text-blue-300 border-blue-700/50', Rage: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
  CH: 'bg-amber-900/60 text-amber-300 border-amber-700/50', Crouch: 'bg-green-900/60 text-green-300 border-green-700/50', Standing: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
  'No Wall': 'bg-zinc-800/60 text-zinc-400 border-zinc-600/50', 'Floor Break': 'bg-orange-900/60 text-orange-300 border-orange-700/50',
}
/** Etiquetas de situación que colorean la tarjeta; en un Set para lookup O(1). */
const DANGEROUS_TAGS = new Set(['Heat', 'Rage', 'CH'])

const TagBadge = memo(function TagBadge({ tag }: { tag: string }) {
  const t = useOverlayStore((s) => s.t)
  if (/^stage:/i.test(tag)) return <span className="text-[9px] font-hud px-1.5 py-0.5 rounded border bg-slate-800/70 text-slate-300/80 border-slate-600/40 flex-shrink-0">📍 {tag.replace(/^stage:\s*/i, '')}</span>
  const style = TAG_STYLES[tag] ?? 'bg-white/10 text-white/60 border-white/15'
  return <span className={`text-[9px] font-hud font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${style}`}>{t(`filters.tags.${tag}`) || tag}</span>
})

const RenderToken = memo(function RenderToken({ token }: { token: NotationToken }) {
  if (token.type === 'separator') return <img src="https://tekken8combo.kagewebsite.com/tpl/img/input/follow.svg" alt="►" className="h-5 w-auto mx-1 opacity-40" draggable={false} />
  if (token.type === 'image') return <img src={token.src} alt={token.alt} title={token.alt} draggable={false} className="h-6 w-auto select-none" style={{ imageRendering: 'crisp-edges' }} onError={(e) => { const parent = e.currentTarget.parentElement; if (parent) { const span = document.createElement('span'); span.textContent = token.alt; span.className = 'text-[10px] text-white/70 font-mono'; parent.replaceChild(span, e.currentTarget) } }} />
  if (token.type === 'badge') return <span className={`text-[10px] font-hud px-2 py-0.5 rounded ${BADGE_STYLES[token.color]}`}>{token.value}</span>
  return <span className="text-[11px] font-hud text-white/55">{token.value}</span>
})

/**
 * La notación visual solo se re-parsea si cambia el texto: con el memo y el
 * useMemo, desplazarse o cambiar filtros no re-analiza las decenas de
 * notaciones visibles en cada render.
 */
const NotationDisplay = memo(function NotationDisplay({ notation }: { notation: string }) {
  const t = useOverlayStore((s) => s.t)
  const tokens = useMemo(() => parseNotation(notation), [notation])
  if (!tokens.length) return <p className="font-mono text-xs text-white/60 italic">{t('labels.no_notation')}</p>
  return <div className="flex flex-wrap items-center gap-x-0.5 gap-y-1">{tokens.map((token, i) => <RenderToken key={i} token={token} />)}</div>
})

/** Botón circular de opción, siempre visible (estilo ficha de la web). */
function RoundButton({ onClick, title, active = false, danger = false, children }: {
  onClick: (e: React.MouseEvent) => void
  title: string
  active?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  const base = 'w-7 h-7 rounded-full flex items-center justify-center text-[12px] leading-none no-drag transition-all border cursor-pointer flex-shrink-0'
  const look = danger
    ? 'bg-red-950/50 border-red-500/30 text-red-300/80 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/50'
    : active
      ? 'bg-overlay-accent/25 border-overlay-accent/60 text-overlay-accent'
      : 'bg-white/[0.06] border-white/10 text-white/45 hover:bg-white/[0.12] hover:text-white/90 hover:border-white/25'
  return (
    <button onClick={onClick} title={title} className={`${base} ${look}`}>
      {children}
    </button>
  )
}

/**
 * memo + suscripción por selectores: una tarjeta solo se re-renderiza si
 * cambia SU combo, su estado de favorito/aprendido o el modo torneo. Con el
 * store entero suscrito, cualquier cambio de la app repintaba todas.
 */
const ComboCard = memo(function ComboCard({ combo, index = 0, style }: Props) {
  const [justStarred, setJustStarred] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(combo.customNote || '')

  // Selectores finos: cada campo por separado, no el store entero
  const t = useOverlayStore((s) => s.t)
  const addRecentCombo = useOverlayStore((s) => s.addRecentCombo)
  const toggleFavorite = useOverlayStore((s) => s.toggleFavorite)
  const toggleLearned = useOverlayStore((s) => s.toggleLearned)
  const isTournamentMode = useOverlayStore((s) => s.isTournamentMode)
  const alwaysShowActions = useOverlayStore((s) => s.alwaysShowActions)
  const compactList = useOverlayStore((s) => s.compactList)
  const soundFeedback = useOverlayStore((s) => s.soundFeedback)
  const isFav = useOverlayStore((s) => s.favoriteIds.has(combo.id))
  const isLearn = useOverlayStore((s) => s.learnedIds.has(combo.id))
  const isDangerous = combo.tags.some((t) => DANGEROUS_TAGS.has(t))

  const openPractice = () => { addRecentCombo(combo); window.electronAPI.openPractice(combo) }

  const copyNotation = (e: React.MouseEvent) => {
    e.stopPropagation()
    const dmg = combo.damage > 0 ? ` | ${combo.damage} DMG` : ''
    const hits = combo.hits > 0 ? ` | ${combo.hits} HITS` : ''
    const tags = combo.tags.length > 0 ? ` | [${combo.tags.join(', ')}]` : ''
    const creator = combo.creator ? ` | ${t('labels.by')}: ${combo.creator}` : ''
    navigator.clipboard.writeText(`[${combo.character}${dmg}${hits}${tags}${creator}]\n${combo.notation}`).then(() => pushToast(t('toasts.copied'), 'ok'))
  }

  // Copiar texto formateado para pegar en Discord
  const copyDiscordLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `**${combo.character}** | ${combo.damage} DMG | ${combo.notation}\n> ${combo.creator ? `Autor: ${combo.creator} | ` : ''}Copia esto en Tekken 8 Overlay: ${combo.notation}`
    navigator.clipboard.writeText(text).then(() => pushToast(t('toasts.copied_discord'), 'ok'))
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasFav = isFav
    toggleFavorite(combo.id)
    if (!wasFav) { setJustStarred(true); setTimeout(() => setJustStarred(false), 300) }
  }

  const handleToggleLearned = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLearn && soundFeedback) playDing()
    toggleLearned(combo.id)
  }

  const saveNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.electronAPI.saveCustomNote(combo.id, noteText)
    setIsEditingNote(false)
    combo.customNote = noteText
    pushToast(t('toasts.note_saved'), 'ok')
  }

  // Modo compacto: una línea por combo (notación + daño + ★) para consultar
  // rápido. El clic sigue abriendo la práctica.
  if (compactList) {
    return (
      <div style={{ ...style, animationDelay: `${Math.min(index, 15) * 20}ms` }} onClick={openPractice} title={t('actions.practice')}
        className={`mx-4 mb-1 rounded-lg overflow-hidden border border-white/8 hover:border-overlay-accent/40 hover:bg-white/[0.06] transition-all group cursor-pointer animate-combo-enter flex items-center gap-2 px-3 py-1.5 ${isLearn ? 'bg-emerald-900/10' : 'bg-white/[0.03]'}`}>
        <RoundButton onClick={handleToggleFavorite} title={t('tips.favorite')} active={isFav}>
          <span className={justStarred ? 'animate-star-pop' : ''}>{isFav ? '★' : '☆'}</span>
        </RoundButton>
        <span className="font-mono text-[11px] text-white/80 truncate flex-1 min-w-0">{combo.notation}</span>
        {combo.isNew && <span className="text-[8px] font-bold text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded flex-shrink-0">{t('labels.new')}</span>}
        {combo.difficulty && (
          <span title={t(`filters.${combo.difficulty}`)}
            className={`w-2 h-2 rounded-full flex-shrink-0 border ${combo.difficulty === 'facil' ? 'bg-green-500/80 border-green-300/40' : combo.difficulty === 'media' ? 'bg-yellow-500/80 border-yellow-300/40' : 'bg-red-500/80 border-red-300/40'}`} />
        )}
        {combo.damage > 0 && <span className="text-[10px] font-hud font-bold text-overlay-accent flex-shrink-0">{combo.damage}<span className="text-overlay-accent/50 font-normal"> DMG</span></span>}
        {isLearn && <span className="text-[9px] text-emerald-500 flex-shrink-0" title={t('filters.learned') || 'APRENDIDO'}>✔</span>}
      </div>
    )
  }

  return (
    <div style={{ ...style, animationDelay: `${Math.min(index, 15) * 20}ms` }} onClick={openPractice} title={t('actions.practice')}
      className={`mx-4 mb-2.5 rounded-xl overflow-hidden border border-white/10 hover:border-overlay-accent/40 hover:bg-white/[0.06] transition-all group cursor-pointer animate-combo-enter ${isLearn ? 'bg-emerald-900/10' : 'bg-white/[0.04]'} ${isDangerous ? 'shadow-[0_0_10px_rgba(220,38,38,0.08)]' : ''}`}>

      <div className="px-3.5 pt-2.5 pb-2">
        {/* Cabecera: personaje + estado · autor/versión a la derecha */}
        <div className="flex items-center gap-2 mb-1.5 min-w-0">
          <span className="text-[13px] font-black uppercase tracking-wider text-overlay-accent drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] flex-shrink-0">{combo.character}</span>
          {combo.isNew && <span className="inline-block text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex-shrink-0">{t('labels.new')}</span>}
          {isLearn && <span className="inline-block text-[9px] font-bold text-emerald-500 bg-emerald-500/20 px-1.5 py-0.5 rounded flex-shrink-0">✔ {t('filters.learned') || 'APRENDIDO'}</span>}
          {isDangerous && <span className="inline-block text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">{t('labels.situational')}</span>}
          <span className="ml-auto text-[9px] font-hud text-white/30 truncate flex-shrink-0">
            {combo.version && <span className="font-mono">{combo.version}</span>}
            {combo.creator && ` ${t('labels.by')} ${combo.creator}`}
          </span>
        </div>

        {/* Notación visual */}
        <NotationDisplay notation={combo.notation} />

        {/* Notación textual en barra oscura con filo de acento (como la web) */}
        <div className="mt-2 bg-black/45 border-l-[3px] border-overlay-accent/80 rounded-r px-2 py-1.5">
          <p className="font-mono text-[11px] text-white/80 break-all leading-snug">{combo.notation}</p>
        </div>

        {/* Chips de datos: daño, hits, dificultad y propiedades */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {combo.damage > 0 && (
            <span className="text-[10px] font-hud font-bold px-2 py-0.5 rounded bg-overlay-accent/15 text-overlay-accent flex-shrink-0">
              {combo.damage} <span className="text-overlay-accent/60 font-normal">{t('labels.damage')}</span>
            </span>
          )}
          {combo.hits > 0 && (
            <span className="text-[10px] font-hud px-2 py-0.5 rounded bg-white/10 text-white/60 flex-shrink-0">
              {combo.hits} <span className="text-white/35">{t('labels.hits')}</span>
            </span>
          )}
          {/* Dificultad como punto de color con tooltip: menos ruido visual */}
          {combo.difficulty && (
            <span
              title={t(`filters.${combo.difficulty}`)}
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border ${combo.difficulty === 'facil' ? 'bg-green-500/80 border-green-300/40' : combo.difficulty === 'media' ? 'bg-yellow-500/80 border-yellow-300/40' : 'bg-red-500/80 border-red-300/40'}`}
            />
          )}
          {combo.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
        </div>
      </div>

      {isEditingNote && (
        <div className="px-3.5 pb-2 no-drag" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={t('tips.note') + '...'} className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none focus:border-overlay-accent" autoFocus />
            <button onClick={saveNote} className="text-[10px] px-2 py-1 bg-overlay-accent/20 text-overlay-accent rounded hover:bg-overlay-accent/30 font-bold">{t('actions.save')}</button>
            <button onClick={(e) => { e.stopPropagation(); setIsEditingNote(false) }} className="text-[10px] px-2 py-1 text-white/50 hover:text-white">X</button>
          </div>
        </div>
      )}

      {combo.customNote && !isEditingNote && (
        <div className="px-3.5 pb-2">
          <p className="text-[10px] text-yellow-200/80 bg-yellow-900/20 border-l-2 border-yellow-500/50 pl-2 py-0.5 rounded-r">📝 {combo.customNote}</p>
        </div>
      )}

      {/* Barra de opciones: aparece al pasar el mouse (o siempre, según ajuste) */}
      {!isTournamentMode && (
        <div className={`px-3.5 py-2 flex items-center gap-2 bg-black/25 transition-opacity duration-150 ${alwaysShowActions ? '' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
          <RoundButton onClick={(e) => { e.stopPropagation(); openPractice() }} title={t('actions.practice')}>▶</RoundButton>
          <RoundButton onClick={handleToggleFavorite} title={t('tips.favorite')} active={isFav}>
            <span className={justStarred ? 'animate-star-pop' : ''}>{isFav ? '★' : '☆'}</span>
          </RoundButton>
          <RoundButton onClick={handleToggleLearned} title={t('tips.learned')} active={isLearn}>✔</RoundButton>
          <RoundButton onClick={copyNotation} title={t('actions.copy')}>📋</RoundButton>
          <RoundButton onClick={(e) => { e.stopPropagation(); setIsEditingNote(true) }} title={t('tips.note')}>✏️</RoundButton>
          <RoundButton onClick={copyDiscordLink} title={t('tips.discord')}>💬</RoundButton>
          {combo.source && (
            <RoundButton
              onClick={(e) => { e.stopPropagation(); window.electronAPI.openVideo(combo.source!) }}
              title={t('tips.video')}
            >
              🎬
            </RoundButton>
          )}
        </div>
      )}

      {/* Línea de acento inferior: separación clara entre combos */}
      <div className="h-[3px] bg-overlay-accent/70" />
    </div>
  )
})

export default ComboCard
