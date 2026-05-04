import type { InputProps as AntdInputProps } from 'antd';
import { Input as AntdInput } from 'antd'
import { cn } from '@renderer/utils/cn'

interface InputProps extends Omit<AntdInputProps, 'className'> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
  size?: 'small' | 'middle' | 'large'
  variant?: 'default' | 'filled' | 'borderless'
  fullWidth?: boolean
  className?: string
}

export const Input = ({
  label,
  error,
  hint,
  icon,
  suffix,
  size = 'middle',
  variant = 'default',
  fullWidth = true,
  className,
  ...props
}: InputProps) => {
  const variants = {
    default: cn(
      'bg-white dark:bg-[var(--color-bg-tertiary-dark)]',
      'border border-[var(--color-border-secondary-light)] dark:border-[var(--color-border-dark)]',
      'focus:border-[var(--color-primary)] dark:focus:border-[var(--color-primary)]',
      'focus:ring-2 focus:ring-[var(--color-primary)]/20 dark:focus:ring-[var(--color-primary)]/20'
    ),
    filled: cn(
      'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
      'border border-transparent',
      'focus:bg-white dark:focus:bg-[var(--color-bg-tertiary-dark)]',
      'focus:border-[var(--color-primary)] dark:focus:border-[var(--color-primary)]',
      'focus:ring-2 focus:ring-[var(--color-primary)]/20 dark:focus:ring-[var(--color-primary)]/20'
    ),
    borderless: cn(
      'bg-transparent',
      'border-b-2 border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'rounded-none',
      'focus:border-[var(--color-primary)] dark:focus:border-[var(--color-primary)]',
      'hover:border-[var(--color-border-secondary-light)] dark:hover:border-[var(--color-border-secondary-dark)]'
    ),
  }

  const sizes = {
    small: 'px-3 py-1.5 text-xs',
    middle: 'px-4 py-2.5 text-sm',
    large: 'px-5 py-3.5 text-base',
  }

  return (
    <div className={cn('w-full', !fullWidth && 'w-auto')}>
      {label && (
        <label className="block text-sm font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)] pointer-events-none">
            {icon}
          </div>
        )}
        <AntdInput
          className={cn(
            'rounded-[var(--radius-lg)] text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
            'placeholder:text-[var(--color-text-tertiary-light)] dark:placeholder:text-[var(--color-text-tertiary-dark)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'disabled:bg-[var(--color-bg-secondary-light)] dark:disabled:bg-[var(--color-bg-secondary-dark)]/50',
            'transition-[var(--transition-colors)] ease-out',
            'hover:border-[var(--color-border-secondary-light)] dark:hover:border-[var(--color-border-secondary-dark)]',
            variants[variant],
            sizes[size],
            icon && 'pl-11',
            suffix && 'pr-11',
            error && 'border-[var(--color-error)] dark:border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20',
            className
          )}
          suffix={suffix}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-xs text-[var(--color-error)] dark:text-[var(--color-error)] font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-2 text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
          {hint}
        </p>
      )}
    </div>
  )
}

interface TextAreaProps extends Omit<AntdInputProps, 'className'> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
  className?: string
}

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
        <label className="block text-sm font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-2">
          {label}
        </label>
      )}
      <AntdTextArea
        className={cn(
          'rounded-[var(--radius-lg)] text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
          'bg-white dark:bg-[var(--color-bg-tertiary-dark)]',
          'border border-[var(--color-border-secondary-light)] dark:border-[var(--color-border-dark)]',
          'placeholder:text-[var(--color-text-tertiary-light)] dark:placeholder:text-[var(--color-text-tertiary-dark)]',
          'focus:border-[var(--color-primary)] dark:focus:border-[var(--color-primary)]',
          'focus:ring-2 focus:ring-[var(--color-primary)]/20 dark:focus:ring-[var(--color-primary)]/20',
          'hover:border-[var(--color-border-secondary-light)] dark:hover:border-[var(--color-border-secondary-dark)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'disabled:bg-[var(--color-bg-secondary-light)] dark:disabled:bg-[var(--color-bg-secondary-dark)]/50',
          'transition-[var(--transition-colors)] ease-out',
          'px-4 py-3 text-sm',
          error && 'border-[var(--color-error)] dark:border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-xs text-[var(--color-error)] dark:text-[var(--color-error)] font-medium">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-2 text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
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
