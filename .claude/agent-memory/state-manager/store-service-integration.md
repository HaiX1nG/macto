---
name: store-service-integration
description: How the 3 mock stores (authStore, serverStore/roomStore, chatStore) were wired to backend API services in Aug 2026
metadata:
  type: project
---

3 mock stores were connected to real backend services on 2026-08-08.

**authStore**: Now calls authService for login/register/logout/fetchUserInfo/setCustomStatus/updateProfile/changePassword. Added `initAuth()` method that checks apiClient.isAuthenticated() (reads localStorage tokens) and calls fetchUserInfo on app startup. Register uses a two-step flow: attempt authService.register (backend returns no token), then auto-login via authService.login to get tokens. User.id (string) is converted from backend userId (number) via String(). initAuth is called in App.tsx's AppContent useEffect.

**serverStore (useRoomStore)**: fetchRooms/createRoom/deleteRoom/joinRoom/leaveRoom/fetchParticipants now call roomService methods. Pure state methods (setCurrentRoom, addParticipant, etc.) unchanged. Backward compat shim `useServerStore` alias preserved.

**chatStore**: fetchMessages/sendMessage/editMessage/deleteMessageAsync/retryMessage now call chatService. Uses optimistic update pattern for sendMessage (temp id with 'sending' status, replaced on success, marked 'failed' on error). mapToMessageWithStatus helper converts MessageResponse to store format. pinMessage/unpinMessage remain local-only (no backend pin API).

**Why:** Backend was already running and API-verified on localhost:8081; stores had TODO mock implementations that needed real service integration.

**How to apply:** When touching these stores, remember they now depend on services (authService, roomService, chatService) and apiClient. Error handling pattern: catch in store, set error state, then throw to let UI handle.
