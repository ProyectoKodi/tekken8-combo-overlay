import { useState } from 'react'
import type { Combo } from '../types/combo'
import { parseNotation, type NotationToken, type BadgeColor } from '../utils/notationParser'
import { useOverlayStore } from '../store/overlayStore'

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

function TagBadge({ tag }: { tag: string }) {
  const { t } = useOverlayStore()
  if (/^stage:/i.test(tag)) return <span className="text-[9px] font-hud px-1.5 py-0.5 rounded border bg-slate-800/70 text-slate-300/80 border-slate-600/40 flex-shrink-0">📍 {tag.replace(/^stage:\s*/i, '')}</span>
  const style = TAG_STYLES[tag] ?? 'bg-white/10 text-white/60 border-white/15'
  return <span className={`text-[9px] font-hud font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${style}`}>{t(`filters.tags.${tag}`) || tag}</span>
}

function RenderToken({ token }: { token: NotationToken }) {
  if (token.type === 'separator') return <img src="https://tekken8combo.kagewebsite.com/tpl/img/input/follow.svg" alt="►" className="h-4 w-auto mx-1 opacity-40" draggable={false} />
  if (token.type === 'image') return <img src={token.src} alt={token.alt} title={token.alt} draggable={false} className="h-5 w-auto select-none" style={{ imageRendering: 'crisp-edges' }} onError={(e) => { const parent = e.currentTarget.parentElement; if (parent) { const span = document.createElement('span'); span.textContent = token.alt; span.className = 'text-[10px] text-white/70 font-mono'; parent.replaceChild(span, e.currentTarget) } }} />
  if (token.type === 'badge') return <span className={`text-[9px] font-hud px-1.5 py-0.5 rounded ${BADGE_STYLES[token.color]}`}>{token.value}</span>
  return <span className="text-[10px] font-hud text-white/55">{token.value}</span>
}

function NotationDisplay({ notation }: { notation: string }) {
  const { t } = useOverlayStore()
  const tokens = parseNotation(notation)
  if (!tokens.length) return <p className="font-mono text-xs text-white/60 italic">{t('labels.no_notation')}</p>
  return <div className="flex flex-wrap items-center gap-x-0.5 gap-y-1">{tokens.map((token, i) => <RenderToken key={i} token={token} />)}</div>
}

export default function ComboCard({ combo, index = 0, style }: Props) {
  const [copied, setCopied] = useState(false)
  const [justStarred, setJustStarred] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(combo.customNote || '')
  const [copiedUrl, setCopiedUrl] = useState(false)
  
  const { isFavorite, toggleFavorite, addRecentCombo, t, isTournamentMode, isLearned, toggleLearned } = useOverlayStore()
  const isFav = isFavorite(combo.id)
  const isLearn = isLearned(combo.id)
  const isDangerous = combo.tags.some(t => ['Heat', 'Rage', 'CH'].includes(t))

  const openPractice = () => { addRecentCombo(combo); window.electronAPI.openPractice(combo) }

  const copyNotation = (e: React.MouseEvent) => {
    e.stopPropagation()
    const dmg = combo.damage > 0 ? ` | ${combo.damage} DMG` : ''
    const hits = combo.hits > 0 ? ` | ${combo.hits} HITS` : ''
    const tags = combo.tags.length > 0 ? ` | [${combo.tags.join(', ')}]` : ''
    const creator = combo.creator ? ` | ${t('labels.by')}: ${combo.creator}` : ''
    navigator.clipboard.writeText(`[${combo.character}${dmg}${hits}${tags}${creator}]\n${combo.notation}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  // NUEVO: Copiar enlace para Discord
  const copyDiscordLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Generamos un enlace ficticio con los datos del combo.
    // En una app real, esto se subiría a un servidor para acortar el link.
    // Aquí usamos el esquema de URL "tekken8://"
    const encodedData = encodeURIComponent(JSON.stringify({
      id: combo.id, char: combo.character, notation: combo.notation, damage: combo.damage, creator: combo.creator
    }))
    const url = `https://discord.com/channels/@me/123456789012345678 (Combo: ${combo.character} - ${combo.notation})` 
    // Como los links personalizados no se pueden abrir en Discord fácilmente, 
    // copiamos un texto formateado bonito y un comando para abrir.
    
    // Lo que realmente funciona en Discord es pegar un texto.
    const text = `**${combo.character}** | ${combo.damage} DMG | ${combo.notation}\n> ${combo.creator ? `Autor: ${combo.creator} | ` : ''}Copia esto en Tekken 8 Overlay: ${combo.notation}`
    
    navigator.clipboard.writeText(text).then(() => { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 1500) })
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasFav = isFav
    toggleFavorite(combo.id)
    if (!wasFav) { setJustStarred(true); setTimeout(() => setJustStarred(false), 300) }
  }

  const handleDeleteCustom = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await window.electronAPI.deleteCustomCombo(combo.id)
    await useOverlayStore.getState().refreshCombos()
  }

  const saveNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.electronAPI.saveCustomNote(combo.id, noteText)
    setIsEditingNote(false)
    combo.customNote = noteText 
  }

  return (
    <div style={{ ...style, animationDelay: `${Math.min(index, 15) * 20}ms` }} className={`mx-4 mb-2 border rounded-lg overflow-hidden hover:bg-white/6 transition-all group cursor-pointer animate-combo-enter ${isLearn ? 'bg-emerald-900/10' : 'bg-white/4'} ${isDangerous ? 'border-red-500/30 hover:border-red-500/60 shadow-[0_0_10px_rgba(220,38,38,0.1)]' : 'border-white/6 hover:border-overlay-accent/40'}`} onClick={openPractice} title={t('actions.practice')}>
      
      <div className="px-4 pt-3 pb-2.5 relative">
        <div className="flex items-center gap-2 mb-1">
          {combo.isNew && <span className="inline-block text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{t('labels.new')}</span>}
          {isLearn && <span className="inline-block text-[9px] font-bold text-emerald-500 bg-emerald-500/20 px-1.5 py-0.5 rounded">✔ APRENDIDO</span>}
          {isDangerous && <span className="inline-block text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">{t('labels.situational')}</span>}
        </div>
        
        <NotationDisplay notation={combo.notation} />
        
        {!isTournamentMode && (
          <div className="absolute top-2.5 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copyDiscordLink} className="text-[9px] font-hud text-white/40 hover:text-indigo-400 transition-colors px-1.5 py-0.5 rounded bg-black/30 hover:bg-indigo-500/20 border border-white/10" title="Copiar para Discord">{copiedUrl ? '¡Copiado!' : '💬'}</button>
            <button onClick={(e) => { e.stopPropagation(); setIsEditingNote(true) }} className="text-[9px] font-hud text-white/40 hover:text-overlay-accent transition-colors px-1.5 py-0.5 rounded bg-black/30 hover:bg-overlay-accent/10 border border-white/10" title="Añadir Nota">✏️</button>
            <button onClick={copyNotation} className="text-[9px] font-hud text-white/40 hover:text-overlay-accent transition-colors px-1.5 py-0.5 rounded bg-black/30 hover:bg-overlay-accent/10 border border-white/10" title={t('actions.copy')}>{copied ? t('actions.copied') : '📋'}</button>
            {combo.isCustom && <button onClick={handleDeleteCustom} className="text-[9px] font-hud text-red-400/60 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded bg-black/30 border border-red-500/20" title={t('actions.delete')}>🗑</button>}
            <span className="text-[9px] font-hud text-overlay-accent/50">{t('actions.practice')}</span>
          </div>
        )}
      </div>

      {isEditingNote && (
        <div className="px-4 pb-2 no-drag" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Escribe tu nota aquí..." className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none focus:border-overlay-accent" autoFocus />
            <button onClick={saveNote} className="text-[10px] px-2 py-1 bg-overlay-accent/20 text-overlay-accent rounded hover:bg-overlay-accent/30 font-bold">Guardar</button>
            <button onClick={(e) => { e.stopPropagation(); setIsEditingNote(false) }} className="text-[10px] px-2 py-1 text-white/50 hover:text-white">X</button>
          </div>
        </div>
      )}

      {combo.customNote && !isEditingNote && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-yellow-200/80 bg-yellow-900/20 border-l-2 border-yellow-500/50 pl-2 py-0.5 rounded-r">📝 {combo.customNote}</p>
        </div>
      )}

      <div className="px-4 py-1.5 border-t border-white/4 flex items-center gap-2.5 min-w-0">
        {!isTournamentMode && (
          <>
            <button onClick={handleToggleFavorite} className={`flex-shrink-0 text-[14px] leading-none transition-colors no-drag ${isFav ? 'text-amber-400' : 'text-white/20 hover:text-white/50'} ${justStarred ? 'animate-star-pop' : ''}`}>{isFav ? '★' : '☆'}</button>
            <button onClick={(e) => { e.stopPropagation(); toggleLearned(combo.id) }} className={`flex-shrink-0 text-[12px] leading-none transition-colors no-drag ${isLearn ? 'text-emerald-400' : 'text-white/20 hover:text-emerald-400/50'}`} title="Marcar como aprendido">{isLearn ? '✔' : '○'}</button>
          </>
        )}
        {combo.damage > 0 && <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-hud font-semibold"><span className="text-overlay-accent">{t('labels.damage')}</span><span className="text-white/90">{combo.damage}</span></span>}
        {combo.hits > 0 && <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-hud"><span className="text-white/35">{t('labels.hits')}</span><span className="text-white/70">{combo.hits}</span></span>}
        {combo.difficulty && <span className="flex-shrink-0 text-[9px] font-hud text-sky-300/70">{t(`filters.${combo.difficulty}`)}</span>}
        <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>{combo.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}</div>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {combo.version && <span className="text-[9px] font-mono text-white/25">{combo.version}</span>}
          {combo.creator && <span className="text-[9px] text-white/25 font-hud">{t('labels.by')} {combo.creator}</span>}
        </div>
      </div>
    </div>
  )
}