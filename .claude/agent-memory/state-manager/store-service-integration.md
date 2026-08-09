---
name: store-service-integration
description: Phase 4 store reorganization 11->7 stores with KOOK-style architecture (Aug 2026)
metadata:
  type: project
---

Phase 4 of the KOOK redesign reorganized 11 stores into 7 on 2026-08-08.

**7 target stores:**
1. **authStore** - User.id now `number` (was string). Uses `@shared/types/auth` types. login/fetchUserInfo map to User interface with id/username/email/avatarUrl/bannerUrl/bio/customStatus/status/createdAt.
2. **serverStore** (rewritten) - Full server CRUD + members + roles + permission check (`hasPermission(bigint)`). Backward compat: `useRoomStore` alias and `RoomState` type re-exported. `roomStore.ts` is now a 1-line shim re-exporting from serverStore.
3. **channelStore** (new) - Channel tree + current channel + playlist (merged from playlistStore). Uses channelService + playlistService.
4. **chatStore** (rewritten) - Multi-channel message cache `Map<channelId, MessageWithStatus[]>`. WS event handlers: onMessageReceived/onMessageDeleted/onMessageUpdated/onReactionAdded/onReactionRemoved/setTyping. MessageWithStatus extends ChannelMessage with `status: 'sent'|'sending'|'failed'` and `_retryId`.
5. **voiceStore** (slimmed) - Only voice state: currentVoiceChannelId/participants/isMuted/isDeafened/isSpeaking/isInVoice. WebRTC + audio devices moved to mediaStore. `useAudioStore` alias preserved.
6. **mediaStore** (expanded) - Unified WebRTC: screen share (existing) + voice peer management + audio devices (from voiceStore). WebRTCManager at module level. setMute lazily imports voiceStore to sync isMuted.
7. **uiStore** (new) - Merged layoutStore + themeStore + settingsStore + websocketStore. Exports BREAKPOINTS/SIDEBAR_WIDTHS/HEADER_HEIGHT/AppTheme. Persists theme + settings + layout prefs. DEFAULT_VIEW is 'server-home'. Backward compat aliases: useLayoutStore/useSettingsStore/useThemeStore/useWebSocketStore.

**Deleted:** eventBus.ts (no longer imported by any store). roomStore.ts reduced to shim. layoutStore/themeStore/settingsStore/websocketStore/playlistStore all reduced to re-export shims.

**Why:** KOOK redesign changes flat "room" model to server->channel two-level hierarchy. Old stores referenced deleted `@shared/types/kook` and `@shared/types/api` types.

**How to apply:** Stores directory has 0 tsc errors. Hooks/components/pages have ~256 errors (phase 5 scope). Store tests all pass (64/64). When touching stores, use new domain types from `@shared/types/{server,channel,message,voice,playlist,auth,permission}`.
