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

  // Start screen sharing (create offer for each participant)
  async startScreenShare(stream: MediaStream, targetUserIds: number[]): Promise<void> {
    this.localStream = stream

    for (const targetUserId of targetUserIds) {
      await this.createOffer(targetUserId)
    }
  }

  // Stop screen sharing
  stopScreenShare(): void {
    this.localStream?.getTracks().forEach(track => track.stop())
    this.localStream = null

    // Close all peer connections
    this.peerConnections.forEach((pc, userId) => {
      pc.close()
      this.peerConnections.delete(userId)
    })
  }

  // Create peer connection and offer
  private async createOffer(targetUserId: number): Promise<void> {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    this.peerConnections.set(targetUserId, pc)

    // Add local tracks
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

    // Create offer
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

  // Handle offer from remote user (they want to share screen with us)
  private async handleOffer(fromUserId: number, fromUsername: string, offerPayload: string): Promise<void> {
    const pc = new RTCPeerConnection(RTC_CONFIG)
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
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.onDisconnected(fromUserId)
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

  // Handle answer from remote user
  private async handleAnswer(fromUserId: number, answerPayload: string): Promise<void> {
    const pc = this.peerConnections.get(fromUserId)
    if (!pc) return

    const answer = JSON.parse(answerPayload) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(new RTCSessionDescription(answer))
  }

  // Handle ICE candidate
  private async handleIceCandidate(fromUserId: number, candidatePayload: string): Promise<void> {
    const pc = this.peerConnections.get(fromUserId)
    if (!pc) return

    const candidate = JSON.parse(candidatePayload) as RTCIceCandidateInit
    await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  // Close a specific peer connection
  closeConnection(userId: number): void {
    const pc = this.peerConnections.get(userId)
    if (pc) {
      pc.close()
      this.peerConnections.delete(userId)
    }
  }

  // Close all connections
  closeAll(): void {
    this.stopScreenShare()
    this.peerConnections.forEach(pc => pc.close())
    this.peerConnections.clear()
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  // Check if sharing
  isSharing(): boolean {
    return this.localStream !== null
  }
}

export default WebRTCManager