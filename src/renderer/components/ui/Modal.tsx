import type { ReactNode } from 'react'
import { cn } from '@renderer/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'glass'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
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
}: ModalProps) => {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  }

  const variants = {
    default: cn(
      'bg-white dark:bg-[var(--color-bg-tertiary-dark)]',
      'border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]'
    ),
    glass: cn(
      'bg-[var(--color-glass-light)] dark:bg-[var(--color-glass-dark)]',
      'backdrop-blur-[var(--blur-xl)]',
      'border border-[var(--color-glass-border-light)] dark:border-[var(--color-glass-border-dark)]'
    ),
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200 animate-[fade-in_0.2s_ease-out]"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full rounded-[var(--radius-xl)] shadow-[var(--shadow-floating)]',
          'animate-[scale-in_0.2s_ease-out]',
          sizes[size],
          variants[variant]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
          <div className="flex-1 pr-4">
            <h3 className="text-xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                'w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center',
                'text-[var(--color-text-tertiary-light)] hover:text-[var(--color-text-secondary-light)] dark:hover:text-[var(--color-text-secondary-dark)]',
                'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
                'transition-[var(--transition-all)]',
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
          <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-bg-secondary-light)]/50 dark:bg-[var(--color-bg-secondary-dark)]/50 rounded-b-[var(--radius-xl)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger' | 'warning'
  loading?: boolean
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) => {
  const confirmButtonVariants = {
    default: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white',
    danger: 'bg-[var(--color-error)] hover:bg-[var(--color-error-hover)] text-white',
    warning: 'bg-[var(--color-warning)] hover:bg-[var(--color-warning-hover)] text-white',
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
              'px-5 py-2.5 rounded-[var(--radius-lg)] font-medium',
              'bg-[var(--color-bg-tertiary-light)] hover:bg-[var(--color-border-light)] dark:bg-[var(--color-bg-tertiary-dark)] dark:hover:bg-[var(--color-border-dark)]',
              'text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
              'transition-[var(--transition-all)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-5 py-2.5 rounded-[var(--radius-lg)] font-medium',
              'transition-[var(--transition-all)]',
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
                处理中...
              </span>
            ) : confirmText}
          </button>
        </>
      }
    />
  )
}
