---
name: mute-single-source
description: Mute state unified into mediaStore; voiceStore.setMute is a delegating alias. Removed mediaStore->voiceStore dynamic import.
metadata:
  type: project
---

Mute state (`isMuted`/`setMute`) now lives ONLY in `mediaStore` (single source of truth). `voiceStore` no longer holds `isMuted`; its `setMute` action delegates to `useMediaStore.getState().setMute(muted)`.

**Why:** mediaStore is the audio truth source (holds `voiceStream`, applies `track.enabled`). The old `mediaStore.setMute` used a dynamic `import('./voiceStore')` to sync UI mute, which Vite flagged because voiceStore was also statically imported by 6 files, locking it into the first screen chunk.

**How to apply:**
- `mediaStore.setMute(muted)` toggles `voiceStream` audio tracks AND sets `isMuted` in mediaStore.
- `voiceStore.setMute` is a legacy alias delegating to mediaStore — keep it for old call sites.
- `useAudio.tsx` AudioProvider shim now reads mute from mediaStore only (no longer merges two stores).
- Components reading mute: MainLayout, UserPanel, SettingsAudio, VoicePage all read from `useMediaStore` now.
- `voiceStore` still owns: participants, isDeafened, isSpeaking, isInVoice, currentVoiceChannelId, error, and WS handlers.
- `useAudioStore` alias still exported from voiceStore.
- Related: [[store-service-integration]]