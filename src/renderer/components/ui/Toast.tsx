/**
 * Toast Component
 *
 * Global notification component with 4 types: success, info, warning, error.
 * Appears at top-right, auto-dismisses after 3s, supports manual close,
 * slide-in-right animation, and max 5 visible toasts.
 */

import { create } from 'zustand'
import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import type { ReactNode } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration: number
  createdAt: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_TOASTS = 5
const DEFAULT_DURATION = 3000 // ms
const TOAST_ICON: Record<ToastType, ReactNode> = {
  success: <CheckCircleOutlined className="text-green-500" />,
  info: <InfoCircleOutlined className="text-blue-500" />,
  warning: <ExclamationCircleOutlined className="text-amber-500" />,
  error: <CloseCircleOutlined className="text-red-500" />,
}

const TOAST_BG: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
  error: 'bg-red-50 border-red-200',
}

const TOAST_TEXT: Record<ToastType, string> = {
  success: 'text-green-800',
  info: 'text-blue-800',
  warning: 'text-amber-800',
  error: 'text-red-800',
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

let toastIdCounter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) =>
    set((state) => {
      const newToast: ToastItem = {
        ...toast,
        id: `toast-${++toastIdCounter}`,
        createdAt: Date.now(),
      }
      const toasts = [newToast, ...state.toasts].slice(0, MAX_TOASTS)
      return { toasts }
    }),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}))

// ─── Hook: useToast ───────────────────────────────────────────────────────────

interface ToastOptions {
  duration?: number
  title?: string
}

export function useToast() {
  const addToast = useToastStore((state) => state.addToast)

  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast({
        type: 'success',
        message,
        title: options?.title,
        duration: options?.duration ?? DEFAULT_DURATION,
      })
    },
    [addToast]
  )

  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast({
        type: 'info',
        message,
        title: options?.title,
        duration: options?.duration ?? DEFAULT_DURATION,
      })
    },
    [addToast]
  )

  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast({
        type: 'warning',
        message,
        title: options?.title,
        duration: options?.duration ?? DEFAULT_DURATION,
      })
    },
    [addToast]
  )

  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast({
        type: 'error',
        message,
        title: options?.title,
        duration: options?.duration ?? DEFAULT_DURATION,
      })
    },
    [addToast]
  )

  return { success, info, warning, error }
}

// ─── Component: ToastItemView ────────────────────────────────────────────────

interface ToastItemViewProps {
  toast: ToastItem
  onRemove: (id: string) => void
}

function ToastItemView({ toast, onRemove }: ToastItemViewProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [toast.id, toast.duration, onRemove])

  const handleClose = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    onRemove(toast.id)
  }, [toast.id, onRemove])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'pointer-events-auto mb-3 w-80 rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        TOAST_BG[toast.type]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-lg">{TOAST_ICON[toast.type]}</div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className={cn('mb-1 text-sm font-semibold', TOAST_TEXT[toast.type])}>
              {toast.title}
            </h4>
          )}
          <p className={cn('text-sm', toast.title ? 'text-gray-600' : TOAST_TEXT[toast.type])}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
          aria-label="Close toast"
        >
          <CloseOutlined />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Component: ToastContainer ───────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItemView key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Legacy Hook: useToast (Ant Design wrapper, kept for backward compat) ─────

/**
 * @deprecated Use the new `useToast()` hook and `ToastContainer` component instead.
 * This hook wraps Ant Design's message API for backward compatibility.
 */
export function useLegacyToast() {
  const toast = useToast()
  return toast
}

export default ToastContainer
