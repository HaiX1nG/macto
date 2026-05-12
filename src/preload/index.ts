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

  'screen:get-sources': null
  'screen:start': { sessionId: string }
  'screen:stop': { sessionId: string }
  'screen:set-control': { enabled: boolean }

  'audio:get-sources': null

  'system:notification': { title: string; body: string; roomId?: number; senderId?: number }
  'system:notification-supported': null
  'system:notification-set-enabled': { enabled: boolean }
  'system:notification-get-enabled': null
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

  'screen:get-sources': { id: string; name: string; thumbnail: string }[]
  'screen:start': { success: boolean; streamId: string }
  'screen:stop': { success: boolean }
  'screen:set-control': { success: boolean }

  'audio:get-sources': { id: string; name: string }[]

  'system:notification': { success: boolean }
  'system:notification-supported': boolean
  'system:notification-set-enabled': { success: boolean }
  'system:notification-get-enabled': { enabled: boolean }
  'system:tray-click': null
}

// Update types
export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string | null
}

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  total: number
  transferred: number
}

export interface UpdateStatus {
  currentVersion: string
  latestVersion: string | null
  updateAvailable: boolean
  updateDownloaded: boolean
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
  getScreenSources: () => ipcRenderer.invoke('screen:get-sources'),
  startScreen: (sessionId: string) => ipcRenderer.invoke('screen:start', { sessionId }),
  stopScreen: (sessionId: string) => ipcRenderer.invoke('screen:stop', { sessionId }),
  setScreenControl: (enabled: boolean) => ipcRenderer.invoke('screen:set-control', { enabled }),

  // Audio
  getAudioSources: () => ipcRenderer.invoke('audio:get-sources'),

  // System
  sendNotification: (title: string, body: string, options?: { roomId?: number; senderId?: number }) =>
    ipcRenderer.invoke('system:notification', { title, body, ...options }),
  isNotificationSupported: () => ipcRenderer.invoke('system:notification-supported'),
  setNotificationEnabled: (enabled: boolean) =>
    ipcRenderer.invoke('system:notification-set-enabled', { enabled }),
  getNotificationEnabled: () => ipcRenderer.invoke('system:notification-get-enabled'),
  onNotificationClick: (callback: (data: { roomId?: number; senderId?: number }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: { roomId?: number; senderId?: number }) =>
      callback(data)
    ipcRenderer.on('system:notification-click', listener)
    return () => ipcRenderer.removeListener('system:notification-click', listener)
  },
  onTrayClick: (callback: () => void) => {
    const listener = (_event: Electron.IpcRendererEvent) => callback()
    ipcRenderer.on('system:tray-click', listener)
    return () => ipcRenderer.removeListener('system:tray-click', listener)
  },

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  quitAndInstall: () => ipcRenderer.invoke('update:install'),
  getUpdateVersion: () => ipcRenderer.invoke('update:get-version'),
  onUpdateChecking: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('update:checking', listener)
    return () => ipcRenderer.removeListener('update:checking', listener)
  },
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info)
    ipcRenderer.on('update:available', listener)
    return () => ipcRenderer.removeListener('update:available', listener)
  },
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: { version: string }) =>
      callback(info)
    ipcRenderer.on('update:not-available', listener)
    return () => ipcRenderer.removeListener('update:not-available', listener)
  },
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: UpdateProgress) =>
      callback(progress)
    ipcRenderer.on('update:progress', listener)
    return () => ipcRenderer.removeListener('update:progress', listener)
  },
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info)
    ipcRenderer.on('update:downloaded', listener)
    return () => ipcRenderer.removeListener('update:downloaded', listener)
  },
  onUpdateError: (callback: (error: { message: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: { message: string }) =>
      callback(error)
    ipcRenderer.on('update:error', listener)
    return () => ipcRenderer.removeListener('update:error', listener)
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
  off: (channel: string, listener?: (...args: unknown[]) => void) => {
    if (listener) {
      ipcRenderer.off(channel, listener as (...args: unknown[]) => void)
    }
  },
}

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', api)

export type API = typeof api
