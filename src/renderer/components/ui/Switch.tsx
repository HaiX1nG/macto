import React from 'react'
import { Switch as AntdSwitch } from 'antd'
import type { SwitchProps as AntdSwitchProps } from 'antd'
import { cn } from '@renderer/utils/cn'

/**
 * Switch Size Variant
 */
type SwitchSize = 'sm' | 'md' | 'lg'

/**
 * Switch Props Interface
 */
interface SwitchProps extends Omit<AntdSwitchProps, 'size' | 'className'> {
  /** Size of the switch - sm, md, or lg */
  size?: SwitchSize
  /** Additional class names */
  className?: string
}

/**
 * Switch - A toggle switch component
 *
 * Built on top of Ant Design's Switch with custom Tailwind styling
 * using CSS variables for theme color support.
 *
 * @example
 * ```tsx
 * <Switch
 *   checked={isEnabled}
 *   onChange={setIsEnabled}
 *   size="md"
 * />
 * ```
 */
export const Switch = React.memo(
  ({ size = 'md', className, checked, defaultChecked, onChange, disabled, ...props }: SwitchProps) => {
    const sizes: Record<SwitchSize, string> = {
      sm: cn('[&_.ant-switch]:w-8 [&_.ant-switch]:h-4', '[&_.ant-switch-handle]:w-3 [&_.ant-switch-handle]:h-3'),
      md: cn('[&_.ant-switch]:w-11 [&_.ant-switch]:h-6', '[&_.ant-switch-handle]:w-5 [&_.ant-switch-handle]:h-5'),
      lg: cn('[&_.ant-switch]:w-14 [&_.ant-switch]:h-7', '[&_.ant-switch-handle]:w-6 [&_.ant-switch-handle]:h-6'),
    }

    return (
      <AntdSwitch
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          // Base styling with custom primary color
          '[&_.ant-switch-checked]:bg-[var(--color-primary)]',
          '[&_.ant-switch]:bg-[var(--color-bg-darker)]',
          // Smooth transitions
          '[&_.ant-switch]:transition-colors [&_.ant-switch]:duration-200',
          '[&_.ant-switch-handle]:transition-transform [&_.ant-switch-handle]:duration-200',
          // Handle positioning
          '[&_.ant-switch-checked_.ant-switch-handle]:translate-x-full',
          // Size variants
          sizes[size],
          // Disabled state
          'disabled:[&_.ant-switch]:opacity-50 disabled:[&_.ant-switch]:cursor-not-allowed',
          className
        )}
        {...props}
      />
    )
  }
)

Switch.displayName = 'Switch'
