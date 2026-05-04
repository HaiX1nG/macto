import '@testing-library/jest-dom'

// Mock electron API
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

// Mock matchMedia
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
