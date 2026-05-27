import type { InputProps as AntdInputProps } from 'antd';
import type { TextAreaProps as AntdTextAreaProps } from 'antd/es/input/TextArea';
import { Input as AntdInput } from 'antd'
import { cn } from '@renderer/utils/cn'

type InputSize = 'sm' | 'md' | 'lg'
type InputVariant = 'default' | 'filled' | 'borderless'

interface InputBaseProps {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
  className?: string
}

interface InputProps extends Omit<AntdInputProps, 'className' | 'size' | 'variant'>, InputBaseProps {
  icon?: React.ReactNode
  suffix?: React.ReactNode
  size?: InputSize
  variant?: InputVariant
  /** @deprecated Use 'sm' | 'md' | 'lg' instead */
  sizeLegacy?: 'small' | 'middle' | 'large'
}

const normalizeSize = (size: InputSize | 'small' | 'middle' | 'large' | undefined): InputSize => {
  if (!size) return 'md'
  const sizeMap: Record<string, InputSize> = {
    'small': 'sm',
    'middle': 'md',
    'large': 'lg',
  }
  return sizeMap[size] ?? size as InputSize
}

export const Input = ({
  label,
  error,
  hint,
  icon,
  suffix,
  size = 'md',
  variant = 'default',
  fullWidth = true,
  className,
  ...props
}: InputProps) => {
  const normalizedSize = normalizeSize(size)

  const variants: Record<InputVariant, string> = {
    default: cn(
      'bg-[var(--color-bg-tertiary)]',
      'border border-[var(--color-border)]',
      'focus:border-[var(--color-primary)]',
      'focus:ring-2 focus:ring-[var(--color-primary)]/20'
    ),
    filled: cn(
      'bg-[var(--color-bg-tertiary)]',
      'border border-transparent',
      'focus:bg-[var(--color-bg-secondary)]',
      'focus:border-[var(--color-primary)]',
      'focus:ring-2 focus:ring-[var(--color-primary)]/20'
    ),
    borderless: cn(
      'bg-transparent',
      'border-b-2 border-[var(--color-border)]',
      'rounded-none',
      'focus:border-[var(--color-primary)]',
      'hover:border-[var(--color-text-muted)]'
    ),
  }

  const sizes: Record<InputSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3.5 text-base',
  }

  return (
    <div className={cn('w-full', !fullWidth && 'w-auto')}>
      {label && (
        <label className="block text-sm font-semibold text-[var(--color-text-normal)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
            {icon}
          </div>
        )}
        <AntdInput
          className={cn(
            'rounded-xl text-[var(--color-text-normal)]',
            'placeholder:text-[var(--color-text-muted)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'disabled:bg-[var(--color-bg-tertiary)]/50',
            'transition-colors duration-200 ease-out',
            'hover:border-[var(--color-text-muted)]',
            variants[variant],
            sizes[normalizedSize],
            icon && 'pl-11',
            suffix && 'pr-11',
            error && 'border-[var(--color-dnd)] focus:border-[var(--color-dnd)] focus:ring-[var(--color-dnd)]/20',
            className
          )}
          suffix={suffix}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-xs text-[var(--color-dnd)] font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  )
}

interface TextAreaProps extends Omit<AntdTextAreaProps, 'className'>, InputBaseProps {}

export const TextArea = ({
  label,
  error,
  hint,
  fullWidth = true,
  className,
  ...props
}: TextAreaProps) => {
  const { TextArea: AntdTextArea } = AntdInput

  return (
    <div className={cn('w-full', !fullWidth && 'w-auto')}>
      {label && (
        <label className="block text-sm font-semibold text-[var(--color-text-normal)] mb-2">
          {label}
        </label>
      )}
      <AntdTextArea
        className={cn(
          'rounded-xl text-[var(--color-text-normal)]',
          'bg-[var(--color-bg-tertiary)]',
          'border border-[var(--color-border)]',
          'placeholder:text-[var(--color-text-muted)]',
          'focus:border-[var(--color-primary)]',
          'focus:ring-2 focus:ring-[var(--color-primary)]/20',
          'hover:border-[var(--color-text-muted)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'disabled:bg-[var(--color-bg-tertiary)]/50',
          'transition-colors duration-200 ease-out',
          'px-4 py-3 text-sm',
          error && 'border-[var(--color-dnd)] focus:border-[var(--color-dnd)] focus:ring-[var(--color-dnd)]/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-xs text-[var(--color-dnd)] font-medium">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  )
}

interface SearchInputProps extends Omit<InputProps, 'icon'> {
  onSearch?: (value: string) => void
}

export const SearchInput = ({
  onSearch,
  className,
  ...props
}: SearchInputProps) => {
  return (
    <Input
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      className={className}
      onPressEnter={(e) => onSearch?.((e.target as HTMLInputElement).value)}
      {...props}
    />
  )
}
