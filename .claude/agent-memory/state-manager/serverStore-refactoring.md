---
name: serverStore refactoring
description: Phase 4 KOOK redesign - serverStore fully rewritten, roomStore is now a shim
metadata:
  type: project
---

serverStore has been fully rewritten in phase 4 of the KOOK redesign (2026-08-08).

The old roomStore/serverStore compatibility shim pattern is replaced. serverStore now has full Server/Member/Role CRUD with permission checking. roomStore.ts is a 1-line re-export shim: `export { useServerStore as useRoomStore } from './serverStore'`.

**Why:** KOOK redesign replaces flat room model with server->channel hierarchy. Old serverStore referenced deleted types (`@shared/types/kook`, `@shared/types/api` RoomInfoResponse).

**How to apply:** Import from `@renderer/stores/serverStore` directly. The `hasPermission(perm: bigint)` method checks current user's merged role permissions against the bitmask. Owner always has all permissions. See [[store-service-integration]] for full store architecture.
