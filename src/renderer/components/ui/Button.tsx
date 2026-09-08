import type { ButtonProps as AntdButtonProps } from 'antd';
import { Button as AntdButton } from 'antd'
import { cn } from '@renderer/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<AntdButtonProps, 'className' | 'variant' | 'size'> {
  variant?: ButtonVariant
  /** @deprecated Use 'sm' | 'md' | 'lg' instead. 'small' maps to 'sm', 'middle' maps to 'md', 'large' maps to 'lg' */
  size?: ButtonSize | 'small' | 'middle' | 'large'
  fullWidth?: boolean
  loading?: boolean
  className?: string
}

const normalizeSize = (size: ButtonSize | 'small' | 'middle' | 'large'): ButtonSize => {
  const sizeMap: Record<string, ButtonSize> = {
    'small': 'sm',
    'middle': 'md',
    'large': 'lg',
  }
  return sizeMap[size] ?? size as ButtonSize
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  ...props
}: ButtonProps) => {
  const normalizedSize = normalizeSize(size)

  const variants: Record<ButtonVariant, string> = {
    primary: cn(
      'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 active:bg-[var(--color-primary)]/70',
      'text-[var(--color-bg-base)] font-semibold',
      'shadow-sm hover:shadow-md',
      'focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-base)]'
    ),
    secondary: cn(
      'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-darker)] active:bg-[var(--color-bg-darkest)]',
      'text-[var(--color-text-normal)] font-semibold',
      'border border-[var(--color-border)]',
      'shadow-sm hover:shadow-md',
      'focus:ring-2 focus:ring-[var(--color-border)] focus:ring-offset-2'
    ),
    danger: cn(
      'bg-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/80 active:bg-[var(--color-dnd)]/70',
      'text-[var(--color-bg-base)] font-semibold',
      'shadow-sm hover:shadow-md',
      'focus:ring-2 focus:ring-[var(--color-dnd)]/30 focus:ring-offset-2'
    ),
    success: cn(
      'bg-[var(--color-online)] hover:bg-[var(--color-online)]/80 active:bg-[var(--color-online)]/70',
      'text-[var(--color-bg-base)] font-semibold',
      'shadow-sm hover:shadow-md',
      'focus:ring-2 focus:ring-[var(--color-online)]/30 focus:ring-offset-2'
    ),
    warning: cn(
      'bg-[var(--color-idle)] hover:bg-[var(--color-idle)]/80 active:bg-[var(--color-idle)]/70',
      'text-[var(--color-bg-base)] font-semibold',
      'shadow-sm hover:shadow-md',
      'focus:ring-2 focus:ring-[var(--color-idle)]/30 focus:ring-offset-2'
    ),
    ghost: cn(
      'bg-transparent hover:bg-[var(--color-bg-tertiary)] active:bg-[var(--color-bg-darker)]',
      'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] font-semibold',
      'focus:ring-2 focus:ring-[var(--color-border)]'
    ),
    outline: cn(
      'bg-transparent hover:bg-[var(--color-primary)]/10 active:bg-[var(--color-primary)]/20',
      'text-[var(--color-primary)] font-semibold',
      'border-2 border-[var(--color-primary)]',
      'focus:ring-2 focus:ring-[var(--color-primary)]/30'
    ),
  }

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-8 py-3.5 text-base rounded-2xl',
  }

  return (
    <AntdButton
      className={cn(
        'font-medium transition-colors duration-150 ease-out transition-transform',
        'focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        'active:scale-95 hover:scale-[1.01] hover:duration-150',
        'inline-flex items-center justify-center gap-2',
        variants[variant],
        sizes[normalizedSize],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  )
}
