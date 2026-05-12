import type { ButtonProps as AntdButtonProps } from 'antd';
import { Button as AntdButton } from 'antd'
import { cn } from '@renderer/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning' | 'outline'

interface ButtonProps extends Omit<AntdButtonProps, 'className' | 'variant' | 'size'> {
  variant?: ButtonVariant
  size?: 'small' | 'middle' | 'large'
  fullWidth?: boolean
  loading?: boolean
  className?: string
}

export const Button = ({
  variant = 'primary',
  size = 'middle',
  fullWidth = false,
  className,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: cn(
      /* Base styles */
      'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
      'text-white font-semibold',
      /* Shadow */
      'shadow-[var(--shadow-glow-primary)] hover:shadow-[var(--shadow-glow-primary-hover)]',
      /* Focus ring */
      'focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:ring-offset-2',
      /* Dark mode */
      'dark:bg-[var(--color-primary)] dark:hover:bg-[var(--color-primary-hover)] dark:active:bg-[var(--color-primary-active)]',
      'dark:shadow-[var(--shadow-glow-primary)] dark:hover:shadow-[var(--shadow-glow-primary-hover)]'
    ),
    secondary: cn(
      /* Base styles */
      'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
      'hover:bg-[var(--color-border-light)] dark:hover:bg-[var(--color-border-dark)]',
      'active:bg-[var(--color-border-secondary-light)] dark:active:bg-[var(--color-border-secondary-dark)]',
      'text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] font-semibold',
      /* Border */
      'border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      /* Shadow */
      'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
      /* Focus ring */
      'focus:ring-2 focus:ring-gray-500/30 focus:ring-offset-2'
    ),
    danger: cn(
      /* Base styles */
      'bg-[var(--color-error)] hover:bg-[var(--color-error-hover)] active:bg-[var(--color-error-active)]',
      'text-white font-semibold',
      /* Shadow */
      'shadow-[var(--shadow-glow-error)] hover:shadow-lg hover:shadow-red-500/40',
      /* Focus ring */
      'focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2',
      /* Dark mode */
      'dark:bg-[var(--color-error)] dark:hover:bg-[var(--color-error-hover)] dark:active:bg-[var(--color-error-active)]'
    ),
    success: cn(
      /* Base styles */
      'bg-[var(--color-success)] hover:bg-[var(--color-success-hover)] active:bg-[var(--color-success-active)]',
      'text-white font-semibold',
      /* Shadow */
      'shadow-[var(--shadow-glow-success)] hover:shadow-lg hover:shadow-green-500/40',
      /* Focus ring */
      'focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2',
      /* Dark mode */
      'dark:bg-[var(--color-success)] dark:hover:bg-[var(--color-success-hover)] dark:active:bg-[var(--color-success-active)]'
    ),
    warning: cn(
      /* Base styles */
      'bg-[var(--color-warning)] hover:bg-[var(--color-warning-hover)] active:bg-[var(--color-warning-active)]',
      'text-white font-semibold',
      /* Shadow */
      'shadow-lg shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/40',
      /* Focus ring */
      'focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2',
      /* Dark mode */
      'dark:bg-[var(--color-warning)] dark:hover:bg-[var(--color-warning-hover)] dark:active:bg-[var(--color-warning-active)]'
    ),
    ghost: cn(
      /* Base styles */
      'bg-transparent hover:bg-[var(--color-bg-tertiary-light)] active:bg-[var(--color-border-light)]',
      'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] font-semibold',
      /* Dark mode */
      'dark:hover:bg-[var(--color-bg-tertiary-dark)] dark:active:bg-[var(--color-border-dark)]',
      /* Focus ring */
      'focus:ring-2 focus:ring-gray-500/30'
    ),
    outline: cn(
      /* Base styles */
      'bg-transparent hover:bg-[var(--color-primary-light)] active:bg-blue-100',
      'text-[var(--color-primary)] dark:text-[var(--color-primary)] font-semibold',
      /* Border */
      'border-2 border-[var(--color-primary)]',
      /* Dark mode */
      'dark:hover:bg-[var(--color-primary-light)] dark:active:bg-blue-900/30',
      /* Focus ring */
      'focus:ring-2 focus:ring-[var(--color-primary)]/30'
    ),
  }

  const sizes = {
    small: 'px-3 py-1.5 text-xs rounded-[var(--radius-md)]',
    middle: 'px-5 py-2.5 text-sm rounded-[var(--radius-lg)]',
    large: 'px-8 py-3.5 text-base rounded-[var(--radius-xl)]',
  }

  return (
    <AntdButton
      size={size}
      className={cn(
        /* Base styles */
        'font-medium transition-[var(--transition-all)] ease-out',
        'focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        'active:scale-[0.98] hover:scale-[1.02]',
        'inline-flex items-center justify-center gap-2',
        /* Variant styles */
        variants[variant],
        /* Size styles */
        sizes[size],
        /* Full width */
        fullWidth && 'w-full',
        /* Custom class */
        className
      )}
      {...props}
    />
  )
}
