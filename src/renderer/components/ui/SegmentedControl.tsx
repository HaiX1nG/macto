import React from 'react'
import { Segmented } from 'antd'
import type { SegmentedValue } from 'antd/es/segmented'
import { cn } from '@renderer/utils/cn'

/**
 * SegmentedControl Option Interface
 */
interface SegmentedOption<T extends SegmentedValue = SegmentedValue> {
  /** Display label for the option */
  label: React.ReactNode
  /** Unique value for the option */
  value: T
  /** Optional icon to display alongside the label */
  icon?: React.ReactNode
  /** Whether this option is disabled */
  disabled?: boolean
}

/**
 * SegmentedControl Props Interface
 */
interface SegmentedControlProps<T extends SegmentedValue = SegmentedValue> {
  /** Array of options to display */
  options: SegmentedOption<T>[]
  /** Currently selected value */
  value?: T
  /** Default selected value (uncontrolled mode) */
  defaultValue?: T
  /** Callback when the selected value changes */
  onChange?: (value: T) => void
  /** Additional class names */
  className?: string
  /** Whether the control is disabled */
  disabled?: boolean
  /** Size of the segmented control */
  size?: 'small' | 'middle' | 'large'
  /** Optional block prop to make the control fill its container */
  block?: boolean
}

/**
 * SegmentedControl - A view switcher component with pill-shaped segments
 *
 * Built on top of Ant Design's Segmented component with custom Tailwind styling
 * for a macOS-inspired capsule appearance.
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   options={[
 *     { label: 'Grid', value: 'grid', icon: <GridIcon /> },
 *     { label: 'List', value: 'list', icon: <ListIcon /> },
 *   ]}
 *   value={viewMode}
 *   onChange={setViewMode}
 * />
 * ```
 */
export const SegmentedControl = <T extends SegmentedValue = SegmentedValue>({
  options,
  value,
  defaultValue,
  onChange,
  className,
  disabled,
  size = 'middle',
  block,
}: SegmentedControlProps<T>): React.ReactNode => {
  const antdOptions = options.map((opt) => ({
    label: (
      <span className="flex items-center gap-1.5">
        {opt.icon && <span className="flex items-center">{opt.icon}</span>}
        <span>{opt.label}</span>
      </span>
    ),
    value: opt.value,
    disabled: opt.disabled,
  }))

  const handleChange = (val: SegmentedValue) => {
    onChange?.(val as T)
  }

  return (
    <Segmented
      options={antdOptions}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      disabled={disabled}
      size={size}
      block={block}
      className={cn(
        // Custom pill/capsule styling
        '[&_.ant-segmented-group]:rounded-xl',
        '[&_.ant-segmented-item]:rounded-lg',
        '[&_.ant-segmented-item]:transition-all',
        '[&_.ant-segmented-item]:duration-200',
        // Active item styling - primary color highlight
        '[&_.ant-segmented-item-selected]:bg-[var(--color-primary)]/10',
        '[&_.ant-segmented-item-selected]:text-[var(--color-primary)]',
        '[&_.ant-segmented-item-selected]:font-medium',
        // Hover state
        '[&_.ant-segmented-item]:hover:text-[var(--color-text-normal)]',
        // Background
        'bg-[var(--color-bg-tertiary)]/60',
        'border border-[var(--color-border)]',
        'rounded-xl',
        'p-0.5',
        className
      )}
    />
  )
}

SegmentedControl.displayName = 'SegmentedControl'
