/**
 * @deprecated roomStore has been merged into serverStore.
 * This file re-exports from serverStore for backward compatibility.
 * Import from '@renderer/stores/serverStore' directly in new code.
 */
export { useServerStore as useRoomStore, type ServerState as RoomState } from './serverStore'
