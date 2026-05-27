---
name: serverStore refactoring
description: serverStore was refactored to be a compatibility shim over roomStore
type: project
---

serverStore and roomStore have been unified. The serverStore is now a thin compatibility layer that exports useRoomStore.

**Why:** Server and Channel were UI concepts that directly mapped to Room - there was no separate "server" entity in the backend API. Having two stores managing similar data caused confusion and maintenance overhead.

**How to apply:** Import from `@renderer/stores/serverStore` for backward compatibility. It exports useRoomStore and useServerStore (alias). Server/Channel types are still available for UI components. Use getChannelFromRoom(roomId) and getServersFromRooms(rooms) for conversions. currentServerId in components is actually currentRoomId.