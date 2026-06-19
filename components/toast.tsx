'use client'

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react'
import { Check, AlertTriangle, Info, X, ShoppingCart } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'cart'

interface Toast {
  id: string
  type: ToastType
  message: string
  exiting?: boolean
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const ICONS: Record<ToastType, ReactNode> = {
  success: <Check className="w-4 h-4" />,
  error: <AlertTriangle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
  cart: <ShoppingCart className="w-4 h-4" />,
}

const COLORS: Record<ToastType, string> = {
  success: 'bg-green-500/15 border-green-500/30 text-green-400',
  error: 'bg-red-500/15 border-red-500/30 text-red-400',
  info: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  cart: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
}

const ICON_BG: Record<ToastType, string> = {
  success: 'bg-green-500/20',
  error: 'bg-red-500/20',
  info: 'bg-amber-500/20',
  cart: 'bg-amber-500/20',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])

    // Auto-dismiss after 3s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      )
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 250)
    }, 3000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 250)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg max-w-sm ${
              COLORS[toast.type]
            } ${toast.exiting ? 'animate-toast-out' : 'animate-toast-in'}`}
          >
            <div className={`p-1.5 rounded-lg ${ICON_BG[toast.type]}`}>
              {ICONS[toast.type]}
            </div>
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
