import { useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import type { SortKey } from '../types/combo'
import { ALL_TAGS, isSeparator } from '../types/combo'

const TAG_COLORS: Record<string, string> = {
  Heat: 'bg-red-800/50 border-red-600/50 text-red-300 data-[active]:bg-red-600/60 data-[active]:text-white',
  Wall: 'bg-blue-900/50 border-blue-600/50 text-blue-300 data-[active]:bg-blue-600/60 data-[active]:text-white',
  Rage: 'bg-purple-900/50 border-purple-600/50 text-purple-300 data-[active]:bg-purple-600/60 data-[active]:text-white',
  CH: 'bg-amber-900/50 border-amber-600/50 text-amber-300 data-[active]:bg-amber-600/60 data-[active]:text-white',
  Crouch: 'bg-green-900/50 border-green-600/50 text-green-300 data-[active]:bg-green-600/60 data-[active]:text-white',
  Standing: 'bg-cyan-900/50 border-cyan-600/50 text-cyan-300 data-[active]:bg-cyan-600/60 data-[active]:text-white',
  'No Wall': 'bg-zinc-800/50 border-zinc-600/50 text-zinc-300 data-[active]:bg-zinc-600/60 data-[active]:text-white',
}

export default function FilterBar() {
  const { filters, toggleTag, setFilter, clearFilters, filteredCombos, combos, fromCache, loading, favoriteIds, learnedIds, t } = useOverlayStore()
  const [lastPulsedTag, setLastPulsedTag] = useState<string | null>(null)
  const displayed = filteredCombos().filter((item) => !isSeparator(item))
  const hasFavorites = favoriteIds.size > 0
  const hasLearned = learnedIds.size > 0
  const showOnlyFavorites = filters.showOnlyFavorites ?? false
  const showOnlyLearned = filters.showOnlyLearned ?? false

  const handleTagClick = (tag: string) => {
    toggleTag(tag); setLastPulsedTag(tag); setTimeout(() => setLastPulsedTag(null), 200)
  }
  const toggle100Dmg = () => setFilter({ minDamage: filters.minDamage === 100 ? 0 : 100 })

  return (
    <div className="px-4 py-2 border-b border-white/5 space-y-1.5">
      <div className="flex items-center gap-1.5 overflow-x-auto no-drag" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setFilter({ showOnlyFavorites: !showOnlyFavorites })} disabled={!hasFavorites}
          className={`flex-shrink-0 text-[10px] font-hud font-semibold px-2 py-0.5 rounded border transition-all ${showOnlyFavorites ? 'bg-amber-600/60 border-amber-500/60 text-white' : 'bg-amber-900/30 border-amber-700/40 text-amber-400/80 hover:text-amber-300 hover:border-amber-600/60'} ${!hasFavorites ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}`}>
          {t('filters.favorites')}{hasFavorites ? ` (${favoriteIds.size})` : ''}
        </button>

        {/* BOTÓN APRENDIDOS */}
        <button onClick={() => setFilter({ showOnlyLearned: !showOnlyLearned })} disabled={!hasLearned}
          className={`flex-shrink-0 text-[10px] font-hud font-semibold px-2 py-0.5 rounded border transition-all ${showOnlyLearned ? 'bg-emerald-600/60 border-emerald-500/60 text-white' : 'bg-emerald-900/30 border-emerald-700/40 text-emerald-400/80 hover:text-emerald-300 hover:border-emerald-600/60'} ${!hasLearned ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}`}>
          ✔ {t('filters.learned')}{hasLearned ? ` (${learnedIds.size})` : ''}
        </button>

        <div className="w-px h-3 bg-white/10 flex-shrink-0" />
        {ALL_TAGS.map((tag) => {
          const isActive = filters.activeTags.includes(tag)
          const colorClass = TAG_COLORS[tag] ?? TAG_COLORS.Wall
          const isPulsing = lastPulsedTag === tag
          return (
            <button key={tag} data-active={isActive || undefined} onClick={() => handleTagClick(tag)} className={`flex-shrink-0 text-[10px] font-hud font-semibold px-2 py-0.5 rounded border transition-all ${colorClass} ${isPulsing ? 'animate-tag-pulse' : ''}`}>
              {t(`filters.tags.${tag}`) || tag}
            </button>
          )
        })}
        {(filters.activeTags.length > 0 || showOnlyFavorites || showOnlyLearned) && (
          <button onClick={clearFilters} className="flex-shrink-0 text-[10px] font-hud text-white/40 hover:text-white/70 px-1.5 py-0.5 rounded border border-white/10 hover:border-white/30 transition-all">{t('filters.clear')}</button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <label className="flex items-center gap-1 text-[10px] font-hud text-white/40">
          {t('filters.min_dmg')}
          <input type="range" min={0} max={150} step={5} value={filters.minDamage ?? 0} onChange={(e) => setFilter({ minDamage: +e.target.value })} className="w-20 accent-amber-500 no-drag" />
          <span className="text-white/70 w-6 text-right">{filters.minDamage ?? 0}</span>
        </label>

        <button onClick={toggle100Dmg} className={`text-[9px] font-hud px-1.5 py-0.5 rounded border transition-all no-drag ${filters.minDamage === 100 ? 'bg-orange-600/40 border-orange-500/60 text-orange-200' : 'bg-transparent border-white/10 text-white/40 hover:text-orange-300 hover:border-orange-500/30'}`}>{t('filters.dmg_100')}</button>

        <select value={filters.difficulty ?? ''} onChange={(e) => setFilter({ difficulty: e.target.value as any })} className="text-[10px] font-hud bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/70 outline-none cursor-pointer hover:border-white/25 no-drag">
          <option value="">{t('filters.all_difficulty')}</option>
          <option value="facil">{t('filters.easy')}</option>
          <option value="media">{t('filters.medium')}</option>
          <option value="dificil">{t('filters.hard')}</option>
        </select>

        <select value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value as SortKey })} className="ml-auto text-[10px] font-hud bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/70 outline-none cursor-pointer hover:border-white/25 no-drag">
          <option value="default">{t('filters.sort_default')}</option>
          <option value="damage">{t('filters.sort_damage')}</option>
          <option value="hits">{t('filters.sort_hits')}</option>
        </select>
      </div>
    </div>
  )
}