# Store 重构工作说明

## 背景
Macto 项目目前有 10+ 个分散的 Zustand Store，需要重构为 4 个 Domain Store 加 1 个 eventBus。

## 当前 Store 列表
- authStore.ts - 用户认证
- serverStore.ts - roomStore 的别名
- roomStore.ts - 房间管理
- voiceStore.ts - 语音功能
- chatStore.ts - 聊天功能
- mediaStore.ts - 屏幕共享/WebRTC
- themeStore.ts - 主题
- settingsStore.ts - 设置
- layoutStore.ts - 布局
- websocketStore.ts - WebSocket
- playlistStore.ts - 播放列表

## 目标架构
- userDomainStore.ts (auth + server)
- roomDomainStore.ts (room + voice)
- contentDomainStore.ts (chat + media)
- settingsStore.ts (保留，合并 theme)
- layoutStore.ts (保留)
- websocketStore.ts (保留)
- playlistStore.ts (保留)
- eventBus.ts (新增)
- selectors.ts (新增)

## 文件依赖关系

### authStore.ts 被引用处:
- src/renderer/components/auth/LoginPage.tsx
- src/renderer/components/chat/ChatView.tsx
- src/renderer/components/chat/MessageList.tsx
- src/renderer/components/layout/HomeView.tsx
- src/renderer/components/layout/MainLayout.tsx
- src/renderer/components/layout/ServerSidebar.tsx
- src/renderer/components/layout/UserPanel.tsx
- src/renderer/components/members/MemberList.tsx
- src/renderer/hooks/useAudioShare.ts
- src/renderer/hooks/useRoomWebSocket.ts
- src/renderer/hooks/useScreenShare.ts
- src/renderer/hooks/useUserStatusPolling.ts
- src/renderer/hooks/useWebSocket.ts

### roomStore.ts / serverStore.ts 被引用处:
- src/renderer/components/chat/ChatView.tsx (serverStore)
- src/renderer/components/chat/SearchMessages.tsx (roomStore)
- src/renderer/components/layout/ChannelSidebar.tsx (serverStore)
- src/renderer/components/layout/HomeView.tsx (roomStore)
- src/renderer/components/layout/MainLayout.tsx (serverStore)
- src/renderer/components/layout/ServerSidebar.tsx (serverStore)
- src/renderer/components/layout/UserPanel.tsx (serverStore)
- src/renderer/components/members/MemberList.tsx (serverStore)
- src/renderer/hooks/useAudioShare.ts (serverStore)
- src/renderer/hooks/useRoomWebSocket.ts (serverStore)
- src/renderer/hooks/useScreenShare.ts (serverStore)
- src/renderer/hooks/useSession.tsx (roomStore)

### voiceStore.ts 被引用处:
- src/renderer/hooks/useRoomWebSocket.ts

### chatStore.ts 被引用处:
- src/renderer/hooks/useRoomWebSocket.ts

### mediaStore.ts 被引用处:
- src/renderer/components/screen/RemoteScreensContainer.tsx
- src/renderer/hooks/useScreen.tsx
- src/renderer/hooks/useScreenShare.ts
- src/renderer/hooks/useAudioShare.ts

### themeStore.ts 被引用处:
- src/renderer/components/layout/MainLayout.tsx
- src/renderer/components/layout/SettingsModal.tsx
- src/renderer/components/layout/SettingsView.tsx
- src/renderer/hooks/useTheme.tsx
- src/renderer/hooks/__tests__/useThemeStore.test.tsx

## 向后兼容性策略
1. 在新文件中创建合并后的 domain stores
2. 在旧 store 文件中添加 `@deprecated` 注释并重新导出新 store（别名）
3. 所有组件可以继续使用旧 import，但会被标记为 deprecated
4. 新代码使用新的 domain store import

## 关键设计决策
1. 不要删除旧 store 文件，而是添加向后兼容的重新导出
2. roomDomainStore 中需要同时管理 room 和 voice 的 participants
3. contentDomainStore 中不存储 MediaStream/RTCPeerConnection，使用 connection ID
4. settingsStore 添加 theme 字段，themeStore 重新导出 settingsStore
5. eventBus 使用简单的发布/订阅模式
6. selectors 基于新的 domain stores 创建
