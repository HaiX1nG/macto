import { ipcMain, desktopCapturer, type BrowserWindow } from 'electron'
import type { IPCPayloads } from '@shared/types/ipc'

export class IPCManager {
  private readonly window: BrowserWindow

  constructor(window: BrowserWindow) {
    this.window = window
    this.setupListeners()
  }

  private setupListeners() {
    // Session IPC handlers
    this.setupSessionHandlers()
    // Voice IPC handlers
    this.setupVoiceHandlers()
    // Screen IPC handlers
    this.setupScreenHandlers()
    // Audio IPC handlers
    this.setupAudioHandlers()
  }

  private setupSessionHandlers() {
    // Create session
    ipcMain.handle('session:create', async (event, payload: IPCPayloads['session:create']) => {
      const sessionId = crypto.randomUUID()
      this.window.webContents.send('session:created', { sessionId, name: payload.name })
      return { sessionId }
    })

    // Join session
    ipcMain.handle('session:join', async (event, payload: IPCPayloads['session:join']) => {
      this.window.webContents.send('session:joined', { sessionId: payload.sessionId })
      return { success: true }
    })

    // Leave session
    ipcMain.handle('session:leave', async (event, payload: IPCPayloads['session:leave']) => {
      this.window.webContents.send('session:left', { sessionId: payload.sessionId })
      return { success: true }
    })

    // List sessions
    ipcMain.handle('session:list', async () => {
      return { sessions: [] }
    })
  }

  private setupVoiceHandlers() {
    // Start voice capture
    ipcMain.handle('voice:start', async () => {
      this.window.webContents.send('voice:started')
      return { success: true }
    })

    // Stop voice capture
    ipcMain.handle('voice:stop', async () => {
      this.window.webContents.send('voice:stopped')
      return { success: true }
    })

    // Set volume
    ipcMain.handle('voice:set-volume', async (event, payload: IPCPayloads['voice:set-volume']) => {
      this.window.webContents.send('voice:volume-changed', { volume: payload.volume })
      return { success: true }
    })

    // Set mute
    ipcMain.handle('voice:set-mute', async (event, payload: IPCPayloads['voice:set-mute']) => {
      this.window.webContents.send('voice:mute-changed', { muted: payload.muted })
      return { success: true }
    })
  }

  private setupScreenHandlers() {
    // Get screen sources for picker
    ipcMain.handle('screen:get-sources', async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 200, height: 150 }
        })
        return sources.map(source => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL()
        }))
      } catch (err) {
        console.error('Failed to get screen sources:', err)
        return []
      }
    })

    // Start screen sharing
    ipcMain.handle('screen:start', async (event, payload: IPCPayloads['screen:start']) => {
      const streamId = crypto.randomUUID()
      this.window.webContents.send('screen:started', { streamId, sessionId: payload.sessionId })
      return { success: true, streamId }
    })

    // Stop screen sharing
    ipcMain.handle('screen:stop', async (event, payload: IPCPayloads['screen:stop']) => {
      this.window.webContents.send('screen:stopped', { sessionId: payload.sessionId })
      return { success: true }
    })

    // Set screen control
    ipcMain.handle('screen:set-control', async (event, payload: IPCPayloads['screen:set-control']) => {
      this.window.webContents.send('screen:control-changed', { enabled: payload.enabled })
      return { success: true }
    })
  }

  private setupAudioHandlers() {
    // Get audio sources (application audio)
    ipcMain.handle('audio:get-sources', async () => {
      try {
        // Get all windows with audio capability
        const sources = await desktopCapturer.getSources({
          types: ['window', 'screen'],
          thumbnailSize: { width: 1, height: 1 } // We don't need thumbnails for audio
        })
        // Log for debugging
        // eslint-disable-next-line no-console
        console.log('Audio sources found:', sources.map(s => s.name))
        // Filter and return only id and name
        return sources.map(source => ({
          id: source.id,
          name: source.name
        }))
      } catch (err) {
        console.error('Failed to get audio sources:', err)
        return []
      }
    })
  }

  sendNotification(title: string, body: string) {
    this.window.webContents.send('system:notification', { title, body })
  }
}
