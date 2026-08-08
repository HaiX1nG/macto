import type { WebRTCSignalRequest } from '@shared/types/api'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export type SignalCallback = (signal: WebRTCSignalRequest) => void
export type StreamCallback = (userId: number, username: string, stream: MediaStream) => void
export type DisconnectedCallback = (userId: number) => void

export class WebRTCManager {
  private peerConnections: Map<number, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private onSignal: SignalCallback
  private onRemoteStream: StreamCallback
  private onDisconnected: DisconnectedCallback

  constructor(
    _currentUserId: number,
    onSignal: SignalCallback,
    onRemoteStream: StreamCallback,
    onDisconnected: DisconnectedCallback
  ) {
    this.onSignal = onSignal
    this.onRemoteStream = onRemoteStream
    this.onDisconnected = onDisconnected
  }

  /**
   * Start screen sharing (create offer for each participant).
   * Sends both video and audio tracks via WebRTC.
   */
  async startScreenShare(stream: MediaStream, targetUserIds: number[]): Promise<void> {
    this.localStream = stream

    for (const targetUserId of targetUserIds) {
      await this.createOffer(targetUserId)
    }
  }

  /**
   * Stop screen sharing - closes all peer connections and stops local tracks.
   */
  stopScreenShare(): void {
    this.localStream?.getTracks().forEach(track => track.stop())
    this.localStream = null

    this.peerConnections.forEach((pc) => {
      pc.close()
    })
    this.peerConnections.clear()
  }

  /**
   * Start voice chat - creates a peer connection with audio tracks
   * for each target user. Similar to startScreenShare but only sends
   * audio tracks and uses offerToReceiveAudio for bidirectional audio.
   */
  async startVoiceChat(stream: MediaStream, targetUserIds: number[]): Promise<void> {
    this.localStream = stream

    for (const targetUserId of targetUserIds) {
      // Skip if a connection already exists for this user
      if (this.peerConnections.has(targetUserId)) {
        // Update the existing connection's tracks
        const existingPc = this.peerConnections.get(targetUserId)!
        this.localStream.getAudioTracks().forEach(track => {
          const senders = existingPc.getSenders()
          const existingSender = senders.find(s => s.track?.kind === 'audio')
          if (existingSender) {
            existingSender.replaceTrack(track).catch(err => {
              console.error('[WebRTC] Failed to replace audio track:', err)
            })
          } else {
            existingPc.addTrack(track, this.localStream!)
          }
        })
        continue
      }
      await this.createVoiceOffer(targetUserId)
    }
  }

  /**
   * Stop voice chat - closes all peer connections but does NOT stop
   * local stream tracks (the caller manages the local stream lifecycle).
   */
  stopVoiceChat(): void {
    // Do not stop local tracks here - the voice store manages the stream.
    // Only close peer connections.
    this.peerConnections.forEach((pc) => {
      pc.close()
    })
    this.peerConnections.clear()
    this.localStream = null
  }

  /**
   * Create a peer connection and offer for screen sharing.
   * Sends all local tracks (video + audio).
   */
  private async createOffer(targetUserId: number): Promise<void> {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    this.peerConnections.set(targetUserId, pc)

    // Add local tracks (both video and audio for screen share)
    this.localStream?.getTracks().forEach(track => {
      if (this.localStream) {
        pc.addTrack(track, this.localStream)
      }
    })

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onSignal({
          type: 'ice-candidate',
          targetId: targetUserId,
          payload: JSON.stringify(event.candidate.toJSON()),
        })
      }
    }

    // Create offer - do not request to receive (sender-only for screen share)
    const offer = await pc.createOffer({
      offerToReceiveVideo: false,
      offerToReceiveAudio: false,
    })
    await pc.setLocalDescription(offer)

    // Send offer to target
    this.onSignal({
      type: 'offer',
      targetId: targetUserId,
      payload: JSON.stringify(offer),
    })
  }

  /**
   * Create a peer connection and offer for voice chat.
   * Sends audio tracks and requests to receive audio (bidirectional).
   */
  private async createVoiceOffer(targetUserId: number): Promise<void> {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    this.peerConnections.set(targetUserId, pc)

    // Add local audio tracks
    this.localStream?.getAudioTracks().forEach(track => {
      if (this.localStream) {
        pc.addTrack(track, this.localStream)
      }
    })

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onSignal({
          type: 'ice-candidate',
          targetId: targetUserId,
          payload: JSON.stringify(event.candidate.toJSON()),
        })
      }
    }

    // Handle remote stream (the other person's audio)
    pc.ontrack = (event) => {
      const stream = event.streams[0]
      this.onRemoteStream(targetUserId, '', stream)
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.onDisconnected(targetUserId)
      }
    }

    // Create offer - request to receive audio for bidirectional voice chat
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    })
    await pc.setLocalDescription(offer)

    // Send offer to target
    this.onSignal({
      type: 'offer',
      targetId: targetUserId,
      payload: JSON.stringify(offer),
    })
  }

  // Handle incoming signal
  async handleSignal(fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest): Promise<void> {
    switch (signal.type) {
      case 'offer':
        await this.handleOffer(fromUserId, fromUsername, signal.payload)
        break
      case 'answer':
        await this.handleAnswer(fromUserId, signal.payload)
        break
      case 'ice-candidate':
        await this.handleIceCandidate(fromUserId, signal.payload)
        break
    }
  }

  /**
   * Handle offer from remote user (they want to share screen/voice with us).
   * Creates a peer connection, sets up remote stream handling, and sends answer.
   */
  private async handleOffer(fromUserId: number, fromUsername: string, offerPayload: string): Promise<void> {
    // Reuse existing connection if present, otherwise create new
    let pc = this.peerConnections.get(fromUserId)
    if (!pc) {
      pc = new RTCPeerConnection(RTC_CONFIG)
      this.peerConnections.set(fromUserId, pc)

      // Handle remote stream
      pc.ontrack = (event) => {
        const stream = event.streams[0]
        this.onRemoteStream(fromUserId, fromUsername, stream)
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.onSignal({
            type: 'ice-candidate',
            targetId: fromUserId,
            payload: JSON.stringify(event.candidate.toJSON()),
          })
        }
      }

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc!.connectionState === 'disconnected' || pc!.connectionState === 'failed') {
          this.onDisconnected(fromUserId)
        }
      }

      // If we have a local stream (e.g., we are also in voice chat), add our tracks
      // so the other side receives our audio too
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach(track => {
          pc!.addTrack(track, this.localStream!)
        })
      }
    }

    // Set remote description (offer)
    const offer = JSON.parse(offerPayload) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(new RTCSessionDescription(offer))

    // Create and set answer
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    // Send answer back
    this.onSignal({
      type: 'answer',
      targetId: fromUserId,
      payload: JSON.stringify(answer),
    })
  }

  /**
   * Handle answer from remote user (they accepted our offer).
   */
  private async handleAnswer(fromUserId: number, answerPayload: string): Promise<void> {
    const pc = this.peerConnections.get(fromUserId)
    if (!pc) return

    const answer = JSON.parse(answerPayload) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(new RTCSessionDescription(answer))
  }

  /**
   * Handle ICE candidate from remote user.
   */
  private async handleIceCandidate(fromUserId: number, candidatePayload: string): Promise<void> {
    const pc = this.peerConnections.get(fromUserId)
    if (!pc) return

    const candidate = JSON.parse(candidatePayload) as RTCIceCandidateInit
    await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  /**
   * Close a specific peer connection.
   */
  closeConnection(userId: number): void {
    const pc = this.peerConnections.get(userId)
    if (pc) {
      pc.close()
      this.peerConnections.delete(userId)
    }
  }

  /**
   * Close all connections and stop local tracks.
   */
  closeAll(): void {
    this.localStream?.getTracks().forEach(track => track.stop())
    this.localStream = null
    this.peerConnections.forEach(pc => pc.close())
    this.peerConnections.clear()
  }

  /**
   * Get the local stream.
   */
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * Set the local stream (used when the stream is managed externally,
   * e.g., by voiceStore).
   */
  setLocalStream(stream: MediaStream | null): void {
    this.localStream = stream
  }

  /**
   * Check if currently sharing.
   */
  isSharing(): boolean {
    return this.localStream !== null
  }

  /**
   * Get the list of connected peer user IDs.
   */
  getConnectedUserIds(): number[] {
    return Array.from(this.peerConnections.keys())
  }
}

export default WebRTCManager
