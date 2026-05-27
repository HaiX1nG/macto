import { vi } from 'vitest'

// Mock navigator.mediaDevices for audio and screen sharing tests
export const mockMediaDevices = {
  getUserMedia: vi.fn(),
  getDisplayMedia: vi.fn(),
  enumerateDevices: vi.fn(),
}

// Mock MediaStream
const mockAudioTrack = {
  kind: 'audio',
  id: 'mock-audio-track',
  label: 'mock-audio',
  enabled: true,
  muted: false,
  onended: null,
  stop: vi.fn(),
  toggle: vi.fn(),
}

const mockVideoTrack = {
  kind: 'video',
  id: 'mock-video-track',
  label: 'mock-video',
  enabled: true,
  muted: false,
  onended: null,
  stop: vi.fn(),
}

const mockStream = {
  getAudioTracks: () => [mockAudioTrack],
  getVideoTracks: () => [mockVideoTrack],
  getTracks: () => [mockAudioTrack, mockVideoTrack],
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
}

// Setup default mocks
mockMediaDevices.getUserMedia.mockResolvedValue(mockStream)
mockMediaDevices.getDisplayMedia.mockResolvedValue(mockStream)
mockMediaDevices.enumerateDevices.mockResolvedValue([
  { kind: 'audioinput', deviceId: 'default-input', label: 'Default Microphone' },
  { kind: 'audiooutput', deviceId: 'default-output', label: 'Default Speakers' },
  { kind: 'videoinput', deviceId: 'default-camera', label: 'Default Camera' },
])

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
})

Object.defineProperty(global.navigator, 'mediaStream', {
  value: mockStream,
  writable: true,
})
