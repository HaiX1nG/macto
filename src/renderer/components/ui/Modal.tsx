import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@renderer/utils/cn'
import { backdropVariants, modalVariants } from '@renderer/utils/animations'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
type ModalVariant = 'default' | 'glass'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: ModalSize
  variant?: ModalVariant
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  /**
   * Use framer-motion for enter/exit animations.
   * When false (default), uses CSS animations for simpler, more performant transitions.
   * When true, uses framer-motion for smoother exit animations and future gesture support.
   * @default false
   */
  useMotion?: boolean
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  useMotion = false,
}: ModalProps) => {
  // State for CSS animation exit handling
  const [visible, setVisible] = useState(false)
  const [animatingOut, setAnimatingOut] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      setAnimatingOut(false)
    } else if (visible) {
      setAnimatingOut(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setAnimatingOut(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, visible])

  const sizes: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  }

  const variants: Record<ModalVariant, string> = {
    default: cn(
      'bg-[var(--color-bg-secondary)]',
      'border border-[var(--color-border)]'
    ),
    glass: cn(
      'bg-[var(--color-bg-secondary)]/80',
      'backdrop-blur-xl',
      'border border-[var(--color-border)]'
    ),
  }

  const modalContent = (
    <div
      className={cn(
        'macto-modal-container relative w-full rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)]',
        sizes[size],
        variants[variant]
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex-1 pr-4">
          <h3 className="text-xl font-bold text-[var(--color-text-normal)]">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {description}
            </p>
          )}
        </div>
        {showCloseButton && (
          <button
            onClick={onClose}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]',
              'hover:bg-[var(--color-bg-tertiary)]',
              'transition-colors duration-150 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30'
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  )

  // CSS-only animation (default, more performant)
  if (!useMotion) {
    if (!visible) return null

    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 bg-black/60 backdrop-blur-sm',
            animatingOut
              ? 'animate-fade-out'
              : 'animate-fade-in'
          )}
          onClick={closeOnOverlayClick ? onClose : undefined}
        />

        {/* Modal Content */}
        <div
          className={cn(
            animatingOut
              ? 'animate-scale-out'
              : 'animate-scale-in'
          )}
        >
          {modalContent}
        </div>
      </div>
    )
  }

  // Framer Motion animation (smoother exit animations, future gesture support)
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            key="modal-content"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {modalContent}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

type ConfirmModalVariant = 'default' | 'danger' | 'warning'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmModalVariant
  loading?: boolean
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) => {
  const confirmButtonVariants: Record<ConfirmModalVariant, string> = {
    default: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-[var(--color-bg-base)]',
    danger: 'bg-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/80 text-[var(--color-bg-base)]',
    warning: 'bg-[var(--color-idle)] hover:bg-[var(--color-idle)]/80 text-[var(--color-bg-base)]',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              'px-5 py-2.5 rounded-xl font-medium',
              'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-darker)]',
              'text-[var(--color-text-normal)]',
              'transition-colors duration-150 ease-out',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-5 py-2.5 rounded-xl font-medium',
              'transition-colors duration-150 ease-out',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              confirmButtonVariants[variant]
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : confirmText}
          </button>
        </>
      }
    />
  )
}
