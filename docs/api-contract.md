# Macto 后端 API 契约文档

> 本文档由前端代码（`src/renderer/services/*`、`src/shared/types/*`、`src/renderer/hooks/*`、`src/renderer/utils/webrtcManager.ts`）实际调用反推得出，是 Go 后端实现的**对齐基准**。所有字段、路径、消息类型均以代码实际调用为准，未在前端调用的端点不列入。

---

## 1. 概述

### 1.1 基础地址

| 协议 | 用途 | 基址 | 配置来源 |
|------|------|------|----------|
| REST (HTTP) | 业务接口 | `http://localhost:8080/api/v1` | `VITE_API_BASE_URL`（默认 `http://localhost:8080/api/v1`） |
| WebSocket | 实时信令 | `ws://localhost:8080/ws` | `VITE_WS_URL`（默认 `ws://localhost:8080/ws`） |

- `.env` 实际值：`VITE_API_BASE_URL=http://localhost:8080/api/v1`、`VITE_WS_URL=ws://localhost:8080/ws`
- REST 所有路径均为**相对基址**（如 `/auth/login` → `http://localhost:8080/api/v1/auth/login`）。

### 1.2 认证模型

- 方式：**JWT Bearer Token**，请求头 `Authorization: Bearer <accessToken>`。
- 双 Token：`accessToken`（访问令牌）+ `refreshToken`（刷新令牌）。
- 存储位置：浏览器 `localStorage`，键名：
  - `localStorage['accessToken']`
  - `localStorage['refreshToken']`
- 注入：`apiClient` 请求拦截器自动注入 `Authorization` 头。
- **跳过鉴权的端点**（不注入 Bearer，且 401 时不触发刷新）：
  - `POST /auth/login`
  - `POST /auth/register`
  - `POST /auth/refresh`
- 401 自动刷新：见 §2.4。

### 1.3 请求默认头

- `Content-Type: application/json`（除上传接口为 `multipart/form-data`）。
- 超时：**10000ms**（10 秒）。

---

## 2. 统一响应包络与错误约定

### 2.1 成功响应包络 `ApiResponse<T>`

所有 REST 接口（含上传）统一返回如下结构：

```ts
interface ApiResponse<T> {
  code: number      // 业务状态码，成功时通常为 0 或 200（后端自定，前端不依赖具体值判定成功）
  message: string   // 描述信息
  data: T           // 业务数据载荷
}
```

- HTTP 状态码 2xx 视为成功。
- 前端 `apiClient` 的 `get/post/put/delete` 统一**返回 `response.data.data`**（即直接解包出 `data` 字段），调用方拿到的就是 `T`。
- 列表接口可能返回**数组**或**分页结构**，前端做了兼容（见下）。

### 2.2 分页结构 `PaginatedData<T>`

部分列表接口返回分页包裹（前端兼容两种形态）：

```ts
interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
```

> 前端对 `rooms`、`participants`、`messages` 列表均做了 `Array.isArray(result) ? result : result.list` 的兼容。**建议后端统一返回 `PaginatedData<T>`**；但若直接返回数组也可被接受。

### 2.3 错误响应

错误时后端返回的 body 仍为 `ApiResponse<unknown>` 形态（至少含 `code`、`message`）。前端按以下优先级提取错误信息：

1. `response.data.message`（首选）
2. `response.data.error`
3. `response.data.msg`
4. HTTP 状态文本兜底

前端错误对象 `ApiClientError`：

```ts
class ApiClientError extends Error {
  readonly statusCode: number    // HTTP 状态码；网络错误为 0
  readonly businessCode?: number // 取自响应体 ApiResponse.code
  readonly errorData?: unknown   // 原始响应体
  readonly message: string
}
```

### 2.4 401 自动刷新流程

1. 任意非鉴权端点收到 401 → 检查 `refreshToken` 是否存在且未在刷新中。
2. 调用 `POST /auth/refresh`（body `{ refreshToken }`）获取新令牌。
3. 用新 `accessToken` 重放原请求（标记 `_retry`，仅重试一次）。
4. 刷新失败 / 已重试仍 401 → 清除 `localStorage` token → 派发浏览器事件 `window.dispatchEvent(new CustomEvent('auth:logout'))` 触发登出。
5. 鉴权端点（login/register/refresh）的 401 **不触发刷新**，直接抛出错误。

### 2.5 HTTP 状态码语义（前端内置提示）

| 状态码 | 含义 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证 / token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突 |
| 422 | 校验失败 |
| 429 | 限流 |
| 500 | 服务器内部错误 |
| 502 | 网关错误 |
| 503 | 服务不可用 |
| 504 | 网关超时 |
| 0（无响应）| 网络错误（连不上服务器） |

---

## 3. 鉴权域（Auth）

### 3.1 `POST /auth/login` — 登录

> 跳过 Bearer 注入；不触发自动刷新。

请求体：
```ts
interface LoginRequest {
  username: string
  password: string
}
```
响应 `data`：
```ts
interface LoginResponse {
  userId: number
  username: string
  email: string
  avatarUrl: string
  accessToken: string
  refreshToken: string
  expiresIn: number       // token 过期秒数
}
```
示例：
```json
// 请求
{ "username": "alice", "password": "secret" }
// 响应 data
{
  "userId": 1,
  "username": "alice",
  "email": "alice@example.com",
  "avatarUrl": "https://cdn.example.com/u1.png",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

### 3.2 `POST /auth/register` — 注册

> 跳过 Bearer 注入；不触发自动刷新。注册成功后直接返回 `LoginResponse`（含 token，前端自动登录）。

请求体：
```ts
interface RegisterRequest {
  username: string
  password: string
  email: string
}
```
响应 `data`：`LoginResponse`（同 §3.1）。

### 3.3 `POST /auth/refresh` — 刷新令牌

> 由 `apiClient` 拦截器内部调用；跳过 Bearer 注入；不触发刷新。

请求体：
```ts
interface RefreshTokenRequest {
  refreshToken: string
}
```
响应 `data`：
```ts
interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```

---

## 4. 用户域（User）

> 来源：`authService`。注意：`authStore` 中的 `login/register/fetchUserInfo` 当前为 **mock 实现（TODO 待接真实接口）**，但 `authService` 已封装好真实端点，下表为契约基准。

| 方法 | 路径 | 请求 | 响应 `data` | 说明 |
|------|------|------|-------------|------|
| GET | `/user/info` | — | `UserInfoResponse` | 获取当前登录用户信息 |
| PUT | `/user/profile` | `UpdateProfileRequest` | `UserInfoResponse` | 更新资料 |
| PUT | `/user/password` | `ChangePasswordRequest` | `void` | 修改密码 |
| PUT | `/user/status` | `SetCustomStatusRequest` | `void` | 设置自定义状态 |
| GET | `/users/{userId}/online` | — | `UserOnlineStatusResponse` | 查询指定用户在线状态 |
| GET | `/users/{userId}/info` | — | `UserInfoResponse` | 按 ID 查询用户信息 |
| DELETE | `/user/account` | — | `void` | 注销账户 |

类型定义：

```ts
interface UserInfoResponse {
  userId: number
  username: string
  email: string
  avatarUrl: string
  isOnline: boolean
  customStatus: string
  createdAt: string      // ISO 时间字符串
}

interface UpdateProfileRequest {
  username?: string
  email?: string
  avatarUrl?: string
}

interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

interface SetCustomStatusRequest {
  customStatus?: string
}

interface UserOnlineStatusResponse {
  userId: number
  username: string
  isOnline: boolean
  customStatus: string
  lastSeenAt?: string
}
```

### 4.1 用户状态轮询

- 端点：`GET /user/info`（复用当前用户信息接口）。
- 触发：`useUserStatusPolling` hook，登录后每 **30000ms（30 秒）** 轮询一次。
- 说明：当前 `authStore.fetchUserInfo()` 仍为 mock，接通后端后即对应 `GET /user/info`。

---

## 5. 房间域（Room）

> 来源：`roomService`。

| 方法 | 路径 | 请求 | 响应 `data` | 说明 |
|------|------|------|-------------|------|
| GET | `/rooms` | query: `RoomListRequest` | `RoomInfoResponse[]` \| `PaginatedData<RoomInfoResponse>` | 房间列表（兼容两种） |
| GET | `/rooms/public` | query: `RoomListRequest` | `RoomInfoResponse[]` \| `PaginatedData<RoomInfoResponse>` | 公开房间列表 |
| GET | `/rooms/{roomId}` | — | `RoomInfoResponse` | 房间详情 |
| POST | `/rooms` | `CreateRoomRequest` | `RoomInfoResponse` | 创建房间 |
| POST | `/rooms/join/{roomId}` | `JoinRoomRequest?` | `RoomInfoResponse` | 加入房间 |
| POST | `/rooms/leave/{roomId}` | — | `void` | 离开房间 |
| GET | `/rooms/{roomId}/participants` | — | `ParticipantResponse[]` \| `PaginatedData<ParticipantResponse>` | 房间参与者列表 |
| DELETE | `/rooms/{roomId}` | — | `void` | 删除房间 |
| POST | `/rooms/{roomId}/kick/{userId}` | — | `void` | 踢出成员 |
| PUT | `/rooms/{roomId}/participants/{userId}/role` | `{ role: number }` | `void` | 设置成员角色 |

类型定义：

```ts
type RoomType = 1 | 2          // 1: 文字聊天房, 2: 语音房
type ParticipantRole = 1 | 2 | 3 // 1: 房主, 2: 管理员, 3: 普通用户

interface RoomListRequest {
  page?: number
  pageSize?: number
  roomType?: RoomType
}

interface CreateRoomRequest {
  roomName: string
  roomType: RoomType
  isPrivate: boolean
  maxParticipants?: number
}

interface JoinRoomRequest {
  inviteCode?: string
}

interface RoomInfoResponse {
  id: number
  roomName: string
  roomType: RoomType
  hostUserId: number
  isPrivate: boolean
  inviteCode?: string
  maxParticipants: number
  currentPlaylistItemId?: number
  participantCount: number
  createdAt: string
}

interface ParticipantResponse {
  userId: number
  username: string
  avatarUrl: string
  role: ParticipantRole
  isMuted: boolean
  isScreenSharing: boolean
  joinedAt: string
}
```

---

## 6. 聊天域（Chat）

> 来源：`chatService`。

| 方法 | 路径 | 请求 | 响应 `data` | 说明 |
|------|------|------|-------------|------|
| GET | `/rooms/{roomId}/messages` | query: `MessageListRequest` | `MessageResponse[]` \| `PaginatedData<MessageResponse>` | 历史消息 |
| POST | `/rooms/{roomId}/messages` | `SendMessageRequest` | `MessageResponse` | 发送消息 |
| PUT | `/rooms/{roomId}/messages/{messageId}` | `{ content: string }` | `MessageResponse` | 编辑消息 |
| DELETE | `/rooms/{roomId}/messages/{messageId}` | — | `void` | 删除消息 |
| GET | `/messages/search` | query: `SearchMessagesRequest` | `SearchMessagesResponse` | 搜索消息 |

类型定义：

```ts
type MessageType = 1 | 2 | 3  // 1: 文本, 2: 图片, 3: 系统

interface MessageListRequest {
  page?: number
  pageSize?: number
}

interface SendMessageRequest {
  messageType: MessageType
  content: string
}

interface MessageResponse {
  id: number
  roomId: number
  senderUserId: number
  senderName: string
  messageType: MessageType
  content: string
  createdAt: string
}

interface SearchMessagesRequest {
  query: string
  roomId?: number
  page?: number
  pageSize?: number
}

interface SearchMessagesResponse {
  messages: MessageResponse[]
  total: number
}
```

---

## 7. 上传域（Upload）

> 来源：`uploadService`。**注意：此接口不走 `apiClient`，直接用 `fetch`**，需手动注入 `Authorization: Bearer <accessToken>`（从 `apiClient.getAccessToken()` 取），且需处理 `ApiResponse` 解包（取 `result.data`）。

| 方法 | 路径 | Content-Type | 字段 | 响应 `data` |
|------|------|--------------|------|-------------|
| POST | `/upload` | `multipart/form-data` | `file`（单文件） | `UploadResponse` |

完整 URL：`POST http://localhost:8080/api/v1/upload`

```ts
interface UploadResponse {
  url: string
  filename: string
  size: number
  type: 'image' | 'video' | 'audio' | 'file'
}
```

前端约束：
- `uploadImage`：仅 `image/*`，上限 **10MB**。
- `uploadAttachment`：任意文件，上限 **50MB**。
- 未登录（无 accessToken）直接抛错 `"未登录"`。

请求示例：
```
POST /api/v1/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="file"; filename="a.png"
Content-Type: image/png

<binary>
------WebKitFormBoundary...--
```

---

## 8. 播放列表域（Playlist）

> 来源：`playlistService`。

| 方法 | 路径 | 请求 | 响应 `data` | 说明 |
|------|------|------|-------------|------|
| GET | `/rooms/{roomId}/playlist` | — | `PlaylistItemResponse[]` | 获取播放列表 |
| POST | `/rooms/{roomId}/playlist` | `AddPlaylistItemRequest` | `PlaylistItemResponse` | 添加曲目 |
| DELETE | `/rooms/{roomId}/playlist/{itemId}` | — | `void` | 移除曲目 |
| POST | `/rooms/{roomId}/playlist/play` | — | `void` | 播放 |
| POST | `/rooms/{roomId}/playlist/pause` | — | `void` | 暂停 |
| POST | `/rooms/{roomId}/playlist/skip` | — | `void` | 跳过当前 |
| POST | `/rooms/{roomId}/playlist/reorder` | `ReorderPlaylistRequest` | `void` | 重排序 |

类型定义：

```ts
type PlaylistItemStatus = 1 | 2 | 3  // 1: 待播放, 2: 播放中, 3: 已播放

interface AddPlaylistItemRequest {
  title: string
  artist?: string
  musicUrl: string
  duration?: number
}

interface PlaylistItemResponse {
  id: number
  title: string
  artist: string
  musicUrl: string
  duration: number
  playOrder: number
  status: PlaylistItemStatus
  addedBy: number
}

interface ReorderPlaylistRequest {
  itemIds: number[]
}
```

---

## 9. 语音 / 屏幕 / WebRTC 信令域

### 9.1 语音（Voice）REST — `voiceService`

| 方法 | 路径 | 请求 | 响应 `data` | 说明 |
|------|------|------|-------------|------|
| POST | `/rooms/{roomId}/voice/join` | — | `VoiceSessionResponse` | 加入语音 |
| POST | `/rooms/{roomId}/voice/leave` | — | `void` | 离开语音 |
| GET | `/rooms/{roomId}/voice/participants` | — | `VoiceSessionResponse[]` | 语音参与者 |
| POST | `/rooms/{roomId}/voice/mute` | `{ isMuted: boolean }` | `void` | 静音/取消静音 |

```ts
interface VoiceSessionResponse {
  id: number
  roomId: number
  userId: number
  username: string
  joinedAt: string
}
```

### 9.2 屏幕共享（Screen Share）REST — `screenShareService`

| 方法 | 路径 | 请求 | 响应 `data` | 说明 |
|------|------|------|-------------|------|
| POST | `/rooms/{roomId}/screenshare/start` | — | `ScreenShareResponse` | 开始共享 |
| POST | `/rooms/{roomId}/screenshare/stop` | — | `void` | 停止共享 |
| GET | `/rooms/{roomId}/screenshare` | — | `ScreenShareResponse \| null` | 当前活跃共享 |

```ts
interface ScreenShareResponse {
  id: number
  roomId: number
  userId: number
  username: string
  startedAt: string
}
```

### 9.3 WebRTC 信令 REST — `webrtcService`

| 方法 | 路径 | 请求 | 响应 `data` | 说明 |
|------|------|------|-------------|------|
| POST | `/rooms/{roomId}/webrtc/signal` | `WebRTCSignalRequest` | `void` | 发送 WebRTC 信令（offer/answer/ice） |
| GET | `/rooms/{roomId}/screenshare` | — | `ScreenShareResponse \| null` | 与 §9.2 重复（前端冗余封装） |

```ts
interface WebRTCSignalRequest {
  type: 'offer' | 'answer' | 'ice-candidate'
  targetId?: number    // 目标用户 ID
  payload: string      // 序列化后的 RTCSessionDescription / RTCIceCandidate JSON
}
```

> **注意**：当前前端实际 WebRTC 信令主要通过 **WebSocket** 传输（见 §9.4），REST `/webrtc/signal` 为备用通道。

### 9.4 WebSocket 实时信令协议

#### 9.4.1 连接

- URL 形态：`ws://localhost:8080/ws?token=<accessToken>&room_id=<roomId>`
  - 鉴权：query 参数 `token`（不是 Bearer 头）。
  - 房间上下文：query 参数 `room_id`（数字）。
- 连接时机：用户已认证 + 已进入房间（`currentRoomId` 存在）时由 `useRoomWebSocket` 建立。
- 重连：开启，间隔 **3000ms**，最大尝试 **10 次**。
- 消息队列：未连接时发送的消息会入队，连接成功后自动 flush。

> ⚠️ `useWebSocket` hook 使用的 `createWebSocketConnection()` 会用 `VITE_WS_URL`（`ws://localhost:8080/ws`，无 `?`）再拼接 `&token=`，会产生**畸形 URL**（`ws://localhost:8080/ws&token=...`）。**建议后端对 WS 鉴权同时支持 query `token` 与子协议/首包鉴权**，并容忍无 `room_id` 的连接。生产应以 `useRoomWebSocket` 的 URL 形态为准。

#### 9.4.2 消息包络

```ts
interface WebSocketMessage<T = unknown> {
  type: string        // 消息类型，见下表
  payload: T          // 载荷（部分消息未用 payload 包裹，见标注）
  timestamp?: number
}
```

> ⚠️ **包络不一致**：`new_message`/`participant_update`/`voice_state`/`typing`/`state_sync`/`webrtc_signal` 走 `{ type, payload }` 包络；而 `screen_share_start`/`screen_share_stop`/`audio_share_start`/`audio_share_stop` 把 `userId`/`username` 放在**顶层与 `type` 平级**，未包入 `payload`。后端需按各消息实际结构实现（见下两节）。

#### 9.4.3 Server → Client（前端 `ws.on(...)` 监听）

| `type` | payload 结构 | 处理 |
|--------|--------------|------|
| `new_message` | `NewMessagePayload` | 新消息入聊天列表 + 桌面通知 |
| `participant_update` | `ParticipantUpdatePayload` | 成员加入/离开 |
| `voice_state` | `VoiceStatePayload` | 语音状态（加入/离开/静音/说话） |
| `typing` | `TypingPayload` | 正在输入 |
| `state_sync` | `StateSyncPayload` | 连接后全量状态同步（成员+语音+最近消息） |
| `screen_share` | `ScreenSharePayload` | 屏幕共享事件（前端当前为空处理） |
| `webrtc_signal` | `{ fromUserId, fromUsername, signal }` | WebRTC 信令转发 |
| `screen_share_started` | `{ userId, username }` | 通知：某人开始共享屏幕 |
| `screen_share_stopped` | `{ userId }` | 通知：某人停止共享屏幕 |
| `audio_share_started` | `{ userId, username }` | 通知：某人开始音频分享 |
| `audio_share_stopped` | `{ userId }` | 通知：某人停止音频分享 |

payload 详细定义：

```ts
interface NewMessagePayload {
  id: number
  roomId: number
  senderUserId: number
  senderName: string
  messageType: 1 | 2 | 3   // 1:文本 2:图片 3:系统
  content: string
  createdAt: string
}

interface ParticipantUpdatePayload {
  roomId: number
  action: 'join' | 'leave'
  participant: {
    userId: number
    username: string
    avatarUrl: string
    role: 1 | 2 | 3
    isMuted: boolean
    isScreenSharing: boolean
    joinedAt: string
  }
}

interface VoiceStatePayload {
  roomId: number
  userId: number
  username: string
  action: 'join' | 'leave' | 'mute' | 'unmute' | 'speaking' | 'stopped_speaking'
  isMuted?: boolean
  isSpeaking?: boolean
}

interface TypingPayload {
  roomId: number
  userId: number
  username: string
  isTyping: boolean
}

interface StateSyncPayload {
  roomId: number
  participants: Array<{
    userId: number
    username: string
    avatarUrl: string
    role: 1 | 2 | 3
    isMuted: boolean
    isScreenSharing: boolean
    joinedAt: string
  }>
  voiceParticipants: Array<{
    id: number
    roomId: number
    userId: number
    username: string
    joinedAt: string
  }>
  recentMessages: Array<NewMessagePayload>
}

interface ScreenSharePayload {
  roomId: number
  userId: number
  username: string
  action: 'start' | 'stop'
  screenShareId?: number
}

// webrtc_signal 入站 payload（注意字段名 signal，非 payload）
interface WebrtcSignalInbound {
  fromUserId: number
  fromUsername: string
  signal: WebRTCSignalRequest  // { type, targetId?, payload }
}
```

#### 9.4.4 Client → Server（前端 `ws.send(...)` 发送）

| `type` | 发送结构 | 说明 |
|--------|---------|------|
| `typing` | `{ type:'typing', payload:{ roomId, isTyping } }` | 输入状态（经 `sendTyping`） |
| `webrtc_signal` | `{ type:'webrtc_signal', payload: WebRTCSignalRequest }` | WebRTC offer/answer/ice（`payload` 即 `WebRTCSignalRequest`） |
| `screen_share_start` | `{ type:'screen_share_start', userId, username }` ⚠️顶层 | 开始共享屏幕 |
| `screen_share_stop` | `{ type:'screen_share_stop', userId }` ⚠️顶层 | 停止共享屏幕 |
| `audio_share_start` | `{ type:'audio_share_start', userId, username }` ⚠️顶层 | 开始音频分享 |
| `audio_share_stop` | `{ type:'audio_share_stop', userId }` ⚠️顶层 | 停止音频分享 |

WebRTC 信令 `payload`（即 `WebRTCSignalRequest`）示例：

```json
// offer
{ "type": "webrtc_signal",
  "payload": { "type": "offer", "targetId": 2, "payload": "{\"type\":\"offer\",\"sdp\":\"...\"}" } }
// answer
{ "type": "webrtc_signal",
  "payload": { "type": "answer", "targetId": 2, "payload": "{\"type\":\"answer\",\"sdp\":\"...\"}" } }
// ice-candidate
{ "type": "webrtc_signal",
  "payload": { "type": "ice-candidate", "targetId": 2, "payload": "{\"candidate\":\"...\",\"sdpMid\":\"0\",\"sdpMLineIndex\":0}" } }
```

> 方向总结：客户端 A `webrtc_signal` → 服务端 → 转发为 `webrtc_signal`（含 `fromUserId`/`fromUsername`/`signal`）→ 客户端 B。WebRTC 媒体流走 P2P（STUN：`stun:stun.l.google.com:19302`），服务端仅做信令中转。

---

## 10. 后端缺口清单（前端已调用，需后端实现）

### 10.1 REST 端点

| 域 | 端点 |
|----|------|
| Auth | `POST /auth/login`、`POST /auth/register`、`POST /auth/refresh` |
| User | `GET /user/info`、`PUT /user/profile`、`PUT /user/password`、`PUT /user/status`、`GET /users/{userId}/online`、`GET /users/{userId}/info`、`DELETE /user/account` |
| Room | `GET /rooms`、`GET /rooms/public`、`GET /rooms/{roomId}`、`POST /rooms`、`POST /rooms/join/{roomId}`、`POST /rooms/leave/{roomId}`、`GET /rooms/{roomId}/participants`、`DELETE /rooms/{roomId}`、`POST /rooms/{roomId}/kick/{userId}`、`PUT /rooms/{roomId}/participants/{userId}/role` |
| Chat | `GET /rooms/{roomId}/messages`、`POST /rooms/{roomId}/messages`、`PUT /rooms/{roomId}/messages/{messageId}`、`DELETE /rooms/{roomId}/messages/{messageId}`、`GET /messages/search` |
| Upload | `POST /upload`（multipart） |
| Playlist | `GET /rooms/{roomId}/playlist`、`POST /rooms/{roomId}/playlist`、`DELETE /rooms/{roomId}/playlist/{itemId}`、`POST /rooms/{roomId}/playlist/play`、`POST /rooms/{roomId}/playlist/pause`、`POST /rooms/{roomId}/playlist/skip`、`POST /rooms/{roomId}/playlist/reorder` |
| Voice | `POST /rooms/{roomId}/voice/join`、`POST /rooms/{roomId}/voice/leave`、`GET /rooms/{roomId}/voice/participants`、`POST /rooms/{roomId}/voice/mute` |
| Screen | `POST /rooms/{roomId}/screenshare/start`、`POST /rooms/{roomId}/screenshare/stop`、`GET /rooms/{roomId}/screenshare` |
| WebRTC | `POST /rooms/{roomId}/webrtc/signal` |

### 10.2 WebSocket 消息类型

| 方向 | type |
|------|------|
| S→C | `new_message`、`participant_update`、`voice_state`、`typing`、`state_sync`、`screen_share`、`webrtc_signal`、`screen_share_started`、`screen_share_stopped`、`audio_share_started`、`audio_share_stopped` |
| C→S | `typing`、`webrtc_signal`、`screen_share_start`、`screen_share_stop`、`audio_share_start`、`audio_share_stop` |

### 10.3 待后端澄清/统一的契约点

1. **WS 消息包络不统一**：`screen_share_start/stop`、`audio_share_start/stop` 的 `userId`/`username` 在顶层，其余走 `payload`。建议统一为 `{ type, payload }`，前端需同步调整。
2. **列表接口返回形态**：建议统一返回 `PaginatedData<T>`（`{ list, total, page, pageSize }`），前端兼容数组但分页元信息会丢失。
3. **`ApiResponse.code` 成功值**：前端不依赖其判定成功，但错误时作为 `businessCode` 抛出。后端需定义业务码表并文档化。
4. **WS 鉴权方式**：当前用 query `token`，建议明确过期处理（WS 无自动刷新机制，token 过期会断连，需重连前刷新）。
5. **`authStore` 仍为 mock**：`login/register/fetchUserInfo/changePassword/setCustomStatus/updateProfile` 当前是假数据，接通后端时需直接调用 `authService`（端点已就绪）。

---

## 11. 非功能约定

### 11.1 CORS

- Electron renderer 进程通过 Axios/fetch 直接请求 `http://localhost:8080`，属**跨域**。
- 后端必须允许 Origin：Electron renderer origin（开发期常为 `http://localhost:5173` / `http://localhost:5174`，或 `file://`）。
- 需允许方法：`GET, POST, PUT, DELETE, OPTIONS`；允许头：`Authorization, Content-Type`。
- WebSocket 同源策略：需允许 WS 升级握手。

### 11.2 超时

- REST：`10000ms`。超时后前端抛网络错误（`statusCode=0`）。

### 11.3 WebSocket 重连 / 心跳

- 重连：开启，间隔 **3000ms**，最大 **10 次**；断线后自动重试。
- 状态：`disconnected | connecting | connected | reconnecting | error`。
- **心跳**：前端当前**未实现** ping/pong 心跳。建议后端实现服务端心跳或要求客户端定期 `ping`，并约定空闲超时断连阈值（缺口，见 §10.3）。

### 11.4 WebRTC ICE

- STUN 服务器：`stun:stun.l.google.com:19302`、`stun:stun1.l.google.com:19302`（前端硬编码）。
- 媒体走 P2P；后端仅负责信令转发，不参与媒体面（无 SFU/MCU）。

### 11.5 桌面通知

- 收到 `new_message` 且非当前房间/窗口失焦时，前端经 Electron `electronAPI.sendNotification` 发起系统通知。后端无需关心，仅保证消息及时推送。

---

## 附录：响应包络字段速查

```ts
// 统一包络
interface ApiResponse<T> {
  code: number      // 业务码（错误时为 businessCode）
  message: string
  data: T           // 前端 get/post/put/delete 直接返回此字段
}

// 分页
interface PaginatedData<T> { list: T[]; total: number; page: number; pageSize: number }

// 错误
class ApiClientError extends Error {
  statusCode: number    // HTTP 状态码（网络错误=0）
  businessCode?: number // = ApiResponse.code
  errorData?: unknown   // 原始响应体
}
```
