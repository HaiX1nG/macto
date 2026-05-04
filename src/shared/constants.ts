// import type { IPCPayloads } from '@shared/types/ipc'

export const IPC_CHANNEL = {
  // Session
  SESSION_CREATE: 'session:create',
  SESSION_JOIN: 'session:join',
  SESSION_LEAVE: 'session:leave',
  SESSION_LIST: 'session:list',

  // Voice
  VOICE_START: 'voice:start',
  VOICE_STOP: 'voice:stop',
  VOICE_SET_VOLUME: 'voice:set-volume',
  VOICE_SET_MUTE: 'voice:set-mute',

  // Screen
  SCREEN_START: 'screen:start',
  SCREEN_STOP: 'screen:stop',
  SCREEN_SET_CONTROL: 'screen:set-control',

  // System
  SYSTEM_NOTIFICATION: 'system:notification',
  SYSTEM_TRAY_CLICK: 'system:tray-click',
} as const

export type IPCChannel = typeof IPC_CHANNEL[keyof typeof IPC_CHANNEL]

export default IPC_CHANNEL
