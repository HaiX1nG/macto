---
name: Architecture Design v2.0
description: Comprehensive architecture redesign document for Macto covering frontend, Electron, WebRTC, build, testing, and extensibility
 type: project
---

Macto architecture was redesigned to address 11+ scattered Zustand stores, monolithic IPCManager, and scattered WebRTC logic.

Key decisions:
1. Consolidate 11+ stores into 4 domain-centric stores + 1 UI store with EventBus coordination
2. Refactor monolithic IPCManager into modular IPC handlers with registry pattern
3. Create dedicated WebRTCManager abstraction with connection pooling
4. Implement plugin system, i18n, and theme customization for future extensibility

**Why:** Current architecture has implicit store dependencies (e.g., useRoomWebSocket depends on 5 stores), deprecated stores still in use, and no clear module boundaries. This leads to maintenance issues and performance problems.

**How to apply:**
- Phase 1: Consolidate stores and implement EventBus integration
- Phase 2: Refactor IPC handlers and WebRTC architecture
- Phase 3: Performance optimization and code splitting
- Phase 4: Plugin system and extensibility features

Full design document: `ARCHITECTURE_DESIGN_v2.md`
