import { create } from 'zustand'

export type ToastType = 'ok' | 'warn' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
  /** Retratos a mostrar junto al mensaje (avisos de combos nuevos). */
  images?: string[]
  /** Acción al hacer clic (p. ej. llevar al personaje con combos nuevos). */
  action?: () => void
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, type?: ToastType, ttl?: number, images?: string[], action?: () => void) => void
  remove: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, type = 'info', ttl = 3500, images, action) => {
    // No duplicar: si ya hay un toast con el mismo mensaje visible, se ignora
    if (get().toasts.some((t) => t.message === message)) return
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, message, type, images, action }] }))
    setTimeout(() => useToastStore.getState().remove(id), ttl)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Helper de un solo paso para cualquier componente. */
export function pushToast(message: string, type: ToastType = 'info', ttl?: number, images?: string[], action?: () => void): void {
  useToastStore.getState().push(message, type, ttl, images, action)
}
