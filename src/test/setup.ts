import { vi } from 'vitest'
import '@testing-library/jest-dom'

// ─── Global localStorage Mock ───────────────────────────────────────────────
// Node.js 26 exposes `globalThis.localStorage` as an experimental getter that
// returns undefined (with a warning). Source code uses bare `localStorage`
// which resolves to `globalThis.localStorage`, NOT happy-dom's
// `window.localStorage`. This breaks modules that access localStorage at
// import time (e.g. apiClient constructor, zustand persist middleware).
//
// We install a proper in-memory Storage on globalThis BEFORE any test modules
// are imported. `configurable: true` lets individual test files override it
// with their own vi.fn()-based mocks via Object.defineProperty.
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// ─── Electron IPC Mock ──────────────────────────────────────────────────────
const mockInvoke = vi.fn()
const mockOn = vi.fn()
const mockOnce = vi.fn()
const mockOff = vi.fn()

Object.defineProperty(window, 'ipcRenderer', {
  value: {
    invoke: mockInvoke,
    on: mockOn,
    once: mockOnce,
    off: mockOff,
    removeListener: mockOff,
  },
  writable: true,
})

// ─── matchMedia Mock ────────────────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
  writable: true,
})
