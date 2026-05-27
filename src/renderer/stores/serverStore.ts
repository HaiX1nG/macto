export { useRoomStore, useRoomStore as useServerStore } from './roomStore'
import type { Server, Channel, ServerMember } from '@shared/types/kook'
import type { RoomInfoResponse } from '@shared/types/api'
import type { useRoomStore } from './roomStore'

export type ServerState = ReturnType<typeof useRoomStore.getState>

function roomToServer(room: RoomInfoResponse): Server {
  return {
    id: String(room.id),
    name: room.roomName,
    icon: undefined,
    banner: undefined,
    description: undefined,
    ownerId: String(room.hostUserId),
    channels: [
      { id: String(room.id), serverId: String(room.id), name: '聊天室', type: 'text' as const, position: 0, topic: '' },
      { id: `${room.id}-voice`, serverId: String(room.id), name: '语音室', type: 'voice' as const, position: 1 },
    ],
    roles: [],
    memberCount: room.participantCount,
    createdAt: new Date(room.createdAt).getTime(),
  }
}

export function getServerFromRoom(room: RoomInfoResponse): Server {
  return roomToServer(room)
}

export function getServersFromRooms(rooms: RoomInfoResponse[]): Server[] {
  return rooms.map(roomToServer)
}

export function getChannelFromRoom(roomId: string): Channel[] {
  return [
    { id: roomId, serverId: roomId, name: '聊天室', type: 'text' as const, position: 0, topic: '' },
    { id: `${roomId}-voice`, serverId: roomId, name: '语音室', type: 'voice' as const, position: 1 },
  ]
}

export type { Server, Channel, ServerMember }