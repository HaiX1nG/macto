// Session
export interface Session {
  id: string
  name: string
  hostId: string
  participants: Participant[]
  createdAt: number
  isActive: boolean
}

export interface Participant {
  id: string
  name: string
  avatar?: string
  isMuted: boolean
  isSpeaking: boolean
  volume: number
  joinedAt: number
}

// Voice
export interface VoiceState {
  isCapturing: boolean
  isMuted: boolean
  volume: number
  inputDeviceId: string
  outputDeviceId: string
}

// Screen
export interface ScreenStream {
  id: string
  name: string
  url: string
  isShared: boolean
  controlEnabled: boolean
}

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
}

// Settings
export interface Settings {
  audioInputDeviceId: string
  audioOutputDeviceId: string
  defaultVolume: number
  autoJoinLastSession: boolean
  showNotification: boolean
  theme: 'light' | 'dark' | 'system'
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

// IPC Types
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

  'system:notification': { title: string; body: string }
  'system:tray-click': null
}

export interface IPCResponders {
  'session:create': { sessionId: string }
  'session:join': { success: boolean }
  'session:leave': { success: boolean }
  'session:list': { sessions: Session[] }

  'voice:start': { success: boolean }
  'voice:stop': { success: boolean }
  'voice:set-volume': { success: boolean }
  'voice:set-mute': { success: boolean }

  'screen:get-sources': ScreenSource[]
  'screen:start': { success: boolean; streamId: string }
  'screen:stop': { success: boolean }
  'screen:set-control': { success: boolean }

  'system:notification': { success: boolean }
  'system:tray-click': null
}
