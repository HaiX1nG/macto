import { contextBridge, ipcRenderer } from 'electron'

// Types
export type IPCChannel = keyof IPCPayloads

export interface IPCPayloads {
  'session:create': { name: string }
  'session:join': { sessionId: string }
  'session:leave': { sessionId: string }
  'session:list': null

  'voice:start': null
  'voice:stop': null
  'voice:set-volume': { volume: number }
  'voice:set-mute': { muted: boolean }

  'screen:start': { sessionId: string }
  'screen:stop': { sessionId: string }
  'screen:set-control': { enabled: boolean }

  'system:notification': { title: string; body: string }
  'system:tray-click': null
}

export interface IPCResponders {
  'session:create': { sessionId: string }
  'session:join': { success: boolean }
  'session:leave': { success: boolean }
  'session:list': { sessions: unknown[] }

  'voice:start': { success: boolean }
  'voice:stop': { success: boolean }
  'voice:set-volume': { success: boolean }
  'voice:set-mute': { success: boolean }

  'screen:start': { success: boolean; streamId: string }
  'screen:stop': { success: boolean }
  'screen:set-control': { success: boolean }

  'system:notification': { success: boolean }
  'system:tray-click': null
}

// Safe API exposure
const api = {
  // Session
  createSession: (name: string) => ipcRenderer.invoke('session:create', { name }),
  joinSession: (sessionId: string) => ipcRenderer.invoke('session:join', { sessionId }),
  leaveSession: (sessionId: string) => ipcRenderer.invoke('session:leave', { sessionId }),
  listSessions: () => ipcRenderer.invoke('session:list'),

  // Voice
  startVoice: () => ipcRenderer.invoke('voice:start'),
  stopVoice: () => ipcRenderer.invoke('voice:stop'),
  setVolume: (volume: number) => ipcRenderer.invoke('voice:set-volume', { volume }),
  setMute: (muted: boolean) => ipcRenderer.invoke('voice:set-mute', { muted }),

  // Screen
  startScreen: (sessionId: string) => ipcRenderer.invoke('screen:start', { sessionId }),
  stopScreen: (sessionId: string) => ipcRenderer.invoke('screen:stop', { sessionId }),
  setScreenControl: (enabled: boolean) => ipcRenderer.invoke('screen:set-control', { enabled }),

  // System
  sendNotification: (title: string, body: string) =>
    ipcRenderer.invoke('system:notification', { title, body }),
  onTrayClick: (callback: () => void) => {
    const listener = (_event: Electron.IpcRendererEvent) => callback()
    ipcRenderer.on('system:tray-click', listener)
    return () => ipcRenderer.removeListener('system:tray-click', listener)
  },

  // General
  on: <T = unknown>(channel: string, callback: (data: T) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: T) => callback(data)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  once: <T = unknown>(channel: string, callback: (data: T) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: T) => callback(data)
    ipcRenderer.once(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  off: (channel: string, listener?: Electron.Listener) => {
    ipcRenderer.off(channel, listener)
  },
}

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', api)

export type API = typeof api
