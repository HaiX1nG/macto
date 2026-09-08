import { useRef, useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useMediaStore } from '../stores/mediaStore'
import { wsConnection } from '../services/wsConnection'
import type { WebRTCSignalRequest } from '@shared/types/voice'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function useAudioShare() {
  const { message } = App.useApp()
  const { currentUser } = useAuthStore()
  const currentChannelId = useUIStore((s) => s.currentChannelId)
  const { addRemoteScreen, removeRemoteScreen } = useMediaStore()

  const [isAudioSharing, setIsAudioSharing] = useState(false)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<number, RTCPeerConnection>>(new Map())
  const unsubsRef = useRef<Array<() => void>>([])

  const handleOffer = useCallback(async (fromUserId: number, fromUsername: string, offerPayload: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    peerConnectionsRef.current.set(fromUserId, pc)

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      addRemoteScreen(fromUserId, fromUsername, stream)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const ws = wsConnection.getCurrentWs()
        ws?.sendWebRTCSignal('ice-candidate', fromUserId, JSON.stringify(event.candidate.toJSON()))
      }
    }

    const offer = JSON.parse(offerPayload) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    const ws = wsConnection.getCurrentWs()
    ws?.sendWebRTCSignal('answer', fromUserId, JSON.stringify(answer))
  }, [addRemoteScreen])

  const handleAnswer = useCallback(async (fromUserId: number, answerPayload: string) => {
    const pc = peerConnectionsRef.current.get(fromUserId)
    if (!pc) return

    const answer = JSON.parse(answerPayload) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(new RTCSessionDescription(answer))
  }, [])

  const handleIceCandidate = useCallback(async (fromUserId: number, candidatePayload: string) => {
    const pc = peerConnectionsRef.current.get(fromUserId)
    if (!pc) return

    const candidate = JSON.parse(candidatePayload) as RTCIceCandidateInit
    await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }, [])

  const handleSignal = useCallback(async (fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest) => {
    switch (signal.type) {
      case 'offer':
        await handleOffer(fromUserId, fromUsername, signal.payload)
        break
      case 'answer':
        await handleAnswer(fromUserId, signal.payload)
        break
      case 'ice-candidate':
        await handleIceCandidate(fromUserId, signal.payload)
        break
    }
  }, [handleOffer, handleAnswer, handleIceCandidate])

  // Register WebSocket listeners on the shared connection
  useEffect(() => {
    if (!currentChannelId || !currentUser) return

    unsubsRef.current.forEach((unsub) => unsub())
    unsubsRef.current = []

    const registerHandlers = () => {
      const ws = wsConnection.getCurrentWs()
      if (!ws) {
        setTimeout(registerHandlers, 500)
        return
      }

      // Audio share now uses screen_share_start/stop events (merged protocol)
      unsubsRef.current.push(
        ws.on('screen_share_start', (data: unknown) => {
          const info = data as { channelId: number; userId: number }
          if (info.userId !== currentUser?.id) {
            message.info('有人开始分享音频')
          }
        })
      )

      unsubsRef.current.push(
        ws.on('screen_share_stop', (data: unknown) => {
          const info = data as { channelId: number; userId: number }
          const pc = peerConnectionsRef.current.get(info.userId)
          if (pc) {
            pc.close()
            peerConnectionsRef.current.delete(info.userId)
          }
          removeRemoteScreen(info.userId)
        })
      )

      unsubsRef.current.push(
        ws.on('webrtc_signal', (data: unknown) => {
          const signal = data as { fromUserId: number; fromUsername: string; signal: { type: 'offer' | 'answer' | 'ice-candidate'; payload: string } }
          handleSignal(signal.fromUserId, signal.fromUsername, signal.signal as WebRTCSignalRequest)
        })
      )
    }

    registerHandlers()

    return () => {
      unsubsRef.current.forEach((unsub) => unsub())
      unsubsRef.current = []
    }
  }, [currentChannelId, currentUser, removeRemoteScreen, message, handleSignal])

  // Start audio share using getDisplayMedia to capture system audio.
  const startAudioShare = useCallback(async (_sourceId?: string) => {
    if (!currentChannelId) return

    try {
      // Use getDisplayMedia with audio:true to capture system audio.
      // We request video:true (required by some implementations) but
      // immediately stop video tracks - we only need audio.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      const audioTracks = stream.getAudioTracks()
      const videoTracks = stream.getVideoTracks()

      // Stop video tracks - we only want audio
      videoTracks.forEach((track) => track.stop())

      if (audioTracks.length === 0) {
        message.warning('未捕获到音频轨道，请确保在共享时勾选了"共享音频"选项')
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const audioStream = new MediaStream(audioTracks)

      audioStreamRef.current = audioStream
      setIsAudioSharing(true)

      // Use screen_share_start event (audio share merged into screen share protocol)
      const ws = wsConnection.getCurrentWs()
      ws?.send({
        event: 'screen_share_start',
        data: {
          channelId: currentChannelId,
          userId: currentUser?.id,
        },
      })

      message.success('音频分享已开始')
    } catch (err) {
      console.error('Audio share error:', err)
      message.error('开始音频分享失败')
    }
  }, [currentChannelId, currentUser?.id, message])

  const stopAudioShare = useCallback(async () => {
    if (!currentChannelId) return

    try {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
      }

      peerConnectionsRef.current.forEach((pc) => pc.close())
      peerConnectionsRef.current.clear()

      setIsAudioSharing(false)

      const ws = wsConnection.getCurrentWs()
      ws?.send({
        event: 'screen_share_stop',
        data: {
          channelId: currentChannelId,
          userId: currentUser?.id,
        },
      })

      message.success('音频分享已停止')
    } catch (err) {
      console.error('Stop audio share error:', err)
      message.error('停止音频分享失败')
    }
  }, [currentChannelId, currentUser?.id, message])

  useEffect(() => {
    const audioStream = audioStreamRef.current
    const peerConnections = peerConnectionsRef.current
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop())
      }
      peerConnections.forEach((pc) => pc.close())
    }
  }, [])

  return {
    isAudioSharing,
    startAudioShare,
    stopAudioShare,
  }
}
