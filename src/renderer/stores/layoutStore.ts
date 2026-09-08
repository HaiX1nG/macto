/**
 * @deprecated layoutStore has been merged into uiStore.
 * This file re-exports from uiStore for backward compatibility.
 * Import from '@renderer/stores/uiStore' directly in new code.
 *
 * Layout constants (BREAKPOINTS, SIDEBAR_WIDTHS, HEADER_HEIGHT) and
 * Breakpoint type are exported from uiStore.
 */
export {
  useUIStore as useLayoutStore,
  BREAKPOINTS,
  SIDEBAR_WIDTHS,
  HEADER_HEIGHT,
  type Breakpoint,
} from './uiStore'
