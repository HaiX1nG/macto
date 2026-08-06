import type { ReactNode } from 'react'
import { memo } from 'react'
import { cn } from '@renderer/utils/cn'

export interface HeaderButtonProps {
  /** Icon element to render inside the button */
  readonly icon: ReactNode
  /** Click handler */
  readonly onClick?: () => void
  /** Whether the button is in an active/pressed state */
  readonly active?: boolean
  /** Optional accessible label */
  readonly label?: string
}

/**
 * HeaderButton - shared icon button used in page headers.
 *
 * Extracted from ChatView's local `HeaderBtn` helper so that both
 * ChatView (text channel header) and VoicePage (voice header) can reuse it.
 */
export const HeaderButton = memo(function HeaderButton({
  icon,
  onClick,
  active,
  label,
}: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-lg',
        'transition-[transform,background-color,color] duration-150',
        'hover:scale-105 active:scale-95',
        active
          ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/15 shadow-sm shadow-[var(--color-primary)]/20'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-tertiary)]',
      )}
    >
      {icon}
    </button>
  )
})

export default HeaderButton
