// Mock IPC for testing
export const mockInvoke = vi.fn()
export const mockOn = vi.fn()
export const mockOnce = vi.fn()
export const mockOff = vi.fn()

export const mockIPC = {
  invoke: mockInvoke,
  on: mockOn,
  once: mockOnce,
  off: mockOff,
  removeListener: mockOff,
}

export const mockElectron = {
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: mockIPC,
}

vi.mock('electron', () => mockElectron)
