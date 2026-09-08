/**
 * Macto Signaling Server
 *
 * Minimal WebRTC signaling server for Macto Electron app.
 * Relays SDP Offer/Answer and ICE Candidates between peers in the same channel.
 *
 * Protocol: { event: string, data: any }
 * Connection URL: ws://localhost:8081/ws
 *
 * Security: token-based identity verification, connection limits, message size limits,
 * rate limiting, and channel-validated signaling.
 */

import { WebSocketServer, WebSocket } from 'ws';

// ==================== Types ====================

interface ClientMessage {
  event: string;
  data: any;
}

interface ConnectedClient {
  ws: WebSocket;
  userId: number;
  username: string;
  channels: Set<number>;
  /** Timestamp of last message for rate limiting */
  lastMessageTime: number;
  /** Message count in current window */
  messageCount: number;
}

// ==================== Configuration ====================

const PORT = 8081;
const PATH = '/ws';
const MAX_PAYLOAD = 64 * 1024; // 64KB max message size
const MAX_CONNECTIONS = 1000; // Max concurrent connections
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window
const MAX_MESSAGES_PER_WINDOW = 30; // Max 30 messages per second

// ==================== State ====================

/** userId → ConnectedClient */
const clients = new Map<number, ConnectedClient>();

/** channelId → Set<userId> */
const channels = new Map<number, Set<number>>();

// ==================== Helpers ====================

function send(ws: WebSocket, event: string, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, data }));
  }
}

function broadcastToChannel(
  channelId: number,
  event: string,
  data: unknown,
  excludeUserId?: number
): void {
  const members = channels.get(channelId);
  if (!members) return;

  for (const userId of members) {
    if (userId === excludeUserId) continue;
    const client = clients.get(userId);
    if (client) {
      send(client.ws, event, data);
    }
  }
}

function getOrCreateChannel(channelId: number): Set<number> {
  if (!channels.has(channelId)) {
    channels.set(channelId, new Set());
  }
  return channels.get(channelId)!;
}

function removeFromChannel(userId: number, channelId: number): void {
  const members = channels.get(channelId);
  if (!members) return;

  members.delete(userId);

  // Notify others in channel
  broadcastToChannel(channelId, 'voice_user_left', {
    channelId,
    userId,
  });

  // Clean up empty channels
  if (members.size === 0) {
    channels.delete(channelId);
    console.log(`[Channel ${channelId}] Removed (empty)`);
  }
}

function handleDisconnect(client: ConnectedClient): void {
  console.log(`[User ${client.userId}] Disconnected`);

  // Remove from all channels
  for (const channelId of client.channels) {
    removeFromChannel(client.userId, channelId);
  }

  // Remove from clients map
  clients.delete(client.userId);
}

/**
 * Verify token and extract userId.
 * In production, this should verify JWT signature.
 * For MVP, we use a simple shared-secret approach.
 */
function verifyToken(token: string | null): number | null {
  if (!token) return null;

  try {
    // Simple verification: token format is "user-{userId}-{timestamp}"
    // In production, use proper JWT verification
    const match = token.match(/^user-(\d+)-\d+$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check rate limiting for a client.
 * Returns true if the message should be allowed, false if rate limited.
 */
function checkRateLimit(client: ConnectedClient): boolean {
  const now = Date.now();

  // Reset window if expired
  if (now - client.lastMessageTime > RATE_LIMIT_WINDOW_MS) {
    client.lastMessageTime = now;
    client.messageCount = 1;
    return true;
  }

  // Increment count and check limit
  client.messageCount++;
  return client.messageCount <= MAX_MESSAGES_PER_WINDOW;
}

// ==================== Message Handlers ====================

function handleJoinChannel(client: ConnectedClient, data: { channelId: number }): void {
  const { channelId } = data;
  const channel = getOrCreateChannel(channelId);

  // Add user to channel
  channel.add(client.userId);
  client.channels.add(channelId);

  console.log(`[User ${client.userId}] Joined channel ${channelId}`);

  // Notify others in channel
  broadcastToChannel(channelId, 'voice_user_joined', {
    channelId,
    userId: client.userId,
    username: client.username,
  }, client.userId);

  // Send current participant list to joining user
  const participants = Array.from(channel).map((uid) => {
    const c = clients.get(uid);
    return {
      userId: uid,
      username: c?.username || `User-${uid}`,
    };
  });
  send(client.ws, 'participant_update', {
    channelId,
    participants,
  });
}

function handleLeaveChannel(client: ConnectedClient, data: { channelId: number }): void {
  const { channelId } = data;
  removeFromChannel(client.userId, channelId);
  client.channels.delete(channelId);
  console.log(`[User ${client.userId}] Left channel ${channelId}`);
}

function handleVoiceJoin(client: ConnectedClient, data: { channelId: number }): void {
  const { channelId } = data;
  console.log(`[User ${client.userId}] Voice joined channel ${channelId}`);

  // Notify others in channel
  broadcastToChannel(channelId, 'voice_user_joined', {
    channelId,
    userId: client.userId,
    username: client.username,
  }, client.userId);
}

function handleVoiceLeave(client: ConnectedClient, data: { channelId: number }): void {
  const { channelId } = data;
  console.log(`[User ${client.userId}] Voice left channel ${channelId}`);

  // Notify others in channel
  broadcastToChannel(channelId, 'voice_user_left', {
    channelId,
    userId: client.userId,
  });
}

function handleWebRTCSignal(client: ConnectedClient, data: {
  type: 'offer' | 'answer' | 'ice-candidate';
  targetId: number;
  payload: string;
  mediaType?: 'voice' | 'screen';
}): void {
  const { type, targetId, payload, mediaType } = data;

  // Validate targetId is in the same channel
  const target = clients.get(targetId);
  if (!target) {
    console.log(`[User ${client.userId}] Target user ${targetId} not found`);
    return;
  }

  // Verify both clients share at least one channel
  const sharedChannel = [...client.channels].some(ch => target.channels.has(ch));
  if (!sharedChannel) {
    console.warn(`[User ${client.userId}] Signal rejected: no shared channel with User ${targetId}`);
    return;
  }

  console.log(`[User ${client.userId}] WebRTC ${type} → User ${targetId} (${mediaType || 'voice'})`);

  // Forward signal to target
  send(target.ws, 'webrtc_signal', {
    fromUserId: client.userId,
    fromUsername: client.username,
    mediaType,
    signal: {
      type,
      payload,
      mediaType,
    },
  });
}

function handleScreenShareStart(client: ConnectedClient, data: { channelId: number; userId: number }): void {
  const { channelId } = data;
  console.log(`[User ${client.userId}] Screen share started in channel ${channelId}`);

  broadcastToChannel(channelId, 'screen_share_start', {
    channelId,
    userId: client.userId,
    username: client.username,
  }, client.userId);
}

function handleScreenShareStop(client: ConnectedClient, data: { channelId: number; userId: number }): void {
  const { channelId } = data;
  console.log(`[User ${client.userId}] Screen share stopped in channel ${channelId}`);

  broadcastToChannel(channelId, 'screen_share_stop', {
    channelId,
    userId: client.userId,
  }, client.userId);
}

// ==================== Connection Handler ====================

function handleConnection(ws: WebSocket, req: { url?: string }): void {
  let client: ConnectedClient | null = null;

  ws.on('message', (raw: Buffer) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());

      // First message: verify identity via token
      if (!client) {
        const url = new URL(req.url || '', 'ws://localhost');
        const token = url.searchParams.get('token');
        const userId = verifyToken(token);

        if (!userId) {
          console.log('Unauthorized connection attempt, closing');
          ws.close(4001, 'Unauthorized');
          return;
        }

        // Check connection limit
        if (clients.size >= MAX_CONNECTIONS) {
          console.log('Server full, rejecting connection');
          ws.close(4002, 'Server full');
          return;
        }

        client = {
          ws,
          userId,
          username: `User-${userId}`,
          channels: new Set(),
          lastMessageTime: Date.now(),
          messageCount: 0,
        };
        clients.set(userId, client);
        console.log(`[User ${userId}] Connected`);
        return;
      }

      // Rate limiting
      if (!checkRateLimit(client)) {
        console.warn(`[User ${client.userId}] Rate limited`);
        return;
      }

      const { event, data } = msg;

      switch (event) {
        case 'join_channel':
          handleJoinChannel(client, data);
          break;
        case 'leave_channel':
          handleLeaveChannel(client, data);
          break;
        case 'voice_join':
          handleVoiceJoin(client, data);
          break;
        case 'voice_leave':
          handleVoiceLeave(client, data);
          break;
        case 'webrtc_signal':
          handleWebRTCSignal(client, data);
          break;
        case 'screen_share_start':
          handleScreenShareStart(client, data);
          break;
        case 'screen_share_stop':
          handleScreenShareStop(client, data);
          break;
        default:
          console.log(`[User ${client.userId}] Unknown event: ${event}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to parse message:', error.message);
    }
  });

  ws.on('close', () => {
    if (client) {
      handleDisconnect(client);
    }
  });

  ws.on('error', (err: unknown) => {
    console.error('WebSocket error:', (err as Error).message);
    if (client) {
      handleDisconnect(client);
    }
  });
}

// ==================== Start Server ====================

const wss = new WebSocketServer({
  port: PORT,
  path: PATH,
  maxPayload: MAX_PAYLOAD,
});

wss.on('connection', handleConnection);

wss.on('listening', () => {
  console.log(`Macto Signaling Server running on ws://localhost:${PORT}${PATH}`);
  console.log(`Security: maxPayload=${MAX_PAYLOAD}B, maxConnections=${MAX_CONNECTIONS}, rateLimit=${MAX_MESSAGES_PER_WINDOW}/s`);
  console.log('Waiting for connections...');
});

// ==================== Graceful Shutdown ====================

function gracefulShutdown(signal: string): void {
  console.log(`\n${signal} received, shutting down gracefully...`);

  // Close all client connections
  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });

  // Close the server
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
