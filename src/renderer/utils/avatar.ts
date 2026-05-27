/**
 * Avatar Utility Functions
 *
 * Shared functions for generating avatar gradients and colors.
 */

/**
 * Avatar gradient options using CSS custom properties
 */
const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
  'bg-gradient-to-br from-[var(--color-online)] to-[var(--color-secondary)]',
  'bg-gradient-to-br from-[var(--color-idle)] to-[var(--color-dnd)]',
  'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-primary)]',
  'bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-primary)]',
] as const

/**
 * Extended avatar gradients for more variety
 */
const EXTENDED_AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
  'bg-gradient-to-br from-[var(--color-online)] to-[var(--color-secondary)]',
  'bg-gradient-to-br from-[var(--color-idle)] to-[var(--color-accent)]',
  'bg-gradient-to-br from-[var(--color-dnd)] to-[var(--color-accent)]',
  'bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-primary)]',
] as const

/**
 * Simple avatar gradient using CSS variables
 */
const SIMPLE_AVATAR_GRADIENT =
  'bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]'

/**
 * Generate a consistent avatar gradient based on a name or ID
 *
 * Uses the first character's char code to deterministically select
 * a gradient, ensuring the same name always gets the same gradient.
 *
 * @param name - The name or identifier to generate gradient for
 * @param variant - The gradient variant to use ('default', 'extended', or 'simple')
 * @returns Tailwind CSS class string for the gradient
 *
 * @example
 * ```tsx
 * const gradient = getAvatarGradient('John')
 * // Returns a consistent gradient class based on 'J' char code
 * ```
 */
export function getAvatarGradient(
  name: string,
  variant: 'default' | 'extended' | 'simple' = 'default'
): string {
  if (variant === 'simple') {
    return SIMPLE_AVATAR_GRADIENT
  }

  const gradients = variant === 'extended' ? EXTENDED_AVATAR_GRADIENTS : AVATAR_GRADIENTS
  const charCode = name.charCodeAt(0)
  return gradients[charCode % gradients.length]
}

/**
 * Get the first letter of a name for avatar display
 *
 * @param name - The name to extract the initial from
 * @returns The uppercase first letter of the name
 *
 * @example
 * ```tsx
 * const initial = getAvatarInitial('John Doe')
 * // Returns 'J'
 * ```
 */
export function getAvatarInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

/**
 * Check if a string is a valid avatar URL
 *
 * @param avatar - The avatar string to check
 * @returns True if the string looks like a valid URL
 */
export function isValidAvatarUrl(avatar: string | undefined): avatar is string {
  if (!avatar) return false
  return avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')
}
