import { create } from 'zustand'

export interface ToastItem {
  id: string
  title: string
  description?: string
  tipo: 'success' | 'error' | 'info'
  duracion?: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>(set => ({
  toasts: [],
  addToast: nuevo => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: ToastItem = { ...nuevo, id }
    set(state => ({
      toasts: [...state.toasts.slice(-3), toast], // Máximo 4 toasts apilados (estilo Sonner)
    }))

    const duracion = nuevo.duracion ?? 3500
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, duracion)
  },
  removeToast: id => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))

export const toast = {
  success: (title: string, description?: string) => {
    useToastStore.getState().addToast({ title, description, tipo: 'success' })
  },
  error: (title: string, description?: string) => {
    useToastStore.getState().addToast({ title, description, tipo: 'error' })
  },
  info: (title: string, description?: string) => {
    useToastStore.getState().addToast({ title, description, tipo: 'info' })
  },
}
