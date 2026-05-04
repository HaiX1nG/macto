# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Stores**: themeStore, audioStore, screenStore, sessionStore, settingsStore
- **Hooks**: useTheme, useAudio, useScreen, useSession
- **IPC Manager**: IPCManager class for main process communication

### To Be Implemented
- Session feature module (session list, create/join modals)
- Voice feature module (audio controls, device selection)
- Screen feature module (screen sharing controls)
- Settings feature module (preferences UI)
- Tray icon assets
- Electron auto-updater integration
