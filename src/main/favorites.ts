import Store from 'electron-store'

interface FavoritesSchema {
  ids: string[]
}

const store = new Store<FavoritesSchema>({
  name: 'favorites',
  defaults: { ids: [] },
  schema: {
    ids: {
      type: 'array',
      items: { type: 'string' },
      default: [],
    },
  },
})

export function getFavorites(): string[] {
  return store.get('ids', [])
}

export function addFavorite(id: string): void {
  const ids = getFavorites()
  if (!ids.includes(id)) {
    store.set('ids', [...ids, id])
  }
}

export function removeFavorite(id: string): void {
  store.set('ids', getFavorites().filter((i) => i !== id))
}

/** Reemplaza la lista completa (usado por la migración de ids). */
export function setFavorites(ids: string[]): void {
  store.set('ids', [...new Set(ids)])
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id)
}
