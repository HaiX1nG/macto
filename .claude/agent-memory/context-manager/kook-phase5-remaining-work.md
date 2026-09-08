---
name: kook-redesign-phase5-remaining-work
description: Phase 5/6 KOOK redesign - 61 tsc errors across 8 files, 4 categories of remaining work
metadata:
  type: project
---

## Phase 5/6 KOOK Redesign — Remaining Work (2026-08-09)

Phase 4 (store reorganization 11→7) is committed. The working tree has 32 modified files + 2 untracked (FriendsPage.tsx, kook-phase3-types-services.md). **61 tsc errors remain**, down from the ~256 reported after phase 3.

### Category A: Deleted type imports (7 errors)
Files still importing types from deleted modules:
- `@shared/types/participant` → ScreenSharePage.tsx, ScreenView.tsx, SubcategoryList.tsx, VoiceView.tsx (4 errors)
- `@shared/types/kook` → VoicePage.tsx (1 error)
- `@shared/types/api` → VoicePage.tsx (`VoiceSessionResponse`), PlaylistItem.tsx (`PlaylistItemResponse`), HomeView.tsx (`RoomInfoResponse`) (3 errors)

**Fix:** Replace with correct types from `@shared/types/{server,channel,voice,playlist}`.

### Category B: Store API mismatches (18 errors)
Components using old store property/action names that no longer exist:
- **serverStore**: `rooms`/`currentRoomId`/`currentChannelId`/`fetchRooms`/`getChannelFromRoom` → VoicePage.tsx, HomeView.tsx (5 errors)
- **voiceStore**: `devices`/`inputDeviceId`/`outputDeviceId`/`volume`/`isCapturing`/`startCapture`/`stopCapture`/`setInputDevice`/`setOutputDevice`/`setVolume` → SettingsAudio.tsx, VoicePage.tsx (10 errors)
- **channelStore**: `addItem`/`removeItem`/`currentItemId`/`isPlaying`/`play`/`pause`/`skip` → AddPlaylistItemModal.tsx, PlaylistItem.tsx, PlaylistPanel.tsx (7 errors)

**Fix:** Route to correct store: voice device/capture → mediaStore; playlist → channelStore (check actual API); server room → serverStore (use `servers`/`currentServerId`/`currentChannelId`).

### Category C: Missing component references (6 errors)
Components referencing deleted/renamed sub-components:
- `ScreenPreview` → ScreenShareView.tsx, ViewerGrid.tsx (3 errors)
- `ViewerGrid` → ScreenShareView.tsx (1 error)
- `ScreenControls` → ScreenShareView.tsx (1 error)
- `VoiceParticipantList`/`AudioWaveform`/`VoiceControls` → VoiceSessionView.tsx (3 errors)

**Fix:** Either re-create these sub-components or inline their content.

### Category D: Type field mismatches (5 errors)
- `User.avatar` → SettingsProfile.tsx (3 errors: property access + 2 object literals). `User` type uses `avatarUrl`, not `avatar`.
- `VoiceSessionResponse` → VoicePage.tsx (1 error: type doesn't exist; use `VoiceParticipant` from `@shared/types/voice`)
- `Channel` from `@shared/types/kook` → VoicePage.tsx (1 error: use `Channel` from `@shared/types/channel`)

### Category E: Unused imports (6 errors)
- ServerSidebar.tsx: `Spin`, `Button`, `LoadingOutlined`, `UserOutlined` (4)
- MemberList.tsx: `AudioMutedOutlined`, `kickMember` (2)

### Category F: Other (5 errors)
- `getChannelFromRoom` not exported from serverStore → VoicePage.tsx (1)
- `(roomId?) => void` not assignable to `MouseEventHandler` → VoiceSettings.tsx (1)
- `string` vs `number | undefined` comparison → VoicePage.tsx (1)
- Implicit `any` parameters → HomeView.tsx (2)

### Phase 5b: FriendsPage
`FriendsPage.tsx` exists as a placeholder (untracked). View registry already registers it. No tsc errors on it. Needs full UI implementation.

### Phase 6: What remains
No explicit phase 6 definition exists in code or memory. Likely scope: E2E testing, polish, edge cases, production readiness.

**Why:** Phase 4 committed stores but the working tree has 32 modified files that were being edited when the session quota hit. These are the "8 half-finished files, 170 errors" mentioned in user memory.

**How to apply:** Phase 5 should fix all 61 tsc errors in this order: A (type imports) → D (field names) → B (store API) → C (missing components) → E (cleanup) → F (misc). Then commit. Phase 5b = FriendsPage UI. Phase 6 scope needs user clarification.