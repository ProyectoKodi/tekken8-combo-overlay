import { useState, useEffect } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import { CHARACTER_SLUGS, ROUTINE_ID, normalizeCharName } from '../types/combo'
import { generateProgressCard } from '../utils/shareCard'
import { pushToast } from '../store/toastStore'

const CHAR_BASE = 'https://tekken8combo.kagewebsite.com/tpl/img/char'

type Progress = { learned: number; total: number }

function CharacterCard({ name, slug, progress, fetchedAt, onSelect }: { name: string; slug: string; progress?: Progress; fetchedAt?: number; onSelect: () => void }) {
  const [imgFailed, setImgFailed] = useState(false)
  const t = useOverlayStore((s) => s.t)
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  const pct = progress && progress.total > 0 ? Math.round((progress.learned / progress.total) * 100) : 0
  // Frescura del caché: verde <24 h, ámbar <72 h, rojo si más viejo
  const ageH = fetchedAt ? (Date.now() - fetchedAt) / 3600000 : null
  const dotColor = ageH === null ? '' : ageH < 24 ? 'bg-emerald-400' : ageH < 72 ? 'bg-amber-400' : 'bg-red-400/70'
  const dotTitle = ageH === null ? '' : ageH < 24 ? t('labels.cache_fresh') : t('labels.cache_stale')
  return (
    <button onClick={onSelect} className="group relative flex flex-col items-center rounded-lg border border-white/8 bg-black/40 hover:border-overlay-accent/60 hover:bg-overlay-accent/20 transition-all cursor-pointer overflow-hidden no-drag" title={name}>
      <div className="w-full aspect-square overflow-hidden bg-black/40 relative">
        {!imgFailed ? (
          <img src={`${CHAR_BASE}/${slug}.jpg`} alt={name} draggable={false} className="w-full h-full object-cover object-top transition-transform duration-200 group-hover:scale-105" onError={() => setImgFailed(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5"><span className="text-xs font-hud font-bold text-white/50">{initials}</span></div>
        )}
        {dotColor && <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${dotColor} shadow-[0_0_4px_rgba(0,0,0,0.8)]`} title={dotTitle} />}
      </div>
      <div className="w-full px-1 py-0.5 text-center bg-black/60">
        <span className="text-[8px] font-hud font-semibold text-white/65 group-hover:text-overlay-accent transition-colors leading-tight block truncate">{name}</span>
        {/* Progreso de maestría: combos aprendidos vs total del caché */}
        {progress && progress.total > 0 && (
          <div className="flex items-center gap-1 px-0.5 pb-0.5 pt-[1px]">
            <div className="h-[3px] flex-1 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-400' : 'bg-overlay-accent'}`} style={{ width: `${Math.max(pct, 4)}%` }} />
            </div>
            <span className={`text-[7px] font-mono leading-none flex-shrink-0 ${pct === 100 ? 'text-emerald-400' : 'text-white/40'}`}>{progress.learned}/{progress.total}</span>
          </div>
        )}
      </div>
    </button>
  )
}

export default function CharacterSelector() {
  const setCharacter = useOverlayStore((s) => s.setCharacter)
  const loading = useOverlayStore((s) => s.loading)
  const dynamicCharacters = useOverlayStore((s) => s.dynamicCharacters)
  const loadDynamicCharacters = useOverlayStore((s) => s.loadDynamicCharacters)
  const t = useOverlayStore((s) => s.t)
  const language = useOverlayStore((s) => s.language)
  const [progress, setProgress] = useState<Record<string, Progress> | null>(null)
  const [freshness, setFreshness] = useState<Record<string, number> | null>(null)
  const [sharing, setSharing] = useState(false)

  /** Genera la tarjeta PNG de progreso: copia al portapapeles + descarga. */
  const handleShare = async () => {
    setSharing(true)
    try {
      const blob = await generateProgressCard(language, progress)
      if (!blob) throw new Error('sin tarjeta')
      // Descarga local
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `progreso-tekken-${new Date().toISOString().slice(0, 10)}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      // Copia al portapapeles (mejor esfuerzo: no todos los contextos lo permiten)
      let copied = false
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        copied = true
      } catch { /* sin permiso: queda la descarga */ }
      pushToast(t(copied ? 'share.saved_copy' : 'share.saved_download'), 'ok')
    } catch {
      pushToast(t('share.failed'), 'warn')
    } finally {
      setSharing(false)
    }
  }

  useEffect(() => { loadDynamicCharacters() }, [loadDynamicCharacters])

  // Frescura del caché por personaje (verde/ámbar/rojo en la esquina)
  useEffect(() => {
    const pull = () => {
      window.electronAPI.getMasteryProgress().then(setProgress).catch(() => {})
      window.electronAPI.getCacheFreshness().then(setFreshness).catch(() => {})
    }
    pull()
    // Re-consultar al volver a la ventana: si hubo un Sync mientras tanto,
    // el grid no muestra progreso/frescura viejos
    window.addEventListener('focus', pull)
    return () => window.removeEventListener('focus', pull)
  }, [])

  const rawList = dynamicCharacters || CHARACTER_SLUGS
  // Dedupe por nombre normalizado: "Roger Jr." (roster) y "Roger Jr"
  // (descubierto) son el mismo personaje; gana el nombre del roster
  const uniqueList: Record<string, string> = {}
  const seenKeys = new Set<string>()
  Object.entries(rawList).forEach(([name, slug]) => {
    const cleanName = name.replace(/combos?/gi, '').trim()
    const key = normalizeCharName(cleanName)
    if (seenKeys.has(key)) return
    seenKeys.add(key)
    uniqueList[cleanName] = slug
  })

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 cursor-crosshair custom-scroll w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-[10px] text-white/50 font-hud uppercase tracking-widest">{t('labels.select_char') || 'Selecciona un personaje'}</p>
        {dynamicCharacters && <span className="text-[9px] text-emerald-400/70 font-hud">✓ Actualizado</span>}
      </div>
      {/* Acciones rápidas: rutina de favoritos y tarjeta de progreso */}
      <div className="flex gap-1.5 mb-2 px-2">
        <button onClick={() => !loading && setCharacter(ROUTINE_ID)} className="flex-1 text-[9px] font-hud font-bold uppercase tracking-wider py-1.5 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-colors no-drag cursor-pointer" title={t('labels.routine_hint')}>
          ⭐ {t('labels.routine') || 'Mi rutina'}
        </button>
        <button onClick={handleShare} disabled={sharing} className="flex-1 text-[9px] font-hud font-bold uppercase tracking-wider py-1.5 rounded border border-overlay-accent/30 bg-overlay-accent/10 text-overlay-accent hover:bg-overlay-accent/20 transition-colors no-drag cursor-pointer disabled:opacity-50" title={t('share.hint')}>
          📤 {sharing ? t('share.generating') : t('share.button') || 'Compartir progreso'}
        </button>
      </div>
      {/* Cuadrícula de 5 columnas */}
      <div className="grid grid-cols-5 gap-1">
        {Object.entries(uniqueList).map(([name, slug]) => (
          <CharacterCard key={name} name={name} slug={slug} progress={progress?.[name]} fetchedAt={freshness?.[name]} onSelect={() => !loading && setCharacter(name)} />
        ))}
      </div>
    </div>
  )
}
