/**
 * Framer Motion Animation Variants
 *
 * This file provides standardized animation variants for consistent motion design
 * across the Macto application.
 *
 * ## When to use CSS vs Framer Motion:
 *
 * ### Use CSS animations when:
 * - Simple show/hide transitions (opacity, transform)
 * - Hover and focus states
 * - Performance-critical repeated animations (spinners, loading states)
 * - No need for exit animations or gesture handling
 *
 * ### Use Framer Motion when:
 * - Complex enter/exit animations with AnimatePresence
 * - Gesture-based interactions (drag, swipe to dismiss)
 * - Sequence or staggered animations
 * - Dynamic animation values based on state
 * - Shared layout animations (layoutId)
 *
 * ## Animation Timing Standards:
 * - fast: 150ms - Micro-interactions, feedback
 * - normal: 200ms - Standard UI transitions (default)
 * - slow: 300ms - Emphasized transitions, modals
 *
 * ## Easing:
 * - Default: ease-out (deceleration) - Most UI elements entering
 * - Spring: For natural, physics-based motion (modals, cards)
 */

import type { Variants, Transition } from 'framer-motion'

// Standard timing constants
export const DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  verySlow: 0.5,
} as const

// Standard easing curves
export const EASE = {
  default: [0.4, 0, 0.2, 1], // ease-out
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
} as const

// Spring configurations for natural motion
export const SPRING = {
  gentle: { type: 'spring', stiffness: 200, damping: 25 } as Transition,
  bouncy: { type: 'spring', stiffness: 400, damping: 20 } as Transition,
  snappy: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
  smooth: { type: 'spring', stiffness: 150, damping: 20 } as Transition,
} as const

/**
 * Fade animation - simple opacity transition
 * Use for: Overlays, tooltips, simple show/hide
 */
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE.default }
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASE.easeIn }
  },
}

/**
 * Slide in from below
 * Use for: Toast notifications, bottom sheets
 */
export const slideInUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE.default }
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: DURATION.fast, ease: EASE.easeIn }
  },
}

/**
 * Slide in from above
 * Use for: Dropdowns, top notifications
 */
export const slideInDownVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE.default }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.fast, ease: EASE.easeIn }
  },
}

/**
 * Scale in animation
 * Use for: Buttons, cards, small UI elements
 */
export const scaleInVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.normal, ease: EASE.default }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: DURATION.fast, ease: EASE.easeIn }
  },
}

/**
 * Modal animation - combines scale, opacity, and vertical movement
 * Use for: Modal dialogs, large overlay content
 */
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASE.default,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: DURATION.fast,
      ease: EASE.easeIn,
    }
  },
}

/**
 * Modal with spring physics for a more natural feel
 * Use for: Important modals that need attention
 */
export const modalSpringVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: DURATION.normal, ease: EASE.easeIn },
  },
}

/**
 * Backdrop animation for modal overlays
 * Use for: Modal background overlay
 */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE.default }
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASE.easeIn }
  },
}

/**
 * Notification slide in from top-right
 * Use for: Toast notifications, update notifications
 */
export const notificationVariants: Variants = {
  initial: { opacity: 0, x: 100, y: -20 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: DURATION.normal, ease: EASE.easeIn }
  },
}

/**
 * Stagger children animation helper
 * Use for: Lists, grids with multiple items
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    }
  },
}

/**
 * Individual item for staggered lists
 */
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.default }
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: DURATION.fast, ease: EASE.easeIn }
  },
}

/**
 * Collapse/expand animation
 * Use for: Accordion, collapsible panels
 * Note: Requires animateHeight or similar technique
 */
export const collapseVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: DURATION.slow, ease: EASE.default },
      opacity: { duration: DURATION.normal, ease: EASE.default },
    }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: DURATION.normal, ease: EASE.easeIn },
      opacity: { duration: DURATION.fast, ease: EASE.easeIn },
    }
  },
}

/**
 * Shimmer/loading pulse
 * Use for: Loading states, skeleton screens
 */
export const pulseVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    }
  },
}
