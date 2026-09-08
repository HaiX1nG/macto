# 页面结构与视图注册表实现规范

> 面向角色：ui-builder Subagent  
> 日期：2026-08-06  
> 状态：可执行  
> 前置文档：`docs/refactor-plan-pages-and-backend.md`（修改计划）、`docs/joint-decision-glassmorphism.md`（玻璃态规范）

---

## 1. 文件总览

### 1.1 新增文件清单

```
src/shared/types/
└── view.ts                          # 新增：ViewId、ViewParams 类型定义

src/renderer/config/
├── viewRegistry.ts                  # 新增：视图注册表（类型 + 实现 + 懒加载）
└── shortcuts.ts                      # 已有：不动

src/renderer/pages/                   # 新增目录
├── index.ts                          # 桶导出
├── NavigationShell.tsx               # 导航壳：按 activeViewId 渲染页面
├── HomePage.tsx                      # 首页/空状态
├── ChannelPage.tsx                   # 文字频道聊天页
├── VoicePage.tsx                     # 语音频道会话页
├── ScreenSharePage.tsx               # 屏幕分享页（容器，store 连接）
└── SettingsPage.tsx                  # 设置页
```

### 1.2 移动文件清单

| 原路径 | 目标路径 | 说明 |
|--------|---------|------|
| `src/renderer/components/pages/ScreenSharePage.tsx` | `src/renderer/components/screen/ScreenShareView.tsx` | 展示组件重命名，避免与新容器同名 |
| `src/renderer/components/pages/VoiceSessionPage.tsx` | `src/renderer/components/voice/VoiceSessionView.tsx` | 展示组件重命名 |

移动后删除 `src/renderer/components/pages/` 目录。

### 1.3 修改文件清单

| 文件 | 改动范围 |
|------|---------|
| `src/renderer/stores/layoutStore.ts` | 新增 `activeViewId`、`activeViewParams`、`setActiveView`、`clearActiveView` |
| `src/renderer/components/layout/MainLayout.tsx` | 第3列内容替换为 `<NavigationShell />`，loadRooms 后追加 `setActiveView` |
| `src/renderer/components/layout/ChannelSidebar.tsx` | 频道点击时追加 `setActiveView` 调用 |
| `src/renderer/components/chat/ChatView.tsx` | 提取 `VoiceChannelView` 到 `VoicePage.tsx`，删除内部分支 |
| `src/shared/types/index.ts` | 追加 `export * from './view'` |

---

## 2. 类型定义

### 2.1 `src/shared/types/view.ts`

```typescript
/**
 * 视图标识符。
 * 每个值对应 pages/ 目录下的一个页面组件。
 */
export type ViewId = 'home' | 'channel' | 'voice' | 'screen' | 'settings'

/**
 * 传递给页面组件的导航参数。
 * 所有字段可选，不同页面按需读取。
 */
export interface ViewParams {
  /** 当前房间 ID */
  readonly roomId?: string
  /** 当前频道 ID */
  readonly channelId?: string
  /** 会话 ID（语音/屏幕共享会话） */
  readonly sessionId?: string
}
```

### 2.2 `src/shared/types/index.ts` 追加

在文件末尾追加：

```typescript
export * from './view'
```

---

## 3. ViewRegistry 接口签名与实现

### 3.1 文件位置

`src/renderer/config/viewRegistry.ts`

### 3.2 完整实现

```typescript
import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { ViewId, ViewParams } from '@shared/types/view'

// ── 页面组件 Props 契约 ──────────────────────────────

/**
 * 所有页面组件必须实现的 Props 接口。
 * NavigationShell 会将 layoutStore 中的 activeViewParams 传入。
 */
export interface ViewPageProps {
  readonly params: ViewParams
}

// ── 注册表条目类型 ────────────────────────────────────

/**
 * 视图注册表中的一条记录。
 */
export interface ViewEntry {
  /** 视图标识符 */
  readonly id: ViewId
  /** 显示名称（可用于面包屑、标签页标题） */
  readonly title: string
  /** 懒加载的页面组件 */
  readonly component: LazyExoticComponent<ComponentType<ViewPageProps>>
}

// ── 懒加载页面组件 ────────────────────────────────────

const HomePage = lazy(() => import('@renderer/pages/HomePage'))
const ChannelPage = lazy(() => import('@renderer/pages/ChannelPage'))
const VoicePage = lazy(() => import('@renderer/pages/VoicePage'))
const ScreenSharePage = lazy(() => import('@renderer/pages/ScreenSharePage'))
const SettingsPage = lazy(() => import('@renderer/pages/SettingsPage'))

// ── 注册表实现 ────────────────────────────────────────

const registry = new Map<ViewId, ViewEntry>([
  ['home', { id: 'home', title: '首页', component: HomePage }],
  ['channel', { id: 'channel', title: '频道', component: ChannelPage }],
  ['voice', { id: 'voice', title: '语音', component: VoicePage }],
  ['screen', { id: 'screen', title: '屏幕分享', component: ScreenSharePage }],
  ['settings', { id: 'settings', title: '设置', component: SettingsPage }],
])

/**
 * 按 ViewId 获取视图条目。
 * @returns 视图条目，未注册时返回 undefined
 */
export function getView(id: ViewId): ViewEntry | undefined {
  return registry.get(id)
}

/**
 * 获取所有已注册视图。
 */
export function getAllViews(): readonly ViewEntry[] {
  return Array.from(registry.values())
}

/**
 * 动态注册视图（供未来插件扩展使用）。
 * 如果 id 已存在，覆盖旧条目并打印警告。
 */
export function registerView(entry: ViewEntry): void {
  if (registry.has(entry.id)) {
    console.warn(`[ViewRegistry] 视图 "${entry.id}" 已注册，正在覆盖`)
  }
  registry.set(entry.id, entry)
}
```

### 3.3 设计约束

- `ViewId` 为联合字面量类型，TS 编译器会强制 `Record<ViewId, ViewEntry>` 的完整性检查（漏注册一个 ViewId 即编译报错）
- 所有页面通过 `React.lazy()` 懒加载，实现代码分割
- 每个页面文件必须导出 **default**（供 `lazy(() => import(...))` 使用）和 **named**（供桶导出使用）

---

## 4. NavigationShell 组件规范

### 4.1 文件位置

`src/renderer/pages/NavigationShell.tsx`

### 4.2 Props 接口

```typescript
export interface NavigationShellProps {
  /** 可选 className 覆盖 */
  readonly className?: string
}
```

### 4.3 组件行为契约

| 职责 | 说明 |
|------|------|
| 读取活动视图 | 从 `layoutStore` 读取 `activeViewId` 和 `activeViewParams` |
| 解析页面组件 | 调用 `getView(activeViewId)` 获取 `ViewEntry` |
| 渲染页面 | 使用 `<Suspense>` 包裹懒加载组件，`fallback` 为骨架屏 |
| 过渡动画 | 使用 `framer-motion` 的 `AnimatePresence mode="wait"`，以 `activeViewId` 为 `key` |
| 远程屏幕浮层 | 从 `mediaStore` 读取 `remoteScreens.size`，有远程屏幕时在页面上方渲染 `<RemoteScreensContainer />` |
| 空状态 | 若 `getView` 返回 `undefined`，渲染 `<NoChannelSelected />` |
| 容器样式 | `h-full flex flex-col min-w-0 overflow-hidden bg-[var(--color-bg-base)]` |

### 4.4 参考实现

```typescript
import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLayoutStore } from '@renderer/stores/layoutStore'
import { useMediaStore } from '@renderer/stores/mediaStore'
import { getView } from '@renderer/config/viewRegistry'
import { RemoteScreensContainer } from '@renderer/components/screen/RemoteScreensContainer'
import { SkeletonMessageList } from '@renderer/components/ui/Skeleton'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import { cn } from '@renderer/utils/cn'
import type { NavigationShellProps } from './NavigationShell'

function PageSkeleton(): ReactNode {
  return <SkeletonMessageList count={6} />
}

export function NavigationShell({ className }: NavigationShellProps): ReactNode {
  const activeViewId = useLayoutStore((s) => s.activeViewId)
  const activeViewParams = useLayoutStore((s) => s.activeViewParams)
  const hasRemoteScreens = useMediaStore((s) => s.remoteScreens.size > 0)

  const entry = getView(activeViewId)
  const PageComponent = entry?.component

  return (
    <div
      className={cn(
        'h-full flex flex-col min-w-0 overflow-hidden bg-[var(--color-bg-base)]',
        className,
      )}
    >
      {/* 远程屏幕浮层：有远程屏幕共享时在顶部显示 */}
      {hasRemoteScreens && <RemoteScreensContainer />}

      {/* 活动视图：按 activeViewId 渲染，带过渡动画 */}
      <Suspense fallback={<PageSkeleton />}>
        <AnimatePresence mode="wait">
          {PageComponent ? (
            <motion.div
              key={activeViewId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 min-h-0 flex flex-col"
            >
              <PageComponent params={activeViewParams} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <NoChannelSelected />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  )
}

export default NavigationShell
```

### 4.5 注意事项

- `SkeletonMessageList` 已存在于 `@renderer/components/ui/Skeleton`，直接复用
- `NoChannelSelected` 已存在于 `@renderer/components/ui/EmptyState`，直接复用
- `RemoteScreensContainer` 已存在于 `@renderer/components/screen/RemoteScreensContainer`，直接复用，不修改其内部逻辑
- 动画采用 `prefers-reduced-motion` 友好的 `opacity` 过渡（非位移），后续 GlassSurface 实现后可替换为更丰富的过渡

---

## 5. layoutStore 改动 diff

### 5.1 文件

`src/renderer/stores/layoutStore.ts`

### 5.2 新增导入（文件顶部）

```diff
+ import type { ViewId, ViewParams } from '@shared/types/view'
```

### 5.3 接口新增字段（LayoutState 接口内）

```diff
  interface LayoutState {
    // ... 现有字段不动 ...

+   // ── 活动视图状态 ──
+   /** 当前活动视图 ID */
+   activeViewId: ViewId
+   /** 当前活动视图参数 */
+   activeViewParams: ViewParams

    // ... 现有 actions 不动 ...

+   // ── 视图导航 actions ──
+   /** 设置活动视图 */
+   setActiveView: (viewId: ViewId, params?: ViewParams) => void
+   /** 重置为默认视图（home） */
+   clearActiveView: () => void

    // ... 现有 computed helpers 不动 ...
  }
```

### 5.4 实现新增（create 内部）

```diff
+ // 默认视图
+ const DEFAULT_VIEW: ViewId = 'home'
+ const DEFAULT_PARAMS: ViewParams = {}

  export const useLayoutStore = create<LayoutState>((set, get) => ({
    // ... 现有初始值不动 ...

+   activeViewId: DEFAULT_VIEW,
+   activeViewParams: DEFAULT_PARAMS,

    // ... 现有 actions 不动 ...

+   setActiveView: (viewId, params = DEFAULT_PARAMS) =>
+     set({ activeViewId: viewId, activeViewParams: params }),
+
+   clearActiveView: () =>
+     set({ activeViewId: DEFAULT_VIEW, activeViewParams: DEFAULT_PARAMS }),

    // ... 现有 computed helpers 不动 ...
  }))
```

### 5.5 向后兼容性

- 仅新增字段和 actions，不修改或删除任何现有字段
- 所有现有 `useLayoutStore` 的消费者不受影响
- 当 Phase 2 执行 11→4 store 合并时，`activeViewId` / `activeViewParams` 将随 `layoutStore` 一起迁移到 `uiStateStore`

---

## 6. 各 Page 组件规范

每个页面组件必须满足以下契约：

```
- 导出 named export（如 `export function HomePage()`）
- 导出 default export（如 `export default HomePage`）
- 接受 ViewPageProps 作为唯一 props
- 填充父容器（使用 h-full / flex-1，不使用 h-screen）
- 不包含自己的侧边栏（ServerSidebar / ChannelSidebar 由 MainLayout 提供）
```

### 6.1 HomePage

| 项目 | 内容 |
|------|------|
| **路径** | `src/renderer/pages/HomePage.tsx` |
| **职责** | 欢迎页/空状态，无选中频道时展示 |
| **依赖** | `@renderer/components/ui/EmptyState`（NoChannelSelected） |
| **行为** | 渲染 `<NoChannelSelected />`；后续可扩展为仪表盘（统计卡片、快速操作） |
| **参考实现** | 见下方 |

```typescript
import type { ReactNode } from 'react'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

export function HomePage(_props: ViewPageProps): ReactNode {
  return (
    <div className="flex-1 flex items-center justify-center">
      <NoChannelSelected />
    </div>
  )
}

export default HomePage
```

### 6.2 ChannelPage

| 项目 | 内容 |
|------|------|
| **路径** | `src/renderer/pages/ChannelPage.tsx` |
| **职责** | 文字频道聊天页，包裹现有 ChatView |
| **依赖** | `@renderer/components/chat/ChatView` |
| **行为** | 渲染 `<ChatView />`。ChatView 自行从 roomStore 读取 `currentChannelId`，无需通过 params 传递 |
| **重要** | ChatView 内部需先完成 VoiceChannelView 提取（见步骤 7），使其只处理文字频道 |

```typescript
import type { ReactNode } from 'react'
import { ChatView } from '@renderer/components/chat/ChatView'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

export function ChannelPage(_props: ViewPageProps): ReactNode {
  return <ChatView />
}

export default ChannelPage
```

### 6.3 VoicePage

| 项目 | 内容 |
|------|------|
| **路径** | `src/renderer/pages/VoicePage.tsx` |
| **职责** | 语音频道会话页，从 ChatView 中提取的 VoiceChannelView 逻辑 |
| **依赖** | `@renderer/stores/voiceStore`、`@renderer/stores/authStore`、`@renderer/stores/serverStore`、`@renderer/services`（voiceService） |
| **行为** | 1. 从 roomStore 读取 currentChannelId 获取频道信息；2. 从 voiceStore 读取 isCapturing/isMuted/isSpeaking/audioLevel；3. 提供 join/leave/mute 操作；4. 渲染参与者列表、音量控制；5. 可选渲染 PlaylistPanel（右侧） |
| **提取来源** | `ChatView.tsx` 中的 `VoiceChannelView` 函数（约 399-636 行）和 `VoiceParticipant` 辅助组件（约 638-703 行） |

**提取规则**：
1. 将 `VoiceChannelView` 函数体移入 `VoicePage.tsx`，重命名为 `VoicePage`
2. 将 `VoiceParticipant` 辅助组件移入 `@renderer/components/voice/VoiceParticipantCard.tsx`（供 VoicePage 和其他组件复用）
3. `HeaderBtn` 辅助组件移入 `@renderer/components/ui/HeaderButton.tsx`（ChatView 和 VoicePage 共用）
4. VoicePage 接收 `ViewPageProps`，从 `params.channelId` 或 roomStore 的 `currentChannelId` 获取频道 ID
5. 将 `h-full` 替换 `h-screen`（适配内容区）

### 6.4 ScreenSharePage（容器）

| 项目 | 内容 |
|------|------|
| **路径** | `src/renderer/pages/ScreenSharePage.tsx` |
| **职责** | 屏幕分享页容器，连接 mediaStore，包裹展示组件 |
| **依赖** | `@renderer/stores/mediaStore`、`@renderer/components/screen/ScreenShareView`（原 components/pages/ScreenSharePage.tsx 移动并重命名） |
| **行为** | 1. 从 mediaStore 读取 localStream、remoteScreens、isSharing 状态；2. 调用 mediaStore 的 startShare/stopShare/pauseToggle actions；3. 将状态和回调作为 props 传给 `<ScreenShareView />` 展示组件 |

```typescript
import type { ReactNode } from 'react'
import { useMediaStore } from '@renderer/stores/mediaStore'
import ScreenShareView from '@renderer/components/screen/ScreenShareView'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

export function ScreenSharePage(_props: ViewPageProps): ReactNode {
  const localStream = useMediaStore((s) => s.localStream)
  const remoteScreens = useMediaStore((s) => s.remoteScreens)
  // ... 读取其他需要的 state 和 actions

  return (
    <ScreenShareView
      localStream={localStream ?? null}
      remoteScreens={/* mapped */}
      isPaused={false}
      onPauseToggle={() => {}}
      onStop={() => {}}
    />
  )
}

export default ScreenSharePage
```

> 注意：容器组件的具体 store 读取逻辑需根据 mediaStore 的实际 API 确定。上方为结构示例。

### 6.5 SettingsPage

| 项目 | 内容 |
|------|------|
| **路径** | `src/renderer/pages/SettingsPage.tsx` |
| **职责** | 设置页，包裹现有 SettingsView |
| **依赖** | `@renderer/components/layout/SettingsView`（暂时引用，后续 SettingsView 迁移到 pages/ 时直接内联） |
| **行为** | 渲染 `<SettingsView />`，去除 SettingsView 的 `h-screen` 改为 `h-full` |

```typescript
import type { ReactNode } from 'react'
import { SettingsView } from '@renderer/components/layout/SettingsView'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

export function SettingsPage(_props: ViewPageProps): ReactNode {
  return <SettingsView />
}

export default SettingsPage
```

> 注意：SettingsView 当前使用 `h-screen`，需改为 `h-full` 以适配内容区。此修改在步骤 9 中执行。

### 6.6 桶导出 `src/renderer/pages/index.ts`

```typescript
export { NavigationShell } from './NavigationShell'
export type { NavigationShellProps } from './NavigationShell'
export { HomePage } from './HomePage'
export { ChannelPage } from './ChannelPage'
export { VoicePage } from './VoicePage'
export { ScreenSharePage } from './ScreenSharePage'
export { SettingsPage } from './SettingsPage'
```

---

## 7. MainLayout 改动说明

### 7.1 文件

`src/renderer/components/layout/MainLayout.tsx`

### 7.2 改动 1：导入 NavigationShell

```diff
  import { useLayoutStore, SIDEBAR_WIDTHS } from '@renderer/stores/layoutStore'
+ import { NavigationShell } from '@renderer/pages'
```

### 7.3 改动 2：从 layoutStore 解构 setActiveView

```diff
  const {
    memberListVisible,
    serverSidebarExpanded,
    updateBreakpoint,
    currentBreakpoint,
    mobileChannelSidebarOpen,
    closeMobileChannelSidebar,
+   setActiveView,
  } = useLayoutStore()
```

### 7.4 改动 3：loadRooms 完成后设置视图

在 `loadRooms` 函数中，设置第一个频道后追加：

```diff
  setCurrentRoomId(String(firstRoom.id))
  setCurrentChannel(String(firstRoom.id))
+ setActiveView('channel', { channelId: String(firstRoom.id) })
```

### 7.5 改动 4：第3列内容替换

将第 180-183 行：

```diff
  <div className="h-full flex flex-col min-w-0 overflow-hidden bg-[var(--color-bg-base)]">
-   <RemoteScreensContainer />
-   <ChatView />
+   <NavigationShell />
  </div>
```

### 7.6 不动的部分

- 4 列 Grid 模板（`getGridTemplate`）不变
- ServerSidebar（第1列）不变
- ChannelSidebar（第2列）不变
- MemberList（第4列）不变
- 移动端 ChannelSidebar 浮层不变
- 所有 useEffect hooks（fetchRooms、fetchUserInfo、initTheme、resize listener）不变
- 键盘快捷键注册不变

---

## 8. ChannelSidebar 改动说明

### 8.1 文件

`src/renderer/components/layout/ChannelSidebar.tsx`

### 8.2 改动 1：导入 layoutStore

```diff
  import { useRoomStore } from '@renderer/stores/serverStore'
+ import { useLayoutStore } from '@renderer/stores/layoutStore'
```

### 8.3 改动 2：解构 setActiveView

在 `ChannelSidebar` 函数内：

```diff
  const { rooms, currentRoomId, currentChannelId, setCurrentChannel } = useRoomStore()
+ const { setActiveView } = useLayoutStore()
```

### 8.4 改动 3：频道点击时设置视图

将 `ChannelItem` 的 `onClick` 从：

```diff
- onClick={() => setCurrentChannel(channel.id)}
+ onClick={() => {
+   setCurrentChannel(channel.id)
+   setActiveView(
+     channel.type === 'voice' ? 'voice' : 'channel',
+     { channelId: channel.id },
+   )
+ }}
```

---

## 9. ChatView 提取 VoiceChannelView 说明

### 9.1 文件

`src/renderer/components/chat/ChatView.tsx`

### 9.2 提取内容

| 提取项 | 目标位置 | 说明 |
|--------|---------|------|
| `VoiceChannelView` 函数组件（约 399-636 行） | `src/renderer/pages/VoicePage.tsx` | 重命名为 `VoicePage`，改为 `ViewPageProps` 签名 |
| `VoiceParticipant` 辅助组件（约 638-703 行） | `src/renderer/components/voice/VoiceParticipantCard.tsx` | 独立文件，供复用 |
| `HeaderBtn` 辅助组件（约 382-397 行） | `src/renderer/components/ui/HeaderButton.tsx` | 独立文件，ChatView 和 VoicePage 共用 |

### 9.3 ChatView 提取后的行为

提取后，ChatView 的 `if (currentChannel.type === 'voice') return <VoiceChannelView channel={currentChannel} />` 分支删除。

ChatView 只负责文字频道渲染。语音频道的渲染由 NavigationShell 通过 `activeViewId = 'voice'` 路由到 VoicePage 处理。

### 9.4 提取后的 ChatView 签名

```typescript
export function ChatView(): ReactNode {
  // 不再检查 channel.type === 'voice'
  // 只渲染文字频道内容
}
```

### 9.5 ChatView 中需修复的问题

- `MessageResponse` 类型在 `handleSearchMessageClick` 回调参数中使用但未导入。需补充 `import type { MessageResponse } from '@shared/types/api'` 或修正参数类型。

---

## 10. 逐步实施步骤

> 每步完成后执行标注的验证检查。全部步骤完成后执行最终验证。

### 步骤 1：创建类型定义

1. 创建 `src/shared/types/view.ts`（内容见第 2 节）
2. 在 `src/shared/types/index.ts` 末尾追加 `export * from './view'`

**验证**：`pnpm build`（TypeScript 编译）通过，无新增错误。

### 步骤 2：创建空页面桩文件

为每个页面创建最小桩文件（仅 default export 一个空 div），确保 lazy import 能解析：

```
src/renderer/pages/HomePage.tsx
src/renderer/pages/ChannelPage.tsx
src/renderer/pages/VoicePage.tsx
src/renderer/pages/ScreenSharePage.tsx
src/renderer/pages/SettingsPage.tsx
```

每个桩文件格式：

```typescript
export function PageName() {
  return <div>PageName Placeholder</div>
}
export default PageName
```

**验证**：`pnpm build` 通过。

### 步骤 3：创建视图注册表

创建 `src/renderer/config/viewRegistry.ts`（内容见第 3 节）。

**验证**：`pnpm build` 通过，无类型错误。

### 步骤 4：扩展 layoutStore

按第 5 节的 diff 修改 `src/renderer/stores/layoutStore.ts`。

**验证**：`pnpm build` 通过；`pnpm test`（如有 layoutStore 测试）通过。

### 步骤 5：创建 NavigationShell

创建 `src/renderer/pages/NavigationShell.tsx`（内容见第 4 节）。

**验证**：`pnpm build` 通过。

### 步骤 6：创建桶导出

创建 `src/renderer/pages/index.ts`（内容见第 6.6 节）。

**验证**：`pnpm build` 通过。

### 步骤 7：修改 MainLayout

按第 7 节的 4 处改动修改 `MainLayout.tsx`。

**验证**：`pnpm dev` 启动后，应用正常加载，第3列显示 NavigationShell（当前渲染桩文件占位）。

### 步骤 8：修改 ChannelSidebar

按第 8 节修改 `ChannelSidebar.tsx`。

**验证**：`pnpm dev` 中点击文字频道 -> 第3列切换到 ChannelPage 桩；点击语音频道 -> 切换到 VoicePage 桩。

### 步骤 9：实现 HomePage

将 `src/renderer/pages/HomePage.tsx` 桩替换为正式实现（第 6.1 节）。

**验证**：无选中频道时显示 NoChannelSelected 空状态。

### 步骤 10：实现 ChannelPage

将桩替换为正式实现（第 6.2 节）。ChatView 暂时保留 VoiceChannelView 内部分支（下一步才提取）。

**验证**：点击文字频道 -> 显示 ChatView 聊天界面，消息列表、输入框正常。

### 步骤 11：提取 VoiceChannelView 并实现 VoicePage

1. 创建 `src/renderer/components/ui/HeaderButton.tsx`，移入 ChatView 的 `HeaderBtn`
2. 创建 `src/renderer/components/voice/VoiceParticipantCard.tsx`，移入 ChatView 的 `VoiceParticipant`
3. 创建 `src/renderer/pages/VoicePage.tsx`，移入 ChatView 的 `VoiceChannelView`（改为 ViewPageProps 签名）
4. 修改 ChatView：删除 VoiceChannelView、VoiceParticipant、HeaderBtn，改为 import 新文件；删除 `channel.type === 'voice'` 分支
5. 修复 ChatView 中 `MessageResponse` 类型未导入问题

**验证**：`pnpm build` 通过；点击文字频道 -> 正常聊天；点击语音频道 -> 显示语音会话界面，join/leave/mute 正常工作。

### 步骤 12：实现 ScreenSharePage 容器

1. 将 `src/renderer/components/pages/ScreenSharePage.tsx` 移动到 `src/renderer/components/screen/ScreenShareView.tsx`（重命名，更新内部 export name）
2. 将 `src/renderer/components/pages/VoiceSessionPage.tsx` 移动到 `src/renderer/components/voice/VoiceSessionView.tsx`（重命名）
3. 删除 `src/renderer/components/pages/` 目录
4. 将 `src/renderer/pages/ScreenSharePage.tsx` 桩替换为容器实现（第 6.4 节）

**验证**：`pnpm build` 通过；`pnpm dev` 中屏幕分享视图正常加载。

### 步骤 13：实现 SettingsPage

1. 将 `src/renderer/pages/SettingsPage.tsx` 桩替换为正式实现（第 6.5 节）
2. 修改 `SettingsView.tsx` 的根 div：`h-screen` -> `h-full`

**验证**：`pnpm dev` 中打开设置 -> 设置页正常显示，各 tab 切换正常。

### 步骤 14：最终验证

执行以下完整检查：

1. **编译检查**：`pnpm build` 零错误零警告
2. **Lint 检查**：`pnpm lint` 通过
3. **功能验证**（`pnpm dev`）：
   - [ ] 应用启动后显示空状态（HomePage）
   - [ ] 选择服务器后加载频道列表
   - [ ] 点击文字频道 -> 显示聊天界面
   - [ ] 点击语音频道 -> 显示语音会话界面
   - [ ] 语音 join/leave/mute 功能正常
   - [ ] 远程屏幕共享时，NavigationShell 顶部显示 RemoteScreensContainer
   - [ ] 视图切换时有淡入淡出过渡动画
   - [ ] 懒加载页面首次加载时显示骨架屏
4. **回归验证**：ServerSidebar、ChannelSidebar、MemberList 功能不受影响

---

## 11. 不动哪些文件

以下文件在本次重构中**不做任何修改**：

### 完全不动

| 目录/文件 | 原因 |
|-----------|------|
| `src/main/**` | 主进程不涉及页面结构 |
| `src/preload/**` | 预加载脚本不涉及 |
| `src/renderer/App.tsx` | 认证门控逻辑不变 |
| `src/renderer/main.tsx` | 入口不变 |
| `src/renderer/stores/` 下除 layoutStore 外的所有 store | 本次不做 store 合并 |
| `src/renderer/services/**` | 服务层不变 |
| `src/renderer/hooks/**` | 自定义 hooks 不变 |
| `src/renderer/components/ui/**` | UI 基础组件不变（仅新增 HeaderButton） |
| `src/renderer/components/screen/RemoteScreensContainer.tsx` | 被 NavigationShell 复用，不变 |
| `src/renderer/components/screen/RemoteScreenView.tsx` | 不变 |
| `src/renderer/components/screen/ScreenPreview.tsx` | 不变 |
| `src/renderer/components/screen/ScreenControls.tsx` | 不变 |
| `src/renderer/components/screen/ViewerGrid.tsx` | 不变 |
| `src/renderer/components/screen/ScreenSharePicker.tsx` | 不变 |
| `src/renderer/components/screen/ScreenSharePreview.tsx` | 不变 |
| `src/renderer/components/voice/AudioWaveform.tsx` | 不变 |
| `src/renderer/components/voice/VoiceControls.tsx` | 不变 |
| `src/renderer/components/voice/ParticipantList.tsx` | 不变 |
| `src/renderer/components/playlist/**` | 不变 |
| `src/renderer/components/members/**` | 不变 |
| `src/renderer/components/chat/MessageList.tsx` | 不变 |
| `src/renderer/components/chat/MessageInput.tsx` | 不变 |
| `src/renderer/components/chat/SearchMessages.tsx` | 不变 |
| `src/renderer/components/chat/MentionAutocomplete.tsx` | 不变 |
| `src/renderer/components/auth/**` | 不变 |
| `src/renderer/components/server/**` | 不变 |
| `src/renderer/features/**` | 不变 |
| `src/renderer/config/shortcuts.ts` | 不变 |
| `src/renderer/utils/**` | 不变（仅可能新增 navigation 工具） |
| `src/renderer/styles/**` | 不变 |
| `electron.vite.config.ts` | 不变 |
| `tsconfig.json` | 不变 |
| `tailwind.config.ts` | 不变 |

### 仅微调（已在上文说明）

| 文件 | 改动范围 |
|------|---------|
| `src/renderer/components/layout/MainLayout.tsx` | 第3列替换 + loadRooms 后 setActiveView |
| `src/renderer/components/layout/ChannelSidebar.tsx` | onClick 追加 setActiveView |
| `src/renderer/components/chat/ChatView.tsx` | 提取 VoiceChannelView + 修复 MessageResponse 导入 |
| `src/renderer/components/layout/SettingsView.tsx` | `h-screen` -> `h-full` |

### 后续清理（不在本次步骤中，列为 Phase 1D）

以下文件在页面迁移完成后标记为 `@deprecated`，后续清理阶段删除：

- `src/renderer/components/layout/HomeView.tsx`
- `src/renderer/components/layout/ChannelView.tsx`
- `src/renderer/components/layout/VoiceView.tsx`
- `src/renderer/components/layout/ScreenView.tsx`
- `src/renderer/components/layout/ChannelList.tsx`
- `src/renderer/components/layout/SubcategoryList.tsx`
- `src/renderer/components/layout/ChannelControlPanel.tsx`
- `src/renderer/components/layout/Header.tsx`（如未被引用）
- `src/renderer/components/layout/Content.tsx`（如未被引用）
- `src/renderer/components/layout/Sidebar.tsx`（如未被引用）
- `src/renderer/components/pages/`（移动后删除空目录）

---

## 12. 设计约束清单

- [ ] TypeScript strict mode：无 `any`，使用 `import type` 导入类型
- [ ] 路径别名：`@renderer/`、`@shared/`
- [ ] 所有页面组件同时导出 named + default
- [ ] 页面不使用 `h-screen`（使用 `h-full` / `flex-1`）
- [ ] 页面不包含自己的侧边栏
- [ ] ViewRegistry 中所有 ViewId 都有对应条目
- [ ] NavigationShell 使用 Suspense + AnimatePresence
- [ ] layoutStore 改动仅为新增，不修改/删除现有字段
- [ ] ChatView 提取后只处理文字频道
- [ ] GlassSurface 尚未实现时，页面使用 CSS 变量（`var(--color-bg-base)` 等）
