import { useMemo } from 'react'
import type { RankData } from '../types/rank'
import { winRateOf } from '../types/rank'
import { bannerBackground, bannerPortrait, bannerRankArt } from '../utils/bannerAssets'

interface Props {
  profile: RankData
  onEdit?: () => void
  onWin?: () => void
  onLoss?: () => void
  onReset?: () => void
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function PlayerBanner({ profile, onEdit, onWin, onLoss, onReset }: Props) {
  const seed = profile.mainChar || profile.playerName || 'tekken'
  const background = useMemo(() => bannerBackground(seed), [seed])
  const portrait = useMemo(() => bannerPortrait(profile.mainChar), [profile.mainChar])
  const rankArt = useMemo(() => bannerRankArt(profile.rank), [profile.rank])
  const rate = winRateOf(profile)

  const copyId = () => {
    if (profile.tekkenIdCode) navigator.clipboard.writeText(profile.tekkenIdCode).catch(() => {})
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 no-drag shadow-2xl" style={{ height: 188 }}>
      {background && (
        <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

      <div className="relative flex h-full">
        {/* Retrato del personaje principal */}
        <div className="relative w-[118px] shrink-0 overflow-hidden">
          {portrait ? (
            <img
              src={portrait}
              alt={profile.mainChar}
              draggable={false}
              className="absolute bottom-0 left-1/2 h-[146px] w-[118px] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white/20">
              {initials(profile.mainChar || profile.playerName || '?')}
            </div>
          )}
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-black/60" />
        </div>

        {/* Datos del jugador */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-2.5 pr-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-[17px] font-black leading-tight tracking-wide text-white">
                {profile.playerName || 'Jugador'}
              </h2>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="shrink-0 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-white/50 transition-colors hover:border-white/30 hover:text-white"
                  title="Editar perfil"
                >
                  ⚙️
                </button>
              )}
            </div>

            <button
              onClick={copyId}
              className="mt-0.5 block max-w-full truncate font-mono text-[9px] text-cyan-300/70 hover:text-cyan-200"
              title={profile.tekkenIdCode ? 'Copiar Tekken ID' : 'Sin Tekken ID'}
            >
              {profile.tekkenIdCode || 'sin Tekken ID'} · {profile.platform || 'Steam'}
            </button>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-white/55">
              {profile.region && <span className="truncate">🌐 {profile.region}</span>}
              {profile.prowess && <span className="text-amber-300/90">⚡ {profile.prowess}</span>}
              {profile.glicko && <span className="text-emerald-300/80">{profile.glicko}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
              W {profile.wins ?? 0}
            </span>
            {onWin && (
              <button
                onClick={onWin}
                className="rounded border border-emerald-500/20 bg-emerald-500/5 px-1 text-[9px] text-emerald-400/70 hover:bg-emerald-500/20 hover:text-emerald-300"
                title="Sumar victoria"
              >
                +
              </button>
            )}
            <span className="rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">
              L {profile.losses ?? 0}
            </span>
            {onLoss && (
              <button
                onClick={onLoss}
                className="rounded border border-rose-500/20 bg-rose-500/5 px-1 text-[9px] text-rose-400/70 hover:bg-rose-500/20 hover:text-rose-300"
                title="Sumar derrota"
              >
                +
              </button>
            )}
            <span className="ml-1 truncate text-[9px] text-white/40">{rate}%</span>
            {onReset && (
              <button onClick={onReset} className="ml-auto text-[10px] text-white/25 hover:text-white/70" title="Reiniciar sesión">
                ↺
              </button>
            )}
          </div>

          {profile.message && (
            <p className="truncate text-[9px] italic text-white/45">“{profile.message}”</p>
          )}
        </div>

        {/* Rango */}
        <div className="flex w-[176px] shrink-0 flex-col items-center justify-center gap-0.5 pr-2">
          {rankArt ? (
            <img
              src={rankArt}
              alt={profile.rank}
              draggable={false}
              className="w-[164px] drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]"
            />
          ) : (
            <span className="text-center text-sm font-black uppercase leading-tight text-amber-300">{profile.rank || 'Sin rango'}</span>
          )}
          <span className="text-[8px] uppercase tracking-[0.18em] text-white/45 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Rango actual</span>
        </div>
      </div>
    </div>
  )
}
