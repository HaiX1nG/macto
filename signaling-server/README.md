# Macto Signaling Server

Minimal WebRTC signaling server for Macto Electron app.

## Quick Start

```bash
npm install
npm run build
npm start
```

Server runs on `ws://localhost:8081/ws`.

## Protocol

All messages follow `{ event: string, data: any }` format.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_channel` | `{ channelId: number }` | Subscribe to channel events |
| `leave_channel` | `{ channelId: number }` | Unsubscribe from channel |
| `voice_join` | `{ channelId: number }` | Join voice channel |
| `voice_leave` | `{ channelId: number }` | Leave voice channel |
| `webrtc_signal` | `{ type, targetId, payload, mediaType? }` | WebRTC signaling |
| `screen_share_start` | `{ channelId, userId }` | Start screen sharing |
| `screen_share_stop` | `{ channelId, userId }` | Stop screen sharing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `webrtc_signal` | `{ fromUserId, fromUsername, mediaType, signal }` | Forwarded WebRTC signal |
| `voice_user_joined` | `{ channelId, userId, username }` | User joined voice |
| `voice_user_left` | `{ channelId, userId }` | User left voice |
| `participant_update` | `{ channelId, participants }` | Full participant list |
| `screen_share_start` | `{ channelId, userId, username }` | Screen share started |
| `screen_share_stop` | `{ channelId, userId }` | Screen share stopped |

## Architecture

- **Mesh topology**: P2P between clients, server only relays signaling
- **No database**: In-memory room management
- **No auth**: Token is accepted but not validated
- **No TURN/STUN**: Clients use their own ICE servers
