# Macto Architecture Design v2.0

## Document Information
- **Version**: 2.0
- **Date**: 2026-05-27
- **Status**: Draft - For Review
- **Author**: Claude Code (Architect)

---

## 1. Executive Summary

This document provides a comprehensive architecture design for Macto, a cross-platform real-time voice and screen sharing application. The design addresses current technical debt, optimizes performance, and establishes clear module boundaries for future extensibility.

**Key Decisions**:
1. **Consolidate store architecture** - Merge 11+ stores into 4 domain-centric stores with EventBus coordination
2. **Introduce service layer** - Decouple API calls from stores for testability and maintainability
3. **Refactor IPC architecture** - Replace monolithic IPCManager with modular IPC handlers
4. **Establish WebRTC abstraction** - Create a dedicated WebRTC manager with proper lifecycle management
5. **Implement plugin system** - Design extensible architecture for future features

---

## 2. Frontend Architecture Optimization

### 2.1 Current State Analysis

**Problems Identified**:
- 11+ Zustand stores with implicit dependencies (e.g., `useRoomWebSocket` depends on 5 stores)
- Deprecated stores still in use (`authStore.ts` re-exports from `userDomainStore`)
- Components directly accessing stores, creating tight coupling
- No clear separation between UI state and domain state
- EventBus exists but is underutilized

### 2.2 Proposed Store Architecture (4 + 1 Pattern)

```
stores/
├── core/                          # Core infrastructure
│   ├── eventBus.ts               # Type-safe event bus (existing)
│   ├── storeRegistry.ts          # Store lifecycle management
│   └── syncEngine.ts             # Cross-store synchronization
├── domains/                      # Domain-centric stores
│   ├── userDomainStore.ts        # Auth, user profiles, preferences
│   ├── contentDomainStore.ts     # Chat, messages, playlists
│   ├── roomDomainStore.ts        # Rooms, participants, sessions
│   └── mediaDomainStore.ts     # Voice, screen, WebRTC state
└── ui/                           # UI-specific state
    └── uiStateStore.ts           # Modals, toasts, navigation, layout
```

**Store Consolidation Map**:

| Current Stores | New Store | Responsibility |
|----------------|-----------|----------------|
| `authStore` + `settingsStore` (user prefs) | `userDomainStore` | Auth, user data, user preferences |
| `chatStore` + `playlistStore` | `contentDomainStore` | Messages, chat, playlists |
| `roomStore` + `serverStore` | `roomDomainStore` | Rooms, participants, server state |
| `voiceStore` + `mediaStore` + `screenStore` | `mediaDomainStore` | Voice, screen, WebRTC streams |
| `themeStore` + `layoutStore` + `websocketStore` | `uiStateStore` | UI state, theme, layout, modals |

### 2.3 Store Interface Design

```typescript
// Domain Store Pattern
interface DomainStore<TState, TActions> {
  // State
  getState(): TState;
  subscribe(listener: (state: TState) => void): () => void;

  // Actions
  actions: TActions;

  // Lifecycle
  reset(): void;
  dispose(): void;
}

// User Domain Store
interface UserDomainState {
  // Auth
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;

  // User
  currentUser: User | null;
  userProfile: UserProfile | null;

  // Preferences
  preferences: UserPreferences;
}

interface UserDomainActions {
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
  refreshToken(): Promise<void>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
  updatePreferences(preferences: Partial<UserPreferences>): void;
}
```

### 2.4 EventBus Integration Pattern

```typescript
// Cross-domain communication via EventBus
// Store A emits event -> EventBus -> Store B listens

// Example: User logs out -> Clear all domain data
// userDomainStore.ts
function logout() {
  // Clear user state
  set({ isAuthenticated: false, currentUser: null });

  // Emit event for other domains
  eventBus.emit('user:logout');
}

// roomDomainStore.ts
useEventBus('user:logout', () => {
  // Clear room state
  roomDomainStore.getState().actions.leaveAllRooms();
});

// contentDomainStore.ts
useEventBus('user:logout', () => {
  // Clear chat state
  contentDomainStore.getState().actions.clearAllMessages();
});
```

### 2.5 Component Architecture

```
components/
├── ui/                           # Base UI primitives (Button, Input, Modal)
│   ├── primitives/              # Atomic components
│   └── composite/               # Composite components
├── features/                     # Feature-specific components
│   ├── auth/
│   ├── chat/
│   ├── voice/
│   ├── screen/
│   └── settings/
├── layout/                       # Layout components
│   ├── MainLayout.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
└── providers/                    # Context providers
    ├── AppProviders.tsx
    ├── WebSocketProvider.tsx
    └── WebRTCProvider.tsx
```

**Component Rules**:
1. UI primitives never access stores directly
2. Feature components access only their own domain store
3. Layout components can access multiple stores (coordinator role)
4. Use `React.memo` for all list items and heavy components
5. Use `useCallback` for all event handlers passed to children

### 2.6 Performance Optimizations

```typescript
// 1. Selective state subscription
// BAD: Subscribes to entire store
const { user, rooms, messages } = useStore();

// GOOD: Subscribe only to what you need
const user = useUserStore(state => state.currentUser);
const roomCount = useRoomStore(state => state.rooms.length);

// 2. Memoized selectors
const selectRoomParticipants = useCallback(
  (state: RoomState) => state.participants[state.currentRoomId] || [],
  []
);
const participants = useRoomStore(selectRoomParticipants);

// 3. Virtualized lists for chat messages
import { useVirtualizer } from '@tanstack/react-virtual';

function ChatMessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  // ...
}

// 4. Code splitting for feature modules
const VoiceChat = lazy(() => import('./features/voice/VoiceChat'));
const ScreenShare = lazy(() => import('./features/screen/ScreenShare'));
```

---

## 3. Electron Main Process Architecture

### 3.1 Current State Analysis

**Problems Identified**:
- Monolithic `IPCManager` class with 260 lines handling all IPC
- Mixed concerns: session, voice, screen, audio, system in one class
- No separation between window management and business logic
- Tray logic inline in main process
- No dependency injection or plugin architecture

### 3.2 Proposed Main Process Architecture

```
src/main/
├── index.ts                      # Entry point, app lifecycle
├── window/
│   ├── WindowManager.ts         # Window creation, management
│   ├── WindowState.ts            # Window state persistence
│   └── types.ts
├── ipc/
│   ├── registry.ts               # IPC handler registry
│   ├── types.ts                  # IPC channel definitions
│   ├── handlers/
│   │   ├── SessionHandler.ts
│   │   ├── VoiceHandler.ts
│   │   ├── ScreenHandler.ts
│   │   ├── AudioHandler.ts
│   │   ├── SystemHandler.ts
│   │   └── UpdateHandler.ts
│   └── IPCManager.ts             # Refactored manager
├── services/
│   ├── TrayService.ts            # System tray management
│   ├── UpdateService.ts           # Auto-update logic
│   ├── NotificationService.ts     # Desktop notifications
│   └── HardwareAcceleration.ts    # GPU settings
├── plugins/
│   └── PluginRegistry.ts         # Plugin system (Phase 3)
└── utils/
    ├── protocol.ts              # Custom protocol handlers
    └── security.ts              # Security policies
```

### 3.3 IPC Handler Registry Pattern

```typescript
// ipc/registry.ts
export interface IPCHandler {
  register(): void;
  unregister(): void;
}

export class IPCHandlerRegistry {
  private handlers = new Map<string, IPCHandler>();

  register(name: string, handler: IPCHandler): void {
    if (this.handlers.has(name)) {
      console.warn(`Handler ${name} already registered, skipping`);
      return;
    }
    handler.register();
    this.handlers.set(name, handler);
  }

  unregister(name: string): void {
    const handler = this.handlers.get(name);
    if (handler) {
      handler.unregister();
      this.handlers.delete(name);
    }
  }

  unregisterAll(): void {
    for (const [name, handler] of this.handlers) {
      handler.unregister();
    }
    this.handlers.clear();
  }
}

// ipc/handlers/SessionHandler.ts
export class SessionHandler implements IPCHandler {
  constructor(private window: BrowserWindow) {}

  register(): void {
    ipcMain.handle('session:create', this.handleCreate.bind(this));
    ipcMain.handle('session:join', this.handleJoin.bind(this));
    ipcMain.handle('session:leave', this.handleLeave.bind(this));
    ipcMain.handle('session:list', this.handleList.bind(this));
  }

  unregister(): void {
    ipcMain.removeHandler('session:create');
    ipcMain.removeHandler('session:join');
    ipcMain.removeHandler('session:leave');
    ipcMain.removeHandler('session:list');
  }

  private async handleCreate(event: IpcMainInvokeEvent, payload: IPCPayloads['session:create']) {
    const sessionId = crypto.randomUUID();
    this.window.webContents.send('session:created', { sessionId, name: payload.name });
    return { sessionId };
  }

  // ...
}
```

### 3.4 Tray Service Architecture

```typescript
// services/TrayService.ts
export class TrayService {
  private tray: Tray | null = null;
  private window: BrowserWindow;

  constructor(window: BrowserWindow) {
    this.window = window;
  }

  create(): void {
    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setContextMenu(this.buildContextMenu());
    this.tray.setIgnoreDoubleClickEvents(true);
    this.setupEventListeners();
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  updateBadge(count: number): void {
    // Platform-specific badge update
    if (process.platform === 'darwin') {
      app.setBadgeCount(count);
    }
    // Windows: Update tray icon overlay
  }

  private createTrayIcon(): NativeImage {
    // Platform-specific icon creation
    // ...
  }

  private buildContextMenu(): Menu {
    return Menu.buildFromTemplate([
      {
        label: 'Open Macto',
        click: () => this.showWindow(),
      },
      { type: 'separator' },
      {
        label: 'Mute Microphone',
        type: 'checkbox',
        click: (menuItem) => {
          // Emit to renderer
          this.window.webContents.send('tray:mute-toggled', menuItem.checked);
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ]);
  }

  private showWindow(): void {
    if (this.window.isMinimized()) this.window.restore();
    this.window.show();
    this.window.focus();
  }
}
```

---

## 4. WebRTC and Real-Time Communication Architecture

### 4.1 Current State Analysis

**Problems Identified**:
- WebRTC logic scattered between `voiceService` and stores
- No centralized WebRTC manager
- Manual SDP handling and ICE candidate management
- No graceful degradation for network changes
- Screen sharing mixed with voice WebRTC

### 4.2 Proposed WebRTC Architecture

```
src/renderer/
├── webrtc/
│   ├── manager/
│   │   ├── WebRTCManager.ts        # Main orchestrator
│   │   └── types.ts
│   ├── connection/
│   │   ├── PeerConnection.ts       # RTCPeerConnection wrapper
│   │   └── ConnectionPool.ts       # Manages multiple connections
│   ├── signaling/
│   │   ├── SignalingClient.ts      # WebSocket signaling abstraction
│   │   └── handlers/
│   ├── media/
│   │   ├── MediaManager.ts         # getUserMedia/getDisplayMedia
│   │   ├── AudioProcessor.ts       # Audio processing (noise gate, etc.)
│   │   └── VideoProcessor.ts       # Video processing (resize, etc.)
│   └── stats/
│       └── StatsReporter.ts        # WebRTC stats collection
```

### 4.3 WebRTC Manager Design

```typescript
// webrtc/manager/WebRTCManager.ts
interface WebRTCManagerOptions {
  signaling: SignalingClient;
  iceServers: RTCIceServer[];
  onTrack: (stream: MediaStream, userId: string) => void;
  onConnectionStateChange: (userId: string, state: RTCPeerConnectionState) => void;
}

export class WebRTCManager {
  private connections = new Map<string, PeerConnection>();
  private mediaManager: MediaManager;
  private signaling: SignalingClient;

  constructor(options: WebRTCManagerOptions) {
    this.signaling = options.signaling;
    this.mediaManager = new MediaManager();
    this.setupSignalingHandlers();
  }

  // Join voice channel in a room
  async joinVoice(roomId: number): Promise<void> {
    const stream = await this.mediaManager.getMicrophoneStream();
    // Get existing participants from signaling server
    const participants = await this.signaling.getParticipants(roomId);

    // Create peer connections for each participant
    for (const participant of participants) {
      await this.createPeerConnection(participant.id, 'offer');
    }
  }

  // Leave voice channel
  async leaveVoice(): Promise<void> {
    for (const [userId, connection] of this.connections) {
      await this.closeConnection(userId);
    }
    this.mediaManager.releaseAll();
  }

  // Start screen sharing
  async startScreenShare(): Promise<MediaStream> {
    const stream = await this.mediaManager.getScreenStream();
    // Replace video track in all peer connections
    for (const [userId, connection] of this.connections) {
      await connection.replaceVideoTrack(stream.getVideoTracks()[0]);
    }
    return stream;
  }

  // Stop screen sharing
  async stopScreenShare(): Promise<void> {
    const stream = await this.mediaManager.getMicrophoneStream();
    for (const [userId, connection] of this.connections) {
      await connection.replaceVideoTrack(stream.getVideoTracks()[0]);
    }
  }

  private async createPeerConnection(userId: string, role: 'offer' | 'answer'): Promise<PeerConnection> {
    const connection = new PeerConnection({
      iceServers: this.options.iceServers,
      onIceCandidate: (candidate) => {
        this.signaling.sendIceCandidate(userId, candidate);
      },
      onTrack: (stream) => {
        this.options.onTrack(stream, userId);
      },
    });

    this.connections.set(userId, connection);
    return connection;
  }

  private setupSignalingHandlers(): void {
    this.signaling.on('user-joined', async ({ userId }) => {
      await this.createPeerConnection(userId, 'offer');
    });

    this.signaling.on('user-left', async ({ userId }) => {
      await this.closeConnection(userId);
    });

    this.signaling.on('offer', async ({ userId, offer }) => {
      const connection = await this.createPeerConnection(userId, 'answer');
      await connection.setRemoteDescription(offer);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      this.signaling.sendAnswer(userId, answer);
    });

    this.signaling.on('answer', async ({ userId, answer }) => {
      const connection = this.connections.get(userId);
      if (connection) {
        await connection.setRemoteDescription(answer);
      }
    });

    this.signaling.on('ice-candidate', async ({ userId, candidate }) => {
      const connection = this.connections.get(userId);
      if (connection) {
        await connection.addIceCandidate(candidate);
      }
    });
  }

  private async closeConnection(userId: string): Promise<void> {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.close();
      this.connections.delete(userId);
    }
  }
}
```

### 4.4 WebSocket Architecture Improvements

```typescript
// Improved WebSocket with reconnection strategy
interface WebSocketConfig {
  url: string;
  reconnectStrategy: {
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    maxAttempts: number;
  };
  heartbeat: {
    interval: number;
    timeout: number;
  };
}

export class ResilientWebSocket {
  private ws: WebSocket | null = null;
  private reconnectCount = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private messageQueue: unknown[] = [];
  private handlers = new Map<string, Set<(data: unknown) => void>>();

  constructor(private config: WebSocketConfig) {}

  async connect(): Promise<void> {
    // Implementation with exponential backoff
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.messageQueue.push(data);
    }
  }

  // Typed message handling
  on<T>(type: string, handler: (data: T) => void): () => void {
    // ...
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.config.heartbeat.interval);
  }
}
```

---

## 5. Build and Packaging Optimization

### 5.1 Vite Configuration Improvements

```typescript
// electron.vite.config.ts
import { defineConfig } from 'electron-vite'
import path from 'node:path'
import react from '@vite/plugin-react'

export default defineConfig({
  main: {
    build: {
      target: 'node20',
      lib: {
        entry: path.resolve(__dirname, 'src/main/index.ts'),
      },
      outDir: 'out/main',
      sourcemap: true,
      rollupOptions: {
        external: ['electron', 'fsevents'],
        output: {
          // Separate chunks for better caching
          manualChunks: {
            'ipc-handlers': ['./src/main/ipc/handlers/*'],
            'main-services': ['./src/main/services/*'],
          },
        },
      },
    },
  },
  preload: {
    build: {
      target: 'node20',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/preload/index.ts'),
        },
      },
      outDir: 'out/preload',
      sourcemap: true,
    },
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      target: 'chrome120',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/renderer/index.html'),
        },
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            'vendor-react': ['react', 'react-dom'],
            'vendor-antd': ['antd', '@ant-design/icons'],
            'vendor-webrtc': ['webrtc-adapter'], // if added
          },
        },
      },
      outDir: path.resolve(__dirname, 'out/renderer'),
      sourcemap: true,
      // Code minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src/main'),
        '@preload': path.resolve(__dirname, 'src/preload'),
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },
  },
})
```

### 5.2 Electron Builder Configuration

```json
{
  "build": {
    "appId": "com.macto.app",
    "productName": "Macto",
    "directories": {
      "output": "dist"
    },
    "files": [
      "out/**/*",
      "assets/**/*"
    ],
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ],
      "category": "public.app-category.social-networking",
      "icon": "build/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.png",
      "category": "Network"
    },
    "publish": {
      "provider": "github",
      "owner": "your-org",
      "repo": "macto"
    }
  }
}
```

---

## 6. Testing Strategy

### 6.1 Testing Architecture

```
test/
├── unit/                         # Unit tests (no Electron)
│   ├── stores/                  # Zustand store tests
│   ├── services/                # Service layer tests
│   ├── webrtc/                  # WebRTC manager tests (mocked)
│   └── utils/                   # Utility function tests
├── integration/                  # Integration tests
│   ├── ipc/                     # IPC communication tests
│   ├── websocket/               # WebSocket tests
│   └── api/                     # API client tests
├── e2e/                            # End-to-end tests
│   ├── auth/                    # Authentication flows
│   ├── voice/                   # Voice chat flows
│   ├── screen/                  # Screen sharing flows
│   └── settings/                # Settings flows
└── fixtures/                       # Test data
```

### 6.2 Unit Testing Pattern

```typescript
// stores/__tests__/userDomainStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createUserDomainStore } from '../userDomainStore'
import { authService } from '../../services/authService'

// Mock services
vi.mock('../../services/authService')

describe('UserDomainStore', () => {
  let store: ReturnType<typeof createUserDomainStore>

  beforeEach(() => {
    store = createUserDomainStore()
  })

  it('should set isAuthenticated on successful login', async () => {
    const mockLogin = vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'test-token',
      user: { id: '1', username: 'test' },
    })

    await store.getState().actions.login({ username: 'test', password: 'pass' })

    expect(store.getState().isAuthenticated).toBe(true)
    expect(store.getState().currentUser).toEqual({ id: '1', username: 'test' })
  })

  it('should clear state on logout', async () => {
    store.setState({
      isAuthenticated: true,
      currentUser: { id: '1', username: 'test' },
    })

    await store.getState().actions.logout()

    expect(store.getState().isAuthenticated).toBe(false)
    expect(store.getState().currentUser).toBeNull()
  })
})
```

### 6.3 E2E Testing Pattern

```typescript
// e2e/voice.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Voice Chat', () => {
  test('user can join and leave voice channel', async ({ page }) => {
    // Login
    await page.goto('/')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-button"]')

    // Join a room
    await page.click('[data-testid="room-1"]')

    // Join voice
    await page.click('[data-testid="join-voice-button"]')
    await expect(page.locator('[data-testid="voice-status"]')).toHaveText('Connected')

    // Mute
    await page.click('[data-testid="mute-button"]')
    await expect(page.locator('[data-testid="mute-button"]')).toHaveClass(/muted/)

    // Leave voice
    await page.click('[data-testid="leave-voice-button"]')
    await expect(page.locator('[data-testid="voice-status"]')).toHaveText('Disconnected')
  })
})
```

---

## 7. Code Organization and Module Boundaries

### 7.1 Module Dependency Rules

```
// Dependency direction (top can depend on bottom):
// UI Components -> Feature Components -> Domain Stores -> Services -> Utils
//                                              |
//                                              v
//                                         EventBus (shared)

// Strict rules:
// 1. UI primitives cannot import from stores or services
// 2. Feature components can only import from their own domain store
// 3. Domain stores can import from services and EventBus
// 4. Services can import from utils and types
// 5. No circular dependencies
```

### 7.2 Import Patterns

```typescript
// Absolute imports with path aliases
// GOOD:
import { useUserStore } from '@renderer/stores/userDomainStore'
import { apiClient } from '@renderer/services/apiClient'
import type { User } from '@shared/types/user'

// BAD:
import { useUserStore } from '../../../stores/userDomainStore'
import { apiClient } from '../../../services/apiClient'
```

### 7.3 Module Boundary Enforcement

Use ESLint to enforce module boundaries:

```json
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/renderer/components/ui",
            "from": "./src/renderer/stores",
            "message": "UI primitives cannot import from stores"
          },
          {
            "target": "./src/renderer/features/**/!(*.test).ts",
            "from": "./src/renderer/features/[^/]+/stores/!(*.test).ts",
            "message": "Features can only import from their own domain store"
          }
        ]
      }
    ]
  }
}
```

---

## 8. Future Extensibility

### 8.1 Plugin System Design

```typescript
// Plugin architecture for extensibility
interface MactoPlugin {
  id: string;
  name: string;
  version: string;

  // Lifecycle hooks
  onInstall(): void | Promise<void>;
  onUninstall(): void | Promise<void>;
  onActivate(): void | Promise<void>;
  onDeactivate(): void | Promise<void>;

  // UI contributions
  registerComponents(): PluginComponent[];
  registerSettings(): PluginSetting[];
  registerCommands(): PluginCommand[];

  // API contributions
  registerAPIHandlers(): APIHandler[];
}

interface PluginRegistry {
  install(plugin: MactoPlugin): Promise<void>;
  uninstall(pluginId: string): Promise<void>;
  getPlugin(pluginId: string): MactoPlugin | undefined;
  getAllPlugins(): MactoPlugin[];
}
```

### 8.2 Internationalization (i18n)

```typescript
// i18n setup
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: require('./locales/en.json') },
    zh: { translation: require('./locales/zh.json') },
    ja: { translation: require('./locales/ja.json') },
  },
  lng: 'zh',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})
```

### 8.3 Theme Customization

```typescript
// Theme system with CSS variables
interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    family: string;
    size: {
      small: string;
      medium: string;
      large: string;
    };
  };
  spacing: {
    unit: number;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
}

// Theme application
function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}
```

---

## 9. Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Consolidate stores (11 -> 4 + 1)
- [ ] Implement EventBus integration
- [ ] Refactor IPC handlers to modular pattern
- [ ] Add store unit tests

### Phase 2: WebRTC Refactor (Weeks 3-4)
- [ ] Create WebRTCManager abstraction
- [ ] Separate voice and screen WebRTC logic
- [ ] Implement connection pooling
- [ ] Add WebRTC stats collection
- [ ] Add WebRTC integration tests

### Phase 3: Performance & Polish (Weeks 5-6)
- [ ] Implement code splitting
- [ ] Add virtualized lists
- [ ] Optimize bundle size
- [ ] Add E2E tests
- [ ] Performance profiling and optimization

### Phase 4: Extensibility (Weeks 7-8)
- [ ] Implement plugin system
- [ ] Add i18n support
- [ ] Create theme marketplace
- [ ] Documentation and developer guides

---

## 10. Constraints Checklist

- [x] All IPC uses contextBridge (no direct Node.js exposure)
- [x] Cross-platform compatibility verified
- [x] Audio encoding: Opus codec specified
- [x] Video encoding: H.264 specified
- [x] React 18+ with Zustand for state management
- [x] TypeScript strict mode compatible
- [x] Electron security guidelines followed

---

## Appendix: Directory Structure (Target)

```
macto/
├── src/
│   ├── main/                     # Electron main process
│   │   ├── index.ts             # Entry point
│   │   ├── window/              # Window management
│   │   ├── ipc/                 # IPC handlers (modular)
│   │   ├── services/            # Main process services
│   │   └── utils/               # Utilities
│   ├── preload/                  # Preload scripts
│   │   └── index.ts             # contextBridge API
│   ├── renderer/                 # React application
│   │   ├── components/          # UI components
│   │   │   ├── ui/              # Base primitives
│   │   │   ├── features/        # Feature components
│   │   │   └── layout/          # Layout components
│   │   ├── stores/              # Zustand stores (consolidated)
│   │   │   ├── core/            # EventBus, registry
│   │   │   ├── domains/         # Domain stores
│   │   │   └── ui/              # UI state store
│   │   ├── services/            # API services
│   │   ├── hooks/               # Custom hooks
│   │   ├── webrtc/              # WebRTC manager
│   │   ├── styles/              # Global styles
│   │   ├── utils/               # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── shared/                   # Shared types & constants
│       ├── types/               # TypeScript definitions
│       └── constants.ts
├── test/                         # Test suites
├── electron.vite.config.ts      # Build configuration
├── package.json
└── README.md
```
