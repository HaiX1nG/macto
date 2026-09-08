import React from 'react'
import { Slider as AntdSlider } from 'antd'
import type { SliderSingleProps as AntdSliderProps } from 'antd/es/slider'
import { cn } from '@renderer/utils/cn'

/**
 * Slider Props Interface
 *
 * Built on top of Ant Design's Slider with custom Tailwind styling.
 */
interface SliderProps extends Omit<AntdSliderProps, 'className' | 'tooltip' | 'tipFormatter'> {
  /** Additional class names */
  className?: string
  /** Format the tooltip value. Set to null to hide tooltip */
  tipFormatter?: (value: number) => React.ReactNode
  /** Whether tooltip is visible */
  tooltipVisible?: boolean
  /** Whether to show tooltip on hover (default: true) */
  showTooltip?: boolean
}

/**
 * Slider - A slider component for selecting a value from a range
 *
 * Built on top of Ant Design's Slider with custom Tailwind styling
 * using CSS variables for theme color support.
 *
 * @example
 * ```tsx
 * <Slider
 *   min={0}
 *   max={100}
 *   value={volume}
 *   onChange={setVolume}
 *   tipFormatter={(v) => `${v}%`}
 * />
 * ```
 */
export const Slider = React.memo(
  ({
    className,
    tipFormatter,
    tooltipVisible,
    showTooltip = true,
    disabled,
    ...props
  }: SliderProps) => {
    const handleTipFormatter = React.useCallback(
      (value: number) => {
        if (tipFormatter) {
          return tipFormatter(value)
        }
        return String(value)
      },
      [tipFormatter]
    )

    // Build tooltip configuration - match Ant Design's SliderTooltipProps
    const tooltipConfig: { open?: boolean; formatter?: (value?: number) => React.ReactNode } | undefined = React.useMemo(() => {
      if (!showTooltip) return undefined
      return {
        open: tooltipVisible,
        formatter: (value: number | undefined) => {
          if (value === undefined) return ''
          return handleTipFormatter(value)
        },
      }
    }, [showTooltip, tooltipVisible, handleTipFormatter])

    return (
      <AntdSlider
        disabled={disabled}
        tooltip={tooltipConfig}
        className={cn(
          // Track styling - custom primary color
          '[&_.ant-slider-track]:bg-[var(--color-primary)]',
          // Rail styling
          '[&_.ant-slider-rail]:bg-[var(--color-bg-darker)]',
          // Handle styling
          '[&_.ant-slider-handle]:border-[var(--color-primary)]',
          '[&_.ant-slider-handle]:bg-[var(--color-bg-base)]',
          '[&_.ant-slider-handle]:shadow-md',
          '[&_.ant-slider-handle]:transition-all',
          '[&_.ant-slider-handle]:duration-200',
          // Handle hover/active states
          '[&_.ant-slider-handle]:hover:border-[var(--color-primary)]/80',
          '[&_.ant-slider-handle]:hover:shadow-lg',
          '[&_.ant-slider-handle]:active:shadow-xl',
          // Handle focus ring
          '[&_.ant-slider-handle]:focus:ring-2',
          '[&_.ant-slider-handle]:focus:ring-[var(--color-primary)]/30',
          // Disabled state
          'disabled:[&_.ant-slider]:opacity-50',
          'disabled:[&_.ant-slider-track]:bg-[var(--color-primary)]/50',
          'disabled:[&_.ant-slider-handle]:border-[var(--color-primary)]/50',
          // Marks styling
          '[&_.ant-slider-dot]:bg-[var(--color-bg-darker)]',
          '[&_.ant-slider-dot]:border-[var(--color-border)]',
          '[&_.ant-slider-dot-active]:bg-[var(--color-primary)]',
          '[&_.ant-slider-dot-active]:border-[var(--color-primary)]',
          // Step marks text
          '[&_.ant-slider-mark-text]:text-[var(--color-text-muted)]',
          className
        )}
        {...props}
      />
    )
  }
)

Slider.displayName = 'Slider'
