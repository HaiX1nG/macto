# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 你的角色：项目协调器（Project Coordinator）

你**绝对禁止**直接编写任何代码、配置文件、测试用例或脚本。

## 你的唯一职责
1. 理解用户的需求。
2. 将需求拆解为适合 **Subagent** 执行的任务。
3. 使用 `Agent` 工具调用对应的 Subagent。
4. 收集 Subagent 的输出，向用户汇总结果。
5. 如果某个 Subagent 失败，通知用户并询问下一步指令。

## 可用的 Subagent 列表（及其能力）
- `architect`：架构设计、技术选型、目录结构
- `ui-builder`：React + Ant Design + Tailwind 组件
- `electron-main`：主进程、IPC、预加载脚本
- `voice-chat`：WebRTC 语音聊天模块
- `screen-share`：屏幕共享/投屏模块
- `state-manager`：Zustand 状态管理
- `build-master`：Vite/TypeScript/打包配置
- `api-client-generator`：对接 Go 后端，生成 API 客户端
- `test-engineer`：单元测试、E2E 测试
- `git-manager`：Git 操作与版本管理
- `context-manager`：维护项目事实库，防止幻觉

## 示例交互
用户："请实现一个登录页面"
你（正确）：
调用 Agent 工具，subagent_type: "ui-builder"，prompt: "创建一个登录页面，包含手机号输入、验证码按钮、登录按钮。使用 Ant Design Form 和 Tailwind 居中布局。输出到 src/renderer/pages/Login.tsx"

你（错误）：
直接输出 `<form>...</form>` 代码 —— **禁止**

## 注意
- 永远不要输出代码块、配置文件内容或命令行脚本。
- 永远不要使用 `Write`、`Edit` 等工具修改代码文件 —— 这些只允许 Subagent 使用。
- 如果你不确定该调用哪个 Agent，请询问用户。
- 如果用户要求直接写代码，请回复："根据项目规则，我无法直接编写代码。请允许我调用对应的 Subagent：我建议使用 [agent-name] 来完成这个任务。是否继续？"

## 允许的直接操作
以下操作允许你直接执行（不涉及代码编写）：
- `Read` 工具：读取文件内容
- `Bash` 工具：执行 `git status`、`git log`、`git fetch` 等只读命令
- 向用户提问、汇总结果、解释概念

---

## Git Workflow (IMPORTANT)

**每次开始开发前必须遵循以下流程：**

1. **读取分支状态**: 先运行 `git status` 和 `git log --oneline -5` 了解当前分支状态
2. **检查远程更新**: 运行 `git fetch origin` 获取远程最新状态
3. **基于分支开发**: 在当前分支基础上继续开发，或创建新功能分支
4. **推送进度**: 每完成一个功能点或修复，立即提交并推送到远程分支
5. **新功能新分支**: 开始新功能开发时，从 main 创建新的 feature 分支

**分支命名规范**:
- `feature/xxx` - 新功能开发
- `fix/xxx` - Bug 修复
- `refactor/xxx` - 代码重构

## 提交前检查 (IMPORTANT)

**每次提交前必须执行以下检查：**

1. **Lint 检查**: 运行 `pnpm lint` 确保代码无错误
2. **类型检查**: 运行 `pnpm build` 或 TypeScript 检查确保无类型错误
3. **功能验证**: 启动开发服务器 `pnpm dev` 验证功能正常运行
4. **样式验证**: 检查 Tailwind CSS 和 CSS 样式是否正确显示，确保 UI 渲染符合预期
5. **修复问题**: 如有报错，先修复再提交
6. **推送分支**: 所有检查通过后，再提交并推送到远程分支

---

# Macto - Voice & Screen Sharing Application

## Project Overview

Macto is a cross-platform real-time voice and screen sharing application built with Electron, React, and TypeScript. It features a macOS-inspired design system that works consistently across Windows, Linux, and macOS.

## Tech Stack

- **Framework**: React 19+ (Function Components + Hooks)
- **Type System**: TypeScript strict mode (`strict: true`)
- **Styling**: Tailwind CSS (custom macOS-style design system)
- **HTTP Client**: Axios
- **Desktop Shell**: Electron (via electron-vite)
- **Package Manager**: pnpm
- **State Management**: Zustand
- **UI Primitives**: Radix UI (to be integrated) + custom Tailwind styles
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier + Husky

## Key Commands

```bash
# Install dependencies
pnpm install

# Start dev environment (renderer + main process hot reload)
pnpm dev

# Build production version
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

## Architecture

### Project Structure

```
src/
├── main/                # Electron main process
│   ├── index.ts         # Entry point, window management, tray
│   ├── ipc/             # IPC communication modules
│   └── utils/           # Main process utilities
├── preload/             # Preload script (contextBridge)
│   └── index.ts
├── renderer/            # Renderer process (React app)
│   ├── components/      # Reusable components
│   │   ├── ui/          # Base UI components (Radix + Tailwind)
│   │   └── layout/      # Layout components (sidebar, header, content)
│   ├── features/        # Feature modules (by domain)
│   │   ├── session/     # Session management
│   │   ├── voice/       # Voice capture & transmission
│   │   ├── screen/      # Screen sharing & control
│   │   └── settings/    # Settings
│   ├── hooks/           # Custom hooks
│   ├── stores/          # Zustand state stores
│   ├── styles/          # Global styles, theme variables
│   ├── utils/           # Utility functions
│   ├── App.tsx
│   └── main.tsx
├── shared/              # Shared types & constants
│   ├── types/           # Interface/type definitions
│   └── constants.ts
└── test/                # Test utilities and mocks
```

### State Management

State is managed using multiple Zustand stores, organized by domain:

- `themeStore.ts` - Theme state (light/dark/system)
- `audioStore.ts` - Audio capture, mute, volume, devices
- `screenStore.ts` - Screen sharing state and control permissions
- `sessionStore.ts` - Sessions, participants, active session
- `settingsStore.ts` - User preferences and settings

### IPC Communication

IPC channels and payloads are defined in `shared/types/ipc.ts`. The preload script exposes a safe API to the renderer via `contextBridge`. All IPC calls use `ipcRenderer.invoke()` for request/response patterns.

### Design System

- **Colors**: macOS system colors (systemGray, systemBlue, systemRed, etc.)
- **Typography**: System font stack (SF Pro / Segoe UI / Roboto)
- **Spacing**: 8px grid system
- **Rounded Corners**: `rounded-xl` (12px), `rounded-2xl` (16px)
- **Effects**: Glassmorphism (`backdrop-blur-xl`), subtle shadows

## Development Guidelines

1. **TypeScript Strict Mode**: No `any` types allowed. Use `import type` for type-only imports.

2. **Component Patterns**:
   - Use function components with explicit Props interfaces
   - Wrap stateless UI components with `React.memo`
   - Extract logic into custom hooks
   - Use virtualization for long lists (`@tanstack/react-virtual`)

3. **State Management**:
   - Create domain-specific Zustand stores
   - Avoid large global stores to prevent unnecessary re-renders
   - Use `useMemo`/`useCallback` for expensive computations

4. **Styling**:
   - Prefer Tailwind utility classes
   - Use `cn()` utility for conditional class names
   - Follow 8px spacing grid

5. **Testing**:
   - Unit test utilities, hooks, and stores
   - Component tests using Testing Library
   - Mock IPC calls in tests

## Build Configuration

- `electron-vite.config.ts` - Main/Preload/Renderer entry points
- `vite.config.ts` - Renderer build config
- `tailwind.config.ts` - Tailwind with macOS color palette
- `tsconfig.json` - Strict TypeScript with path aliases

## Path Aliases

- `@main` → `./src/main`
- `@preload` → `./src/preload`
- `@renderer` → `./src/renderer`
- `@shared` → `./src/shared`

## Current Implementation Status

### Completed Components
- **UI Components**: Button, Input, Card, Badge, Tooltip, Modal
- **Layout Components**: Sidebar, Header, Content, Container, Grid
- **Stores**: themeStore, audioStore, screenStore, sessionStore, settingsStore, authStore, chatStore, serverStore
- **Hooks**: useTheme, useAudio, useScreen, useSession, useSettings, useAuth, useUserStatusPolling, useRoomWebSocket
- **IPC Manager**: IPCManager class for main process communication
- **Services**: apiClient, authService, roomService, chatService, uploadService, voiceService, screenShareService, webrtcService, websocketService

### Completed Feature Modules
- **Session**: SessionList, CreateSessionModal, JoinSessionModal
- **Voice**: VoiceSettings (audio controls, device selection, mic test)
- **Screen**: ScreenControl (screen sharing controls, preview, quality settings)
- **Settings**: SettingsGeneral, SettingsAudio, SettingsProfile, SettingsNotifications, SettingsVideo
- **Tray**: System tray icon with platform-specific support (macOS/Windows/Linux)
- **Auto-Update**: electron-updater integration with update notifications

### Future Enhancements
- Production-ready tray icon assets (replace placeholders with designed icons)
- Configure GitHub repository for auto-updater publish settings
