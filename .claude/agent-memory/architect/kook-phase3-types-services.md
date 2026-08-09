---
name: kook-redesign-phase3-types-services
description: KOOK redesign phase 3 - types+services rebuild complete, stores/hooks/pages still have 77 tsc errors pending phase 4-5
metadata:
  type: project
---

KOOK redesign phase 3 completed on 2026-08-08: rebuilt `src/shared/types/` and `src/renderer/services/` for the server-channel architecture.

**Why:** Backend phases 1+2 finished KOOK化 (server/channel/permission/message + WS channel dimension). Frontend types+services were still on the old room-based system and needed to align with the new backend API.

**How to apply:** Phase 4 will rewrite stores (11->7) and phase 5 will rebuild UI. The 77 remaining tsc errors are all in stores/hooks/components/pages that still import deleted modules (`@shared/types/kook`, `@shared/types/participant`, `roomService`, `chatService`, `screenShareService`) and old type names (`RoomInfoResponse`, `MessageResponse`, `ParticipantResponse`, etc.). These are expected and will be resolved in phases 4-5. Do NOT try to fix them with ts-expect-error -- a full rewrite is planned.

Key files created: common.ts, auth.ts, permission.ts, server.ts, channel.ts, message.ts, voice.ts, playlist.ts, friend.ts (types); serverService.ts, channelService.ts, messageService.ts, friendService.ts (services). Deleted: kook.ts, participant.ts (types); roomService.ts, chatService.ts, screenShareService.ts (services). api.ts kept as legacy re-export shim. websocket.ts fully rewritten with new event protocol.
