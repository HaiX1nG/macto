// Mock localStorage for testing
class LocalStorageMock {
  private store: Record<string, string> = {}

  clear() {
    this.store = {}
  }

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string) {
    this.store[key] = value
  }

  removeItem(key: string) {
    delete this.store[key]
  }

  get length() {
    return Object.keys(this.store).length
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] || null
  }
}

// Setup localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
})

// Mock crypto.randomUUID for deterministic test IDs
if (!global.crypto) {
  global.crypto = {} as Crypto
}
if (!global.crypto.randomUUID) {
  (global.crypto as Crypto).randomUUID = () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }),
  writable: true,
})
