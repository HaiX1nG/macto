# Changelog

All notable changes to the Macto project will be documented in this file.

## [0.1.0] - 2026-09-08

### Added
- Real-time voice chat (WebRTC)
- Screen sharing (desktopCapturer + WebRTC)
- Session management (create/join/leave rooms)
- Connection state machine (6 states, 7 failure codes)
- Auto-reconnect with exponential backoff
- Bandwidth adaptation (4-level quality ladder)
- System tray with multi-platform support
- Desktop notifications
- Auto-update (electron-updater)
- Hardware acceleration toggle
- Minimal signaling server (Node.js + ws)
- Connection state UI indicator
- 49 unit and integration tests

### Security
- Token-based identity verification on signaling server
- Rate limiting (30 msg/s)
- Connection limits (1000 max)
- Channel-validated WebRTC signaling
