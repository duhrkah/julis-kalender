'use client';

import * as React from "react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

export interface ToastContextType {
  toasts: ToastProps[]
  toast: (props: Omit<ToastProps, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const duration = props.duration || 5000

    setToasts((prev) => [...prev, { ...props, id }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: ToastProps[]
  dismiss: (id: string) => void
}) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  )
}

function Toast({
  title,
  description,
  variant = 'default',
  onDismiss,
}: ToastProps & { onDismiss: () => void }) {
  const variantStyles = {
    default: 'bg-card border-border text-foreground',
    success: 'bg-julis-soft-cyan border-accent/30 text-foreground',
    error: 'bg-destructive/10 border-destructive/30 text-destructive',
    warning: 'bg-julis-soft-yellow border-julis-yellow/30 text-foreground',
  }

  return (
    <div
      className={`animate-in slide-in-from-right duration-300 p-4 rounded-lg border shadow-lg ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        <button
          onClick={onDismiss}
          className="text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
