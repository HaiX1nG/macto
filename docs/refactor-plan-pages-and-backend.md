# 页面结构重塑与后端对齐方案

> 文档类型：修改计划（面向用户）  
> 日期：2026-08-06  
> 状态：待确认  
> 配套文档：`docs/page-structure-spec.md`（给 ui-builder 的可执行实现规范）  
> 已有文档：`.claude/agent-memory/architect/ARCHITECTURE_DESIGN_v2.md`、`.claude/agent-memory/state-manager/store-refactor-plan.md`、`docs/joint-decision-glassmorphism.md`

---

## 1. 背景与现状

### 1.1 项目定位

Macto 是一个基于 Electron + React 19 + TypeScript + Zustand + Ant Design + Tailwind 的跨平台实时语音和屏幕共享桌面应用。用户已有独立的 Go 后端仓库（本仓库无 Go 代码，`.env` 指向 `http://localhost:8080`）。

### 1.2 当前导航架构

```
App.tsx
  └── isAuthenticated ? <MainLayout/> : <LoginPage/>

MainLayout.tsx（4 列 CSS Grid）
  ├── 第1列: ServerSidebar        ← 不动
  ├── 第2列: ChannelSidebar       ← 不动
  ├── 第3列: RemoteScreensContainer + ChatView  ← 硬编码，需替换
  └── 第4列: MemberList           ← 不动
```

第3列当前硬编码渲染 `<RemoteScreensContainer />` 和 `<ChatView />`。`ChatView` 内部根据 `channel.type` 分支：文字频道渲染聊天界面，语音频道渲染 `VoiceChannelView`。导航完全由 `roomStore` 的 `currentChannelId` 状态驱动，无路由库。

### 1.3 页面/视图组件三处重叠

当前页面级组件散落在三处，职责重叠：

| 位置 | 组件 | 问题 |
|------|------|------|
| `components/pages/` | ScreenSharePage、VoiceSessionPage | 纯 props 驱动展示组件，未连接 store，无法独立使用 |
| `components/layout/*View` | HomeView、ChannelView、VoiceView、ScreenView、SettingsView | 均含 `h-screen` + 自带侧边栏，与 4 列 Grid 不兼容，实际未被 MainLayout 使用 |
| `features/` | session/、voice/、screen/、settings/ | 较小的功能块，职责清晰但与上述 View 组件存在功能重叠 |

### 1.4 核心问题

1. 第3列硬编码 ChatView，无法根据上下文切换不同页面
2. 三处视图组件职责重叠，维护者无法确定"哪个是正式的"
3. ChatView 内嵌 VoiceChannelView，违反单一职责
4. 无统一的视图注册和懒加载机制
5. 各 `*View` 组件自建全屏布局（含侧边栏），与 MainLayout 的 4 列 Grid 冲突

---

## 2. 目标结构

### 2.1 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 导航方式 | 保留状态驱动，不引入 react-router | 与现有 4 列 Grid 兼容，避免引入路由复杂度 |
| 页面统一位置 | `src/renderer/pages/` | 消除三处散落，建立单一权威目录 |
| 视图注册机制 | ViewRegistry（Map + React.lazy） | 类型安全、代码分割、可扩展 |
| 活动视图状态 | 扩展 layoutStore（不新建 uiStateStore） | 见第 6 节详述 |

### 2.2 pages/ 目录树

```
src/renderer/pages/
├── index.ts                  # 桶导出
├── NavigationShell.tsx       # 导航壳：按 activeViewId 渲染页面
├── HomePage.tsx               # 首页/空状态
├── ChannelPage.tsx            # 文字频道聊天页（包裹 ChatView）
├── VoicePage.tsx              # 语音频道会话页（从 ChatView 提取）
├── ScreenSharePage.tsx        # 屏幕分享页（容器，store 连接）
└── SettingsPage.tsx           # 设置页（包裹 SettingsView）
```

### 2.3 视图注册表

**位置**：`src/renderer/config/viewRegistry.ts`

**核心类型**（定义在 `src/shared/types/view.ts`）：

```typescript
export type ViewId = 'home' | 'channel' | 'voice' | 'screen' | 'settings'

export interface ViewParams {
  readonly roomId?: string
  readonly channelId?: string
  readonly sessionId?: string
}
```

**注册表 API**：

```typescript
// 页面组件 Props 契约
export interface ViewPageProps {
  readonly params: ViewParams
}

// 注册表条目
export interface ViewEntry {
  readonly id: ViewId
  readonly title: string
  readonly component: LazyExoticComponent<ComponentType<ViewPageProps>>
}

// 查询 API
export function getView(id: ViewId): ViewEntry | undefined
export function getAllViews(): readonly ViewEntry[]
export function registerView(entry: ViewEntry): void
```

**懒加载机制**：每个页面通过 `React.lazy(() => import('@renderer/pages/XxxPage'))` 懒加载，实现代码分割。每个页面文件必须导出 `default`。

**与 MainLayout 对接**：MainLayout 第3列从 `<RemoteScreensContainer /> + <ChatView />` 替换为 `<NavigationShell />`。NavigationShell 内部处理远程屏幕浮层 + 活动视图渲染。

### 2.4 ViewId 路由逻辑

| 触发条件 | activeViewId | activeViewParams | 执行者 |
|----------|-------------|------------------|--------|
| 无选中频道 | `home` | `{}` | MainLayout（loadRooms 前默认值） |
| 点击文字频道 | `channel` | `{ channelId }` | ChannelSidebar onClick |
| 点击语音频道 | `voice` | `{ channelId }` | ChannelSidebar onClick |
| 打开屏幕分享 | `screen` | `{}` | UI 触发（语音页内按钮等） |
| 打开设置 | `settings` | `{}` | UI 触发（UserPanel 齿轮等） |
| loadRooms 首次加载 | `channel` | `{ channelId }` | MainLayout loadRooms effect |

---

## 3. 导航壳设计

### 3.1 NavigationShell 契约

```
NavigationShell
├── 读取 layoutStore.activeViewId + activeViewParams
├── 调用 getView(activeViewId) 解析页面组件
├── 条件渲染 RemoteScreensContainer（mediaStore.remoteScreens.size > 0）
├── Suspense 包裹懒加载页面（fallback = 骨架屏）
└── AnimatePresence mode="wait" 过渡动画（opacity 淡入淡出）
```

### 3.2 渲染流程

```
┌─────────────────────────────────────┐
│ NavigationShell (h-full flex-col)   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ RemoteScreensContainer      │   │  ← 仅当有远程屏幕时渲染
│  │ (条件浮层)                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ <Suspense fallback=骨架>    │   │
│  │   <AnimatePresence>         │   │
│  │     <motion.div key=viewId> │   │
│  │       <PageComponent />     │   │  ← 懒加载的活动页面
│  │     </motion.div>            │   │
│  │   </AnimatePresence>        │   │
│  │ </Suspense>                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  (若 getView 返回 undefined)        │
│  → 渲染 <NoChannelSelected />       │
└─────────────────────────────────────┘
```

### 3.3 过渡动画

- 使用 `framer-motion` 的 `AnimatePresence mode="wait"`
- 以 `activeViewId` 为 `motion.div` 的 `key`
- 动画：`opacity: 0 -> 1`（淡入），`opacity: 1 -> 0`（淡出），duration 0.2s
- 遵循 `prefers-reduced-motion`（framer-motion 自动支持）
- 后续 GlassSurface 实现后可升级为更丰富的过渡

### 3.4 空状态与加载状态

| 状态 | 处理 |
|------|------|
| 页面懒加载中 | `<SkeletonMessageList count={6} />`（复用现有骨架屏） |
| getView 返回 undefined | `<NoChannelSelected />`（复用现有空状态组件） |
| 页面渲染错误 | 由 App 级 ErrorBoundary 捕获 |

### 3.5 4 列 Grid 兼容

```
不动：
  第1列 ServerSidebar
  第2列 ChannelSidebar
  第4列 MemberList

替换：
  第3列 <RemoteScreensContainer /> + <ChatView />
  → <NavigationShell />

Grid 模板不变：
  gridTemplateColumns: `${serverWidth} ${channelWidth} 1fr ${memberWidth}`
```

NavigationShell 填充第3列的 `1fr` 空间，使用 `h-full flex flex-col`，与现有 Grid 完全兼容。

---

## 4. 迁移映射表

### 4.1 components/pages/ → 新位置

| 组件 | 操作 | 新位置 | 说明 |
|------|------|--------|------|
| ScreenSharePage.tsx | 移动+重命名 | `components/screen/ScreenShareView.tsx` | 展示组件，被 pages/ScreenSharePage.tsx 容器包裹 |
| VoiceSessionPage.tsx | 移动+重命名 | `components/voice/VoiceSessionView.tsx` | 展示组件，备用 |
| (目录) | 删除 | - | 移动后删除 `components/pages/` 空目录 |

### 4.2 components/layout/*View → 新位置

| 组件 | 操作 | 新位置/处理 | 说明 |
|------|------|------------|------|
| HomeView.tsx | 合并 | `pages/HomePage.tsx` | 剥离自带侧边栏，保留统计卡片/快速操作逻辑，适配内容区 |
| ChannelView.tsx | 删除 | - | 功能被 ChannelPage + ChatView 覆盖；ChannelList/SubcategoryList 由 ChannelSidebar 承担 |
| VoiceView.tsx | 合并 | `pages/VoicePage.tsx` | 剥离自带侧边栏，保留参与者卡片/控制栏逻辑；与 ChatView 提取的 VoiceChannelView 合并 |
| ScreenView.tsx | 合并 | `pages/ScreenSharePage.tsx` | 剥离自带侧边栏，保留屏幕选择/参与者列表逻辑 |
| SettingsView.tsx | 合并 | `pages/SettingsPage.tsx` | 剥离自带侧边栏，保留设置分区逻辑；`h-screen` → `h-full` |
| SettingsModal.tsx | 保留原位 | 不变 | 作为模态弹窗使用，与 SettingsPage 互补 |
| EmptyState.tsx | 保留原位 | 不变 | 已在 `components/ui/EmptyState.tsx`，被 NavigationShell 复用 |
| ChannelControlPanel.tsx | 标记 deprecated | - | 被 ChannelSidebar 的 UserPanel 替代，后续清理 |
| ChannelList.tsx | 标记 deprecated | - | 被 ChannelSidebar 内联的频道列表替代 |
| SubcategoryList.tsx | 标记 deprecated | - | 被 ChannelSidebar 替代 |
| MainLayout.tsx | 修改 | 不变路径 | 第3列替换为 NavigationShell |
| ServerSidebar.tsx | 保留原位 | 不变 | 第1列 |
| ChannelSidebar.tsx | 修改 | 不变路径 | onClick 追加 setActiveView |
| Header.tsx | 标记 deprecated | - | 若未被引用，后续清理 |
| Content.tsx | 标记 deprecated | - | 若未被引用，后续清理 |
| Sidebar.tsx | 标记 deprecated | - | 若未被引用，后续清理 |
| UserPanel.tsx | 保留原位 | 不变 | 被 ChannelSidebar 使用 |

### 4.3 features/ → 处理

| 组件 | 操作 | 说明 |
|------|------|------|
| features/session/SessionList.tsx | 保留原位 | 被 CreateSessionModal/JoinSessionModal 使用 |
| features/session/CreateSessionModal.tsx | 保留原位 | 模态组件 |
| features/session/JoinSessionModal.tsx | 保留原位 | 模态组件 |
| features/voice/VoiceSettings.tsx | 保留原位 | 被设置页使用 |
| features/screen/ScreenControl.tsx | 保留原位 | 被屏幕分享页使用 |
| features/settings/SettingsGeneral.tsx | 保留原位 | 被设置页/模态使用 |
| features/settings/SettingsAudio.tsx | 保留原位 | 同上 |
| features/settings/SettingsProfile.tsx | 保留原位 | 同上 |
| features/settings/SettingsNotifications.tsx | 保留原位 | 同上 |
| features/settings/SettingsVideo.tsx | 保留原位 | 同上 |

### 4.4 components/chat/ → 处理

| 组件 | 操作 | 说明 |
|------|------|------|
| ChatView.tsx | 拆分 | 提取 VoiceChannelView → VoicePage；提取 HeaderBtn → ui/HeaderButton；提取 VoiceParticipant → voice/VoiceParticipantCard；修复 MessageResponse 导入 |
| MessageList.tsx | 保留原位 | ChatView 子组件 |
| MessageInput.tsx | 保留原位 | ChatView 子组件 |
| SearchMessages.tsx | 保留原位 | ChatView 子组件 |
| MentionAutocomplete.tsx | 保留原位 | MessageInput 子组件 |

### 4.5 新增文件汇总

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/shared/types/view.ts` | 类型 | ViewId、ViewParams |
| `src/renderer/config/viewRegistry.ts` | 配置 | 视图注册表 |
| `src/renderer/pages/index.ts` | 桶导出 | 页面统一导出 |
| `src/renderer/pages/NavigationShell.tsx` | 组件 | 导航壳 |
| `src/renderer/pages/HomePage.tsx` | 页面 | 首页 |
| `src/renderer/pages/ChannelPage.tsx` | 页面 | 文字频道页 |
| `src/renderer/pages/VoicePage.tsx` | 页面 | 语音频道页 |
| `src/renderer/pages/ScreenSharePage.tsx` | 页面 | 屏幕分享页（容器） |
| `src/renderer/pages/SettingsPage.tsx` | 页面 | 设置页 |
| `src/renderer/components/ui/HeaderButton.tsx` | 组件 | 从 ChatView 提取的通用按钮 |
| `src/renderer/components/voice/VoiceParticipantCard.tsx` | 组件 | 从 ChatView 提取的参与者卡片 |
| `src/renderer/components/screen/ScreenShareView.tsx` | 组件 | 从 pages/ 移动并重命名的展示组件 |
| `src/renderer/components/voice/VoiceSessionView.tsx` | 组件 | 从 pages/ 移动并重命名的展示组件 |

---

## 5. 功能完善清单

基于对现有组件实现的勘察，按域列出当前未完成/需补齐的功能点。

### 5.1 Auth（认证）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 登录页面 | 已完成 | `LoginPage.tsx` 功能完整 |
| 注册页面 | 已完成 | `RegisterPage.tsx`（新增，未跟踪） |
| 忘记密码 | 已完成 | `ForgotPassword.tsx`（新增，未跟踪） |
| Token 刷新拦截器 | **缺失** | apiClient 未实现 401 自动刷新 token 逻辑 |
| Token 持久化 | **缺失** | 登录后 token 仅在内存，刷新页面丢失（需 localStorage 或 Electron safeStorage） |
| 登出状态清理 | **缺失** | 登出时未清理所有 store 状态（需 eventBus `user:logout` 联动） |
| 自动登录 | **部分** | `useUserStatusPolling` 存在但未实现启动时 token 恢复 |

### 5.2 Chat（聊天）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 消息收发 | 已完成 | ChatView + chatStore 功能完整 |
| 消息回复 | 已完成 | replyingTo 机制正常 |
| 消息编辑/删除 | 已完成 | editMessage/deleteMessageAsync 正常 |
| 消息置顶 | 已完成 | pinMessage/unpinMessage 正常 |
| 消息搜索 | 已完成 | SearchMessages 组件正常 |
| 输入指示器 | 已完成 | typingUsers 机制正常 |
| 消息反应（表情） | **缺失** | `onAddReaction={() => {}}` 空实现 |
| 文件上传 | **部分** | MessageInput 支持附件但 uploadService 集成未验证 |
| MessageResponse 类型 | **Bug** | `handleSearchMessageClick` 参数使用 `MessageResponse` 但未导入 |
| Markdown 渲染 | **未验证** | MarkdownRenderer 组件存在但未确认是否集成到 MessageList |
| 消息分页加载 | **部分** | `handleLoadMore` 存在但分页逻辑硬编码 page=2 |

### 5.3 Voice（语音）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 加入/离开语音 | 已完成 | VoiceChannelView + voiceStore joinVoice/leaveVoice |
| 麦克风静音 | 已完成 | setMute 机制正常 |
| 音量控制 | 已完成 | volume 滑块正常 |
| 参与者列表 | 已完成 | 实时轮询参与者（5s 间隔） |
| 语音设置 | 已完成 | VoiceSettings 组件存在 |
| 音频波形 | 已完成 | AudioWaveform 组件存在 |
| 免提（Deafen） | **缺失** | `setIsDeafened` 仅切换本地状态，未实际禁用音频输出 |
| WebRTC 管理器 | **缺失** | 当前为简单 service 调用，ARCHITECTURE_DESIGN_v2 中规划的 WebRTCManager 未实现 |
| 语音活动检测 | **部分** | `isSpeaking`/`audioLevel` 从 store 读取，但实际音频分析连接未验证 |
| Push-to-Talk | **缺失** | 未实现按键说话 |
| 噪声门/音频处理 | **缺失** | 未实现噪声门阈值、自动增益控制 |

### 5.4 Screen（屏幕共享）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 远程屏幕显示 | 已完成 | RemoteScreensContainer + RemoteScreenView 正常 |
| 屏幕分享预览 | 已完成 | ScreenPreview 组件正常 |
| 查看模式切换 | 已完成 | ScreenSharePage 支持 fullscreen/pip/grid |
| 屏幕选择器 | 已完成 | ScreenSharePicker 组件存在 |
| 屏幕分享容器 | **缺失** | 当前 ScreenSharePage 为纯展示组件，未连接 mediaStore |
| 画质设置 | **部分** | SettingsView 中有画质选项，但未连接到实际 WebRTC 编码参数 |
| 远程控制 | **缺失** | 未实现远程桌面控制 |
| 系统音频捕获 | **缺失** | 未实现屏幕分享时捕获系统音频 |
| 多显示器选择 | **缺失** | 未实现多显示器环境下的显示器选择 |

### 5.5 Settings（设置）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 外观/主题切换 | 已完成 | 三套主题（sakura/ancient/tech）可切换 |
| 音频设置 | 已完成 | 输入/输出设备、音量、噪声抑制、回声消除 |
| 视频设置 | 已完成 | 摄像头、画质、分辨率、帧率 |
| 通知设置 | **部分** | UI 存在但通知开关回调为空（`onChange={() => {}}`） |
| 快捷键设置 | 已完成 | ShortcutsSettings 组件存在 |
| 设置持久化 | **缺失** | 设置仅存内存，未持久化到后端或 localStorage |
| 设置验证 | **缺失** | 无输入验证逻辑 |
| 快捷键自定义 | **未验证** | ShortcutsSettings 可能只读 |

### 5.6 Session（会话）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 会话列表 | 已完成 | SessionList 组件存在 |
| 创建会话 | 已完成 | CreateSessionModal 存在 |
| 加入会话 | 已完成 | JoinSessionModal 存在 |
| 会话持久化 | **缺失** | `fetchRooms` 为 mock（`setTimeout` 模拟），未连接实际 API |
| 会话邀请 | **缺失** | 未实现邀请链接/邀请码 |
| 会话历史 | **缺失** | 未实现历史会话记录 |

### 5.7 Playlist（播放列表）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 播放列表面板 | 已完成 | PlaylistPanel 组件存在 |
| 播放列表项 | 已完成 | PlaylistItem 组件存在 |
| 添加项目模态 | 已完成 | AddPlaylistItemModal 存在 |
| 播放列表服务 | **部分** | playlistService 文件存在但 API 集成未验证 |
| 拖拽排序 | **缺失** | 未实现拖拽重新排序 |
| 播放控制 | **缺失** | 未实现播放/暂停/跳过控制 |
| 协作播放列表 | **缺失** | 未实现多用户协作 |

### 5.8 Members（成员）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 成员列表 | 已完成 | MemberList 组件存在 |
| 成员搜索 | **缺失** | 未实现成员搜索/过滤 |
| 成员角色管理 | **缺失** | 未实现角色分配/权限管理 |
| 成员资料弹窗 | **缺失** | 未实现点击成员查看资料 |
| 成员状态指示 | **部分** | 成员状态从 store 读取，但实时更新依赖 WebSocket 推送（未验证） |

---

## 6. Store 对齐与 Phase 2

### 6.1 本次决策：不做 11->4 大合并

**明确决定**：本次页面结构重塑**不执行** `store-refactor-plan.md` 中规划的 11 store -> 4 domain store + eventBus 合并。

### 6.2 理由

| 理由 | 说明 |
|------|------|
| 避免破坏构建 | 11 个 store 被 30+ 文件引用，大合并需同步修改所有消费者，风险极高 |
| 最小化变更范围 | 页面结构重塑已涉及 MainLayout、ChannelSidebar、ChatView 等核心文件，叠加 store 合并会导致 diff 爆炸 |
| 降低回滚难度 | store 不动时，页面结构变更可独立回滚（仅需恢复 MainLayout 第3列） |
| 依赖关系 | store 合并应基于清晰的页面边界（Phase 1 完成后），否则消费者修改散落在旧 *View 组件中，增加合并复杂度 |

### 6.3 本次 Store 改动（最小化）

仅对 `layoutStore.ts` 做新增式改动：

```typescript
// 新增字段
activeViewId: ViewId          // 默认 'home'
activeViewParams: ViewParams  // 默认 {}

// 新增 actions
setActiveView(viewId, params?)  // 设置活动视图
clearActiveView()               // 重置为 home
```

**不修改、不删除**任何现有字段或 actions。所有现有 `useLayoutStore` 消费者不受影响。

### 6.4 活动视图状态放在 layoutStore 而非新建 uiStateStore

| 选项 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| 扩展 layoutStore | 零新文件，改动最小，向后兼容 | 与 Phase 2 的 uiStateStore 规划有轻微出入 | **选择** |
| 新建 uiStateStore | 符合 ARCHITECTURE_DESIGN_v2 终态 | 需创建新文件 + 迁移 layoutStore 字段，与 Phase 2 重复劳动 | 不选 |

**理由**：
1. layoutStore 已管理 UI/布局状态（sidebar 开关、断点、移动端状态），`activeViewId` 是其自然延伸
2. 新建 uiStateStore 需要迁移 layoutStore 的现有字段，等于提前做了 Phase 2 的一部分，增加本次变更范围
3. Phase 2 执行 11->4 合并时，`activeViewId`/`activeViewParams` 将随 layoutStore 一起迁移到 uiStateStore，路径清晰
4. 仅新增 2 字段 + 2 actions，对 layoutStore 的影响可忽略

### 6.5 Phase 2 依赖说明

```
Phase 1（本次）：页面结构重塑
  └── 产出：pages/ 目录 + ViewRegistry + NavigationShell + layoutStore 扩展
  └── 效果：页面边界清晰化，每个页面明确依赖哪些 store

Phase 2（后续）：Store 合并
  └── 依赖：Phase 1 完成（页面边界清晰后，store 消费者一目了然）
  └── 执行：store-refactor-plan.md（11 -> 4 domain + eventBus + 向后兼容 re-export）
  └── 效果：store 架构与 ARCHITECTURE_DESIGN_v2 对齐

Phase 3（后续）：WebRTC 重构
  └── 依赖：Phase 2 完成（mediaDomainStore 就位后）
  └── 执行：ARCHITECTURE_DESIGN_v2 第 4 节（WebRTCManager）
```

---

## 7. 后端对齐方案

### 7.1 前提

用户已有独立的 Go 后端仓库。本仓库不含 Go 代码，仅通过 `.env` 指向 `http://localhost:8080`。本仓库侧的"后端完善"产出为一份权威 API 契约文档，供用户同步其 Go 后端实现。

### 7.2 契约文档

**产出文件**：`docs/api-contract.md`  
**产出方**：api-client-generator Subagent  
**权威性**：此文档为前后端对齐的唯一权威依据。Go 后端实现应与此契约保持一致；前端 API 客户端代码应按此契约生成。

### 7.3 契约覆盖的端点族

| 端点族 | 覆盖范围 | 前端消费者 |
|--------|---------|-----------|
| **Auth** | 登录、注册、刷新 token、登出、获取用户信息、修改密码、忘记密码 | authStore、authService |
| **Room** | 列出房间、创建房间、加入房间、离开房间、删除房间、获取参与者列表 | serverStore（roomStore）、roomService |
| **Chat** | 列出消息、发送消息、编辑消息、删除消息、置顶/取消置顶、搜索消息、获取未读数 | chatStore、chatService |
| **Upload** | 上传文件（图片/视频/音频/文档）、获取文件 URL | uploadService |
| **Playlist** | 列出播放列表、创建播放列表、添加项目、删除项目、重新排序、获取播放状态 | playlistStore（如有）、playlistService |
| **Voice** | 加入语音频道、离开语音频道、获取语音参与者、设置静音状态 | voiceStore、voiceService |
| **Screen** | 开始屏幕分享、停止屏幕分享、获取分享状态 | mediaStore、screenShareService |
| **WebSocket 信令** | 语音 join/leave、SDP offer/answer、ICE candidate、屏幕分享 start/stop、用户状态变更、输入指示器、聊天消息推送 | websocketStore、websocketService、webrtcService |

### 7.4 JWT 约定

| 约定项 | 规范 |
|--------|------|
| Access Token 传递 | HTTP Header: `Authorization: Bearer <token>` |
| Access Token 有效期 | 15 分钟 |
| Refresh Token 传递 | HTTP Response Body（JSON）或 HTTP-only Cookie |
| Refresh Token 有效期 | 7 天 |
| 刷新端点 | `POST /api/auth/refresh`，Body: `{ refreshToken: string }` |
| 刷新响应 | `{ accessToken: string, refreshToken: string, expiresIn: number }` |
| Token 存储（前端） | Access Token: 内存（authStore）；Refresh Token: localStorage 或 Electron safeStorage |

### 7.5 错误码约定

| 约定项 | 规范 |
|--------|------|
| HTTP 状态码 | 200（成功）、201（创建）、400（请求错误）、401（未认证）、403（无权限）、404（不存在）、409（冲突）、422（验证失败）、429（限流）、500（服务器错误） |
| 错误响应格式 | `{ "code": "ERROR_CODE", "message": "人类可读描述", "details": {} }` |
| 标准错误码 | `AUTH_INVALID_CREDENTIALS`、`AUTH_TOKEN_EXPIRED`、`AUTH_TOKEN_INVALID`、`AUTH_REFRESH_FAILED`、`ROOM_NOT_FOUND`、`ROOM_FULL`、`ROOM_PERMISSION_DENIED`、`CHAT_MESSAGE_NOT_FOUND`、`CHAT_RATE_LIMITED`、`UPLOAD_FILE_TOO_LARGE`、`UPLOAD_INVALID_TYPE`、`VOICE_ALREADY_JOINED`、`VOICE_NOT_CONNECTED`、`SCREEN_NOT_SHARING`、`WS_CONNECTION_FAILED` |

### 7.6 WebSocket 消息格式

| 约定项 | 规范 |
|--------|------|
| 消息格式 | JSON: `{ "type": "<event_type>", "payload": {}, "timestamp": 1234567890 }` |
| 连接认证 | WS 连接时通过 query param 传递 token: `ws://host/ws?token=<accessToken>` |
| 心跳机制 | 客户端每 30s 发送 `{ "type": "ping" }`，服务端回复 `{ "type": "pong" }`，超时 60s 断开 |
| 标准事件类型 | `voice:join`、`voice:leave`、`signal:offer`、`signal:answer`、`signal:ice`、`screen:start`、`screen:stop`、`chat:message`、`chat:typing`、`user:status`、`room:participant_update` |

### 7.7 前后端对齐流程

```
1. api-client-generator 产出 docs/api-contract.md（权威契约）
2. 用户根据契约同步 Go 后端实现
3. api-client-generator 根据契约生成/更新前端 API 客户端代码（services/）
4. test-engineer 编写 API 集成测试验证契约一致性
5. 后端实现与前端集成测试通过后，标记契约为"已验证"
```

---

## 8. 分阶段计划

### Phase 1A：基础设施（预计 0.5 天）

| 序号 | 任务 | 执行者 | 依赖 |
|------|------|--------|------|
| 1 | 创建 `shared/types/view.ts` + 更新 index.ts | ui-builder | - |
| 2 | 创建 `config/viewRegistry.ts` | ui-builder | #1 |
| 3 | 扩展 `layoutStore.ts`（+activeViewId/setActiveView） | ui-builder | #1 |
| 4 | 创建 `pages/NavigationShell.tsx` | ui-builder | #2, #3 |
| 5 | 创建 `pages/index.ts` 桶导出 | ui-builder | #4 |
| 6 | 创建 5 个空页面桩文件 | ui-builder | #1 |

**验证**：`pnpm build` 通过。

### Phase 1B：集成接入（预计 0.5 天）

| 序号 | 任务 | 执行者 | 依赖 |
|------|------|--------|------|
| 7 | 修改 `MainLayout.tsx`（第3列 → NavigationShell） | ui-builder | #4, #6 |
| 8 | 修改 `ChannelSidebar.tsx`（onClick → setActiveView） | ui-builder | #3 |
| 9 | 实现 `HomePage.tsx`（空状态） | ui-builder | #6 |

**验证**：`pnpm dev` 中频道切换正常，空状态显示正常。

### Phase 1C：页面实现（预计 1-2 天）

| 序号 | 任务 | 执行者 | 依赖 |
|------|------|--------|------|
| 10 | 实现 `ChannelPage.tsx`（包裹 ChatView） | ui-builder | #7 |
| 11 | 提取 VoiceChannelView → `VoicePage.tsx` + 辅助组件 | ui-builder | #10 |
| 12 | 移动展示组件（ScreenShareView/VoiceSessionView） | ui-builder | - |
| 13 | 实现 `ScreenSharePage.tsx`（容器） | ui-builder | #12 |
| 14 | 实现 `SettingsPage.tsx`（包裹 SettingsView） | ui-builder | - |
| 15 | 修复 ChatView `MessageResponse` 导入 | ui-builder | #11 |

**验证**：`pnpm dev` 全功能验证，所有视图正常渲染。

### Phase 1D：清理（预计 0.5 天）

| 序号 | 任务 | 执行者 | 依赖 |
|------|------|--------|------|
| 16 | 标记 deprecated 的 *View 组件 | ui-builder | #15 |
| 17 | 删除 `components/pages/` 空目录 | ui-builder | #12 |
| 18 | 最终验证（lint + build + 功能测试） | test-engineer | #16 |

### Phase 2：Store 合并（后续，依赖 Phase 1 完成）

执行 `store-refactor-plan.md`：11 store -> 4 domain store + eventBus + 向后兼容 re-export。

### Phase 3：后端对齐（可与 Phase 1/2 并行）

| 序号 | 任务 | 执行者 | 依赖 |
|------|------|--------|------|
| 19 | 产出 `docs/api-contract.md` | api-client-generator | - |
| 20 | 用户同步 Go 后端 | 用户 | #19 |
| 21 | 生成/更新前端 API 客户端 | api-client-generator | #19 |
| 22 | API 集成测试 | test-engineer | #20, #21 |

---

## 9. 风险与回滚

### 9.1 风险评估

| 风险 | 等级 | 影响 | 缓解措施 |
|------|------|------|----------|
| ChatView 提取 VoiceChannelView 导致回归 | 高 | 语音频道功能不可用 | 提取前先复制 VoiceChannelView 代码到 VoicePage，验证功能后再从 ChatView 删除 |
| layoutStore 新增字段导致意外 re-render | 中 | 性能下降 | 使用 selector 订阅（`useLayoutStore(s => s.activeViewId)`），避免全量订阅 |
| 懒加载页面首次加载白屏 | 中 | 用户体验差 | Suspense fallback 使用骨架屏（SkeletonMessageList），非白屏 |
| SettingsView `h-screen` → `h-full` 导致样式断裂 | 中 | 设置页布局异常 | 修改后逐一检查设置分区（appearance/audio/video/notifications/shortcuts/about） |
| ChannelSidebar 的 `getDefaultChannels` 硬编码频道类型 | 低 | 未来真实频道数据接入后需调整 | 当前硬编码频道 ID 模式（`-voice` 后缀）可正常工作；未来后端返回频道列表后，改为读取 `channel.type` 字段 |
| deprecated 组件仍被某处引用 | 低 | 删除后编译报错 | 标记 deprecated 后运行全局 grep 确认无引用再删除 |

### 9.2 回滚方案

| 回滚场景 | 操作 | 影响范围 |
|----------|------|----------|
| NavigationShell 出现严重问题 | 恢复 MainLayout 第3列为 `<RemoteScreensContainer /> + <ChatView />` | 仅 MainLayout.tsx 1 处 |
| 某个页面组件有 Bug | 将该 ViewId 的注册条目临时替换为桩组件 | 仅 viewRegistry.ts 1 处 |
| layoutStore 新增字段有问题 | 删除新增字段，NavigationShell 临时使用硬编码 `activeViewId = 'channel'` | layoutStore.ts + NavigationShell.tsx |
| 全量回滚 | `git revert` 本次所有提交 | 无数据损失（store 未合并，无迁移数据） |

### 9.3 回滚前提

- 本次所有改动在新功能分支上进行
- 每个步骤完成后立即提交，保持提交粒度可单独 revert
- 不修改 store 结构（仅新增），回滚无需数据迁移

---

## 附录：与已有文档的关系

| 文档 | 关系 |
|------|------|
| `ARCHITECTURE_DESIGN_v2.md` | 本方案是其 Phase 1 前端部分的前置步骤（页面结构清晰化），不冲突 |
| `store-refactor-plan.md` | 本方案明确推迟其执行到 Phase 2，不冲突 |
| `joint-decision-glassmorphism.md` | 本方案的页面组件预留 GlassSurface 接入点（CSS 变量），不冲突 |
| `page-structure-spec.md` | 本方案的可执行实现规范，1:1 对应 |
