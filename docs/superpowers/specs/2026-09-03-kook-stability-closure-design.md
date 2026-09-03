# KOOK 稳定性闭环设计（方案 B：最小前后端闭环）

- 设计日期：2026-09-03
- 文档状态：设计阶段；未宣称任何功能、测试、样式、REST、WS、WebRTC 或跨平台运行时已通过
- 适用仓库：前端 `/Users/megumikato/ReactProject/macto`；外部 Go 后端 `/Users/megumikato/GoProject/Gin-macto/server`
- 前端分支：`feature/kook-redesign`
- 后端分支：`feature/kook-redesign`
- 配套账本：`docs/integration-progress.md`
- 契约参考：`docs/api-contract.md`，仅是前端历史推导参考，不是后端认证书

> 本文只规定最小闭环的范围、契约、分批实施、证据和验收方式。本轮只提交本文档；不修改业务代码、测试、配置、`package.json`、`docs/integration-progress.md`、agent memory、settings 或外部 Go 仓库，不推送远程。

## 1. 决策摘要

### 1.1 采用方案

采用“实际 Go 路由/DTO/WS 实现优先，前端最小改动闭环”的方案 B：

1. 以服务器（server）→频道（channel）为唯一当前业务上下文，不恢复旧 room 模型。
2. 以 `/api/v1` 下的真实 server/channel 路由和 `{event, data}` WebSocket 包络为第一实现基准。
3. 保留一个按应用生命周期管理的 WebSocket 连接，通过 `join_channel` / `leave_channel` 订阅当前频道；不通过 `room_id` 绑定连接。
4. 将身份认证、服务器/频道导航、语音媒体、屏幕共享作为 P0 闭环；聊天、好友、通知、成员数据一致性作为 P1 闭环。
5. 只在服务器端已持久化或实时转发后改变前端的权威状态；乐观状态必须有失败回滚或可重试状态。
6. 所有“已验证”结论必须绑定实际运行命令、环境、观察结果和对应证据。静态源码核对、类型检查、lint、单元测试和历史审计均不能单独证明联调或媒体通过。

### 1.2 现状事实与证据等级

本设计建立在 2026-09-03 的只读检查上，事实按以下等级使用：

| 证据等级 | 来源 | 可证明内容 | 不可证明内容 |
|---|---|---|---|
| S0：当前源码/配置静态事实 | 当前前端 checkout、当前 Go checkout 的源码、路由、DTO、`package.json`、`.env` | 文件存在、路径字面量、类型/函数连接、静态安全边界、已声明脚本 | 服务真的启动、响应字段真实、WS 能握手、媒体轨道能传输、codec 已协商 |
| S1：静态检查 | `pnpm lint`、`pnpm build`、`pnpm test`、`gofmt`、`go test` | 对应命令在对应 checkout 的检查结果 | REST/WS/WebRTC/Electron 运行时行为 |
| S2：实际服务证据 | 运行中的 Go 服务、真实 HTTP 请求/响应、真实 WS 握手和事件 | 具体端点/事件/权限/错误在该环境的观察结果 | 另一平台、另一版本、未执行的场景 |
| S3：实际双客户端媒体证据 | 两个真实客户端、SDP/ICE/track/远端渲染/清理观察 | 该平台该版本的 Opus、H.264 或 VP8 及媒体生命周期 | 所有平台和所有网络环境 |

当前检查得到的关键静态事实：

- 前端 `.env` 使用 `http://localhost:8081/api/v1` 和 `ws://localhost:8081/ws`；`apiClient` 的 fallback 也应以当前源码为准。历史 `docs/api-contract.md` 中的 8080、旧 room 路径和部分旧事件只作为差异记录。
- Go router 实际注册 `/api/v1/auth/*`、`/api/v1/user/*`、`/api/v1/servers/*`、`/api/v1/channels/:cid/*`、`/api/v1/friends/*`、`/api/v1/upload` 和 `/ws`。
- Go REST 成功响应使用 `{code, message, data}`；消息分页使用 `data: {list, total, page, pageSize}`。错误由 Go `errcode` 映射 HTTP 状态和业务码。
- Go WebSocket 当前使用 `{event, data}`，token 通过 query 参数提供，连接不绑定 room，连接后由客户端发送频道订阅事件。服务端对频道和媒体信令执行权限/同频道校验。
- Go 注册接口当前返回用户元数据，不返回 token；前端注册闭环必须是注册成功后再登录，不能按历史文档假设注册直接登录。
- 前端当前使用 `uiStore`（并提供 layout/theme/settings 等兼容别名）驱动 `server-home`、`text-channel`、`voice-channel`、`settings`、`friends` 视图；`NavigationShell` 根据状态渲染页面。
- 前端语音状态在 `voiceStore`，设备、静音、媒体流和 WebRTC 在 `mediaStore`；语音和屏幕共享使用独立的 `WebRTCManager` 实例/peer 集合，并通过 `mediaType` 区分信令。
- 好友私信当前没有后端私聊 WS 事件，好友页使用选中会话期间的定时拉取作为降级方案；这不应被描述为实时 WS 已闭环。

当前 Go checkout 存在未提交修改，涉及 handler/service/main/WS 等文件，并有新增未跟踪测试文件。该状态是静态审计背景，不是稳定发布基线；任何后端改动必须在 Go 仓库单独审查、测试、提交，不能随本前端文档提交。

## 2. 范围和明确延期项

### 2.1 本次最小闭环范围

#### P0：核心可用性和实时媒体

1. **认证与连接**
   - 注册、登录、access/refresh token 的持久化/恢复、401 刷新、登出清理。
   - REST base URL、WS URL、token 注入、连接状态、重连和失效 token 处理。
2. **服务器/频道导航**
   - 服务器列表、详情、频道树、文字/语音频道选择、当前上下文切换。
   - 当前频道订阅、离开旧频道、切换后清理旧频道依赖状态。
   - 成员读取和最小权限门控，确保进入频道前有服务端授权。
3. **语音**
   - 加入/离开、麦克风静音/取消静音、参与者状态、WS 语音事件和 WebRTC offer/answer/ICE。
   - 本地麦克风轨道、远端音频流、断开恢复、leave/unmount/context switch 的 peer/track/listener 清理。
   - 运行时观察实际协商的 `audio/opus`；静态出现 “Opus” 不能作为通过证据。
4. **屏幕共享**
   - 屏幕/窗口源选择、开始/停止、单频道共享占用、远端视频流和 screen peer 生命周期。
   - 屏幕信令与语音 peer 分离、display track `ended`、异常/拒绝/切换上下文清理。
   - 运行时观察 H.264 或 VP8；REST 成功或占位视频不能作为通过证据。

#### P1：已有 UI 和数据同步闭环

1. **频道聊天**
   - 历史消息、分页、发送、编辑/删除/置顶/反应（仅限实际后端支持的动作）、WS 新消息和去重。
   - 失败发送保留可识别的失败/重试状态，不把客户端乐观消息误当作服务端权威消息。
2. **好友**
   - 好友列表、好友请求列表、搜索用户、发送/接受/拒绝请求、删除好友。
   - 私聊历史和发送；由于当前后端无私聊 WS 事件，保留有取消和错误处理的有限轮询降级，不虚报实时推送。
3. **通知**
   - 前端聚合提及、置顶和好友请求；下拉展开重聚合；已读计数和跳转目标一致。
   - 非当前频道/窗口失焦时的桌面通知，使用现有 typed contextBridge 方法。
4. **成员与权限显示**
   - 当前服务器成员列表、角色展示、在线状态查询/缓存、成员加入/离开刷新。
   - 仅实现后端已经确认的权限动作；客户端权限判断只是 UX 门控，服务端鉴权才是安全边界。

### 2.2 明确延期，不得混入本闭环

以下事项从本次闭环明确延期，发现问题应另建条目，不得顺手扩展范围：

- 旧 room API、旧 `room_id` WS 连接方式、旧 `webrtc_offer`/`webrtc_answer`/`audio_share_*` 协议兼容层。
- 完整角色/权限管理 UI（角色 CRUD、批量授权、复杂覆盖规则），除非某个 P0/P1 操作必须增加一个最小服务端权限检查；权限模型仍需保留读取和门控能力。
- 播放列表的协作播放、拖拽排序、播放控制和服务端状态广播。
- 设置后端持久化、账号删除 UX、密码修改后的完整重新登录体验、全量偏好迁移。
- 私聊专用 WebSocket 事件、离线消息推送、已读回执实时广播；当前只保留有限轮询降级。
- 远程桌面控制、屏幕共享系统音频、复杂多显示器策略、SFU/MCU、转码和录制。
- Push-to-Talk、噪声门、自定义音频处理、服务端音频混音。
- 通过增加新依赖、重合并 Zustand stores、重写 Electron 主进程或引入路由库来解决局部闭环问题。
- 视觉大改、玻璃拟态重做、动画升级、全面响应式重构和非核心可访问性清理；这些属于后续 P2，除非运行时验证发现它阻塞 P0/P1 操作。
- Windows/Linux 的“已通过”结论。没有实际平台、版本、权限和客户端证据时只能记录未执行/阻塞。

## 3. 工作区、仓库和提交边界

### 3.1 本设计任务边界

本轮允许变更的唯一文件是：

- `/Users/megumikato/ReactProject/macto/docs/superpowers/specs/2026-09-03-kook-stability-closure-design.md`

本轮明确不修改、不暂存、不提交：

- `src/**`、`package.json`、`pnpm-lock.yaml`、任何 Vite/TypeScript/ESLint/Tailwind 配置。
- `src/main/**`、`src/preload/**`、`src/shared/types/ipc.ts`。
- `src/**/__tests__/**`、`src/renderer/e2e/**` 及其他测试/脚本。
- `docs/integration-progress.md`、`docs/api-contract.md`、其他 `docs/**`。
- `.claude/agent-memory/**`、`.claude/settings.local.json`、`.claude/worktrees/**`。
- 外部 Go 仓库的任何文件。

当前混合 dirty 工作区是基线数据。不得 reset、clean、stash、restore、覆盖或借本设计顺手修复现有修改。目标 spec 路径在写入前已确认不存在，因此只新增，不覆盖已有文档。

### 3.2 本设计的提交规则

- 提交前只精确暂存目标 spec 文件，并检查 staged path 只有该文件。
- 提交信息建议使用 `docs(architecture): define KOOK stability closure`。
- 不提交 `docs/integration-progress.md` 的轮次结果；该文件由后续协调轮次按规则追加。
- 不提交外部 Go 仓库修改，不创建前端仓库中的 Go 副本。
- 本轮不推送远程。
- 若精确暂存发现其他文件已被意外纳入，先取消暂存多余文件，再提交；不得用全量 `git add`。

### 3.3 后续实施轮次边界

每个后续轮次必须在 `docs/integration-progress.md` 中先登记：轮次、条目、负责人、前后端仓库、确切允许文件、禁止文件、测试路径和运行证据计划。实现者只能修改最新条目列出的确切路径。前端和后端分开提交，progress 记录单独提交；任何已有 dirty 文件不因“相关”而自动获得授权。

## 4. 模块分工和协作边界

### 4.1 协调器

- 维护 `docs/integration-progress.md` 的唯一信息中转和状态机。
- 根据最新 progress 选择最高优先级条目，核定确切文件清单、测试清单和运行前置条件。
- 为前端和后端实现者分派不重叠的任务；实现者不直接覆写共享账本。
- 实现完成后并行调度两个独立只读监督员；监督意见由协调器重新读取后按顺序写回。
- 只在测试、运行时、联调、媒体和安全证据齐全后改变为“已验证”。

### 4.2 前端责任

| 责任域 | 主要现有边界 | 责任内容 |
|---|---|---|
| API/认证 | `src/renderer/services/apiClient.ts`、`authService.ts`、`authStore.ts`、auth 页面 | 按实际 Go 响应实现 token 生命周期、错误保留、重试/清理和表单状态；不把服务调用塞进页面 |
| 导航/服务器/频道 | `uiStore.ts`、`serverStore.ts`、`channelStore.ts`、`MainLayout.tsx`、`ChannelSidebar.tsx`、`NavigationShell.tsx` | 维护 server/channel 当前上下文、view 参数、订阅变更和依赖状态清理；不恢复 room |
| 聊天 | `messageService.ts`、`chatStore.ts`、chat 组件、`useRoomWebSocket.ts` | 分页、ID 去重、乐观发送回滚、事件过滤和 UI action 闭环 |
| WS 适配 | `websocketService.ts`、`wsConnection.ts`、`useRoomWebSocket.ts`、`src/renderer/types/websocket.ts` | 只创建一个应用级连接；准确构造 token URL、订阅事件、队列、重连和 listener 清理 |
| 语音媒体 | `voiceService.ts`、`voiceStore.ts`、`mediaStore.ts`、`webrtcManager.ts`、音频 hooks/components | 音频捕获、Opus 协商观察、语音信令、远端播放、权限失败和资源清理 |
| 屏幕媒体 | `mediaStore.ts`、`useScreenShare.ts`、screen components、`webrtcManager.ts` | 屏幕捕获、独立 screen peer、视频 codec 观察、结束事件和远端渲染 |
| 好友/通知/成员 | `friendService.ts`、`FriendsPage.tsx`、`notificationStore.ts`、`NotificationDropdown.tsx`、`serverStore.ts`、`MemberList.tsx` | 按 DTO 映射数据，保留有限轮询降级，通知用 contextBridge，成员状态和角色显示一致 |
| Electron 边界 | 只有 progress 明确授权时才涉及 `src/main/**`、`src/preload/**` | 仅补足已证明必要的 source picker/notification IPC；不直接暴露 Node 或 `ipcRenderer` |

### 4.3 后端责任

外部 Go 仓库负责并单独提交：

- router 注册、handler 参数绑定、service/repository 业务和事务边界。
- JWT access/refresh 生命周期、黑名单、Bearer 认证、WS query token 和过期行为。
- server/channel/member/role 权限、资源所属关系、频道类型检查和错误状态。
- `{code, message, data}` 成功/错误包络、分页字段、空列表与 null 语义。
- WS Hub 连接注册、频道订阅、广播范围、目标用户、心跳和并发关闭安全。
- voice/screen REST 状态、单频道共享冲突、WebRTC 信令目标和 `mediaType` 字段转发。
- 真实数据库/Redis/配置/端口/CORS 启动条件和后端测试。

后端不得通过修改前端文档来“证明”自己的实现；前端派生契约与 Go 实现有差异时，双方现状都记录进 progress，先决定契约所有权再改消费者。

### 4.4 监督责任

- 前端监督员只读检查 React/TypeScript/Zustand/API/WS/WebRTC/Electron/UI 变更及前端证据。
- 后端监督员只读检查实际 Go checkout 的路由、鉴权、响应、WS、媒体信令和 Go 测试/格式证据。
- 两名监督员不得修改源码、测试、配置或 progress；报告返回协调器。
- 监督意见可并行生成，但共享文件写回必须按“读取→前端写回→再读取→后端写回→再读取”的顺序执行。

## 5. 分批实施与依赖

### 5.1 总依赖图

```text
B0 实际契约锁定与工作区授权
             |
             v
B1 认证 + REST/WS 基础连接
             |
             +------> B2 server/channel 导航 + 成员读取/上下文清理
             |                         |
             |                         v
             +----------------------> B3 语音加入/信令/Opus
                                         |
                                         v
                                     B4 屏幕共享/视频 codec
                                         |
                                         +------> B5 聊天事件/分页/去重
                                         |
                                         +------> B6 好友 + 通知

P2 布局/主题/非核心体验：等待 B1-B6 所需 P0/P1 证据，不得反向阻塞核心闭环
延期：playlist、完整 settings、remote control、私聊实时 WS、跨平台未执行环境
```

### 5.2 B0：实际契约锁定（P0 前置，静态为主）

**目的**：把历史 room 参考与当前 server/channel 实现分开，冻结本轮可执行契约。

**输入**：当前前端服务/types/hooks/stores；Go router、DTO、handler/service、WS handler/hub；当前 branch/status；实际 `.env` 和后端 config。

**输出**：progress 中的条目和确切允许路径，不修改产品代码；每个未知项记录为阻塞或澄清项。

**必须锁定的事实**：

- REST base URL、鉴权头、统一响应和错误状态。
- server/channel/voice/screen/chat/friend 的路径、方法、请求字段、响应字段、null/空数组、分页。
- WS token 位置、`event/data` 包络、订阅范围、事件名、重连/心跳、signal target 和 mediaType。
- 当前 Go checkout 的 dirty 状态不等于已提交稳定版本；后端改动需要独立 commit。
- 所有涉及音频/视频的 runtime 前置：两个客户端、麦克风/屏幕权限、STUN/TURN、平台和 codec 观察方式。

**进入下一批的条件**：实际路由/DTO/WS 源码路径已记录；未能运行服务的部分保持“待测试/阻塞”，不以旧文档替代。

### 5.3 B1：认证和基础连接（P0）

**依赖**：B0；不依赖页面美化。

**前端工作包**：

- `apiClient` 只对非 auth 请求注入一个 access token；login/register/refresh 不继承旧 token。
- 401 只触发一次 refresh；并发 401 共享刷新结果，不产生刷新风暴；refresh 自身不可递归刷新。
- refresh 失败清除 access/refresh token、断开 WS、派发一次登出状态转换，保留可诊断的原始 status/business code/body。
- 注册先调用真实 register，再通过真实 login 建立 session；不得读取注册响应中不存在的 token。
- WS URL 使用 `URL` API 正确追加/替换 query token；不得产生 `base&token` 或重复 token；重连读取最新 access token。
- 连接、重连、终止状态和计时器可观察；`disconnect` 清理 timer、socket、队列和 listener。

**后端工作包**：

- 核对 auth routes、JWT expiry/rotation/blacklist、CORS、WS query token 和错误状态。
- 确认注册元数据响应、登录 token 响应、refresh token 响应与前端类型一致。
- 确认服务启动依赖、端口、数据库、Redis、允许的 renderer origin。

**退出证据**：静态类型/测试通过只是必要条件；必须另有一个真实 REST 登录成功、一个无效 token 失败和一个真实 WS 握手/关闭观察，未具备凭据或服务则保留阻塞。

### 5.4 B2：server/channel 导航和成员读取（P0）

**依赖**：B1 的认证和 REST/WS 连接；B3 必须等待当前语音频道上下文稳定。

**前端工作包**：

- `serverStore` 作为服务器列表、详情、members、roles 的状态边界；`uiStore` 维护 current server/channel 和 active view。
- server detail 的 channel tree 只使用 `ChannelType.Text=1`、`Voice=2`、`Category=3` 及实际 `serverId/channelId`。
- 频道点击同时更新 current channel、active view 和 WS desired subscription；离开旧上下文后不把旧消息/成员/媒体显示到新频道。
- NavigationShell 只渲染已注册的 `server-home`、`text-channel`、`voice-channel`、`settings`、`friends`，页面通过 typed `ViewParams` 获取 ID，不使用硬编码或 `roomId`。
- 成员列表调用 `/servers/:id/members`；在线状态查询调用已确认的 `/users/:id/online`，轮询必须可取消并受并发上限约束。
- 客户端权限判断仅决定按钮/入口；服务端对每个资源和操作再次判断。

**后端工作包**：

- 核对 server/channel/member response 字段（尤其 `parentId`、roles、owner、空数组）和权限错误。
- 核对 `member_joined/member_left` 广播的 serverId/member/userId 与当前客户端过滤规则。
- 确认频道类型和 server membership 对消息、语音、屏幕操作的权限链。

**退出证据**：真实账号读取服务器、详情、频道树、成员列表，切换文字/语音频道，再离开或切换并观察 WS subscription 和前端 stale-state 清理；静态导航渲染不算通过。

### 5.5 B3：语音媒体闭环（P0）

**依赖**：B1、B2；至少一个可用语音频道和两个真实客户端。

**前端工作包**：

- REST 以 `/channels/:cid/voice/join`、`leave`、`participants`、`mute` 为唯一目标，字段按 Go DTO。
- 加入流程区分 REST membership、麦克风 capture、participants 快照、WS presence 和 P2P signaling；任何一步失败都有明确回滚。
- 语音信令 outbound 使用 `event: webrtc_signal` 和 data 中的 `type/targetId/payload/mediaType=voice`；inbound 使用 `fromUserId/fromUsername/signal`，并过滤当前频道/权限上下文。
- `WebRTCManager` 的 voice peer 只添加音频轨道；远端音频播放、音量和本地 deafen 语义不能冒充服务端 `isMuted`。
- leave、logout、context switch、unmount、peer failed 和 permission denied 均关闭 peer、移除 remote stream、停止本地 track、注销 WS listener；重复 leave 必须幂等。
- 对 `RTCRtpSender` capability 或实际 SDP 做运行时记录，确认 `audio/opus`；只看到代码中的字符串、测试 double 或按钮状态不得标记 codec 通过。

**后端工作包**：

- `VoiceService` 校验 voice channel、membership、`PermConnectVoice`，返回完整 participant 字段。
- WS `voice_join`/`voice_leave`/`voice_user_joined`/`voice_user_left`/`voice_state_update` 的范围和字段必须可被真实客户端观察。
- WebRTC signal 必须校验 target 与 sender 共享已授权频道，区分 voice/screen，并拒绝自发 target、错误 type、空 payload 和未授权 target。

**退出证据**：两个客户端同频道加入、真实麦克风 track、offer/answer/ICE、远端听到音频、静音/恢复、断开/重连/离开，记录 SDP 中的 Opus、track 状态和 cleanup；缺少第二客户端/设备/权限/服务均是阻塞。

### 5.6 B4：屏幕共享闭环（P0）

**依赖**：B3 已建立可用的 voice channel/WS/peer 基础；屏幕共享仍使用独立 screen peer。

**前端工作包**：

- 屏幕 REST 使用 `/channels/:cid/screenshare/start`、`stop`、当前状态；后端单频道冲突错误必须在 UI 中可见且不泄漏本地 capture。
- 捕获、服务端 reservation、peer offer、screen start event 的顺序必须定义；任何失败执行本地 track/peer/状态/服务端 reservation 回滚。
- `mediaType=screen` 的信令进入专用 screen manager，不复用 voice peer；screen peer 发送视频轨道，远端视频按来源 userId 映射。
- 屏幕 track `ended`、用户点击停止、窗口/权限撤销、logout、context switch 和 unmount 都走同一幂等清理路径。
- 运行时记录实际 video SDP/codec，至少为 H.264 或 VP8；不能用 REST 200、静态 codec 名、测试 double 或黑屏 video 元素替代。

**后端工作包**：

- 屏幕开始/停止/当前状态必须校验 voice channel、membership、`PermScreenShare` 和 owner；同频道已有他人共享时返回可区分错误。
- 广播 `screen_share_start/stop` 包含实际 channelId/userId，目标范围与订阅一致；信令转发保留 sender/target/mediaType。
- 旧顶层 screen/audio event 形态与当前 `{event,data}` 形态的差异必须在 progress 中明确，不能同时猜测两种协议都已支持。

**退出证据**：两个客户端选择显示器/窗口、开始共享、远端看到对应视频、停止、source ended/拒绝和切换上下文，记录 H.264/VP8 SDP、远端流、peer close、track stop、状态归零；没有桌面权限或第二客户端不能标记通过。

### 5.7 B5：聊天数据闭环（P1）

**依赖**：B1、B2；可与 B3/B4 的实现分工并行，但不得共享同一文件并发写。

**前端工作包**：

- `/channels/:cid/messages` 历史和发送/更新/删除/置顶/反应路径按真实 Go handler。
- 兼容分页 `list/total/page/pageSize`，维护每频道的 next page 和 hasMore；切换频道不使用旧 channel 的 page。
- 发送可以乐观插入，但必须以服务端 id/完整 DTO 替换；失败转为 failed 并提供 retry 或明确移除策略。
- WS `chat_message` 只接受 `{channelId, message}` 的完整 canonical DTO，按 channelId 过滤并按稳定 message id 去重。
- 不把客户端事件 `chat_message` 当成后端持久化入口，除非 Go 实现和需求另行确认；当前 Go handler 明确 REST 持久化后发布。

**后端工作包**：

- 确认发送先持久化再广播完整消息，广播不重复发送者或由前端兼容自身 REST 结果。
- 确认编辑/删除/置顶/反应事件字段、权限和错误；返回分页元数据和空数组语义。

**退出证据**：真实客户端历史分页、发送/接收、第二客户端观察、编辑/删除/反应、离开/切换后无串频道；请求、WS event、server id 和 UI/store 结果均需记录。

### 5.8 B6：好友、私信、通知闭环（P1）

**依赖**：B1；好友不依赖 server/channel，但通知中频道跳转依赖 B2。

**前端工作包**：

- 好友服务使用实际 `/friends`、`/friends/requests`、`/friends/request`、`/friends/request/:id/handle`、`/friends/:id`、`/friends/search` 和私信路径，严格映射 `FriendResponse`、`FriendRequestResponse`、`PrivateMessageResponse`、`ConversationResponse`。
- 好友请求状态以 0 pending、1 accepted、2 rejected 解释，失败不从 UI 静默删除。
- 私信发送失败必须撤销乐观项或显示可重试项；选中会话的 8 秒轮询必须在切换/卸载时清除，且不与发送 draft 状态冲突。
- 通知仅由已观察的 chatStore 消息和好友请求聚合；稳定 key 去重、沿用 read 状态、点击提及/置顶定位频道、好友请求打开好友页。
- 桌面通知只通过 `window.electronAPI.sendNotification`，过滤当前用户/当前聚焦频道，禁止把未经清理的 HTML 或 token 放入通知。

**后端工作包**：

- 核对 friend handler 的 query 默认 page/pageSize、搜索只返回一个用户对象、私聊列表/会话列表包络和权限。
- 如要增加私聊 WS 事件，必须另立契约和 P1 条目；本闭环不假设它存在。

**退出证据**：两个真实账号发送/处理好友请求、读取好友/会话/私信、发送私信并观察轮询最终一致；触发提及/置顶/请求并观察通知数据、未读数、跳转和 Electron notification。只有 UI 空态或 mock 数据不算通过。

### 5.9 P2 入口

P0/P1 证据完整后才选择具体运行时观察到的布局/滚动/主题/焦点问题。P2 不能通过静态 class 检查关闭；必须有平台、视口、操作和观察记录。未观察到的“看起来可能有问题”不授权修改。

## 6. 导航与领域契约

### 6.1 状态单一来源

```text
serverStore.currentServer/detail/members/roles
                         |
                         v
uiStore.currentServerId/currentChannelId/activeViewId/activeViewParams
                         |
          +--------------+---------------+
          v                              v
   WS desired channel             channelStore/chatStore
          |                              |
          +--------------+---------------+
                         v
              voiceStore + mediaStore
```

- `serverStore` 保存服务端 server/member/role 数据；`uiStore` 保存当前选择和布局/连接状态；`channelStore` 保存频道树和频道相关列表；`chatStore` 保存多频道消息缓存。
- `activeViewId` 的允许值是当前 registry 中的 `server-home`、`text-channel`、`voice-channel`、`settings`、`friends`；`ViewParams` 使用可选 numeric `serverId`、`channelId`。
- `currentServerId`、`currentChannelId`、`activeViewParams` 必须相互一致；缺少有效频道时进入 `server-home` 或明确空态，不渲染旧频道内容。
- 同一用户的服务端 uint64 ID 在前端使用 `number` 前，必须确认不超出 JavaScript safe integer；权限位当前处于 1<<30 范围，若后端扩展到更高位必须改变传输表示而非静默截断。

### 6.2 导航切换事务

导航切换按以下顺序设计：

1. 记录目标 server/channel/view 和一次性 context generation。
2. 对旧频道停止发送旧频道作用域的 typing/chat/media 事件，向 WS 写入旧频道 leave（若连接已打开）。
3. 若仍在语音/屏幕，先执行本地 media cleanup；服务端 leave/stop 失败必须保留错误和可重试信息，但不能留下活跃 track/peer。
4. 更新 current IDs 和 active view；旧请求返回时检查 generation/channelId，不得写入新上下文。
5. 订阅新频道并加载服务端数据；UI 显示 loading/empty/error，不能用旧缓存伪装新频道成功。

## 7. 语音、屏幕和 WebSocket 契约

### 7.1 REST 约定

| 领域 | 方法与路径 | 成功 data | 失败重点 |
|---|---|---|---|
| Auth | `POST /auth/register` | 当前 Go 为用户元数据，不含 token | 参数、重复用户 |
| Auth | `POST /auth/login` | 用户 + access/refresh token + expiresIn | 错误凭据、限流 |
| Auth | `POST /auth/refresh` | 新 access/refresh token + expiresIn | refresh 失效 |
| Auth | `POST /auth/logout` | 当前 Go 为成功响应 | 黑名单失败的 best-effort 语义 |
| Server | `GET /servers`、`GET /servers/:id` | server 列表/详情及 channels | 未认证、非成员、not found |
| Channel | `GET /servers/:id/channels` | channel tree | 非成员、server not found |
| Voice | `POST/GET /channels/:cid/voice/*` | participant 或列表；leave/mute 可为 null | 类型、权限、未加入 |
| Screen | `POST/GET /channels/:cid/screenshare*` | active screen session 或 null | 已有他人共享、权限、无 active |
| Message | `GET/POST/PUT/DELETE /channels/:cid/messages*` | message、分页或 null | 频道权限、消息权限、分页 |
| Friend | `/friends/*` | 对应 friend/request/conversation/message DTO | 非好友、重复请求、参数错误 |

成功响应必须由前端统一解包 `data`，并保留错误响应的 HTTP status、business code、message 和原始 body。任何端点如果实际响应不是表格形状，先记录契约差异，不在消费者中猜字段。

### 7.2 WS 连接和订阅

- 连接 URL：`VITE_WS_URL` 的当前实际地址加一个 URL 编码的 `token` query；不添加 `room_id`。
- 握手成功后，客户端根据当前选择发送 `event=join_channel`、`data.channelId`；切换/离开发送 `leave_channel`。
- 一个应用只保留一个共享 `WebSocketService`/`wsConnection`；React hook 卸载不得把其他消费者的 socket 断开，但必须移除自身 handlers/timers。
- 重连重新认证、重新订阅 desired channel，并移除旧频道作用域的过期队列；队列不能重放已离开的频道事件。
- 后端原生 WebSocket ping/pong 与应用 `event=ping`/`event=pong` 要分别记录；未通过实际观察和 Go 代码确认前，不擅自增加另一套心跳。
- 事件包络以 Go 当前 `event/data` 为准。历史 `{type,payload,timestamp}` 文档形态不能混入实现，除非本轮 progress 明确锁定兼容契约。

### 7.3 关键事件方向

| 方向 | event | data 约定 | 消费者 |
|---|---|---|---|
| C→S | `join_channel` / `leave_channel` | `{channelId}` | WS Hub 订阅表 |
| C→S | `typing` | `{channelId,isTyping}` | chat/UI；需已订阅且有权限 |
| C→S | `webrtc_signal` | `{type,targetId,payload,mediaType}` | WS target relay |
| C→S | `voice_join` / `voice_leave` | `{channelId}` | voice presence；REST membership 仍是权威 |
| C→S | `screen_share_start` / `screen_share_stop` | `{channelId,userId}`，userId 由服务端身份校验 | screen presence |
| S→C | `chat_message` | `{channelId,message}` | chatStore，按 id 去重 |
| S→C | `voice_user_joined` | 当前 Go 为 `{channelId,user}` 或后端实际平面 DTO | voiceStore，映射完整 participant |
| S→C | `voice_user_left` | `{channelId,userId}` | voiceStore/media cleanup |
| S→C | `voice_state_update` | `{channelId,userId,isMuted,isDeafened,isSpeaking}` | voiceStore；字段按实际出现更新 |
| S→C | `screen_share_start` | `{channelId,userId,username}` | screen UI/peer intent |
| S→C | `screen_share_stop` | `{channelId,userId}` | screen remote removal |
| S→C | `webrtc_signal` | `{fromUserId,fromUsername,signal,mediaType?}` | voice/screen manager |
| S→C | `member_joined` / `member_left` | `{serverId,member}` 或 `{serverId,userId}` | serverStore |
| S→C | `error` | `{event,message}`，不含内部敏感信息 | 当前发送者错误状态 |

`webrtc_signal` 的 `payload` 是序列化 SDP/ICE，不能在日志、通知或错误 UI 中完整打印 token/敏感 SDP 之外的凭据。信令 target 必须是共享授权频道中的用户；同一频道不代表自动拥有屏幕权限，服务端必须按 `mediaType` 重新校验。

## 8. 好友、通知和成员契约

### 8.1 好友

- `FriendResponse` 以 `friendId/friendName/avatarUrl/isOnline/customStatus/createdAt` 为基准。
- `FriendRequestResponse` 以 `id/senderId/senderName/receiverId/status/message/createdAt` 为基准；当前用户为 receiver 时无需虚构 receiverName。
- `SearchUserResponse` 是单个用户对象；前端页面可以包装为结果数组，但不能把后端响应误当分页列表。
- `ConversationResponse` 当前没有可靠的 `lastMessageAt` 字段；显示层必须接受空时间，不伪造服务器时间作为已验证字段。
- 私聊发送 data 只使用 Go 当前 DTO 支持的 `receiverId/content`；前端旧的 `type` 字段若未被后端绑定，不发送或另立契约。
- 轮询只在 active conversation 存在时启用，切换和卸载清理 timer；错误不清空 draft，避免用户输入丢失。

### 8.2 通知

通知是前端聚合域，不宣称有后端 notifications endpoint：

- mention：从已收到/已加载的频道消息正文按当前用户名匹配，排除自己。
- pin：从消息的 `isPinned` 状态派生；如果后端只发事件但不返回完整消息，必须先补齐数据而非猜测。
- friend-request：打开通知面板时读取待处理请求，并用 request id 稳定去重。
- 通知点击必须通过已知频道树解析 server/channel，再设置 UI state；无法解析的目标显示安全降级，不跳到任意 URL。
- `NotificationDropdown` 关闭面板才标记已读；通知获取失败时只降级缺失源，不将错误误报为无通知。
- 桌面通知由 preload 暴露的窄接口完成；renderer 不获得 Node、文件系统或 unrestricted `ipcRenderer`。

### 8.3 成员和角色

- `/servers/:id/members` 返回 member id、serverId、userId、username、avatarUrl、nickname、joinedAt、roles；在线状态不是该 DTO 的隐含字段。
- 在线状态通过实际确认的 user status endpoint 获取并缓存；轮询/批量读取不得无限并发。
- `member_joined/member_left` 事件只更新当前 server；不相关 server 的事件丢弃或记录，不污染当前列表。
- owner/role 展示可由当前 server detail/member roles 得到；“管理员能踢人/改角色”的按钮必须同时经过本地权限门控和服务端拒绝路径验证。
- 前端不得只因菜单项存在就声称权限闭环；必须验证普通用户 403、owner/admin 成功和 target 不存在错误。

## 9. 错误处理、回滚和安全边界

### 9.1 通用错误原则

1. `ApiClientError` 至少保留 HTTP status（网络错误为 0）、业务 code、message 和原始 response body；不得只抛一个被翻译后无法定位的字符串。
2. 成功 state 只在服务端成功后提交；乐观更新必须记录临时 id/发送状态，并有失败回滚或重试入口。
3. 401 refresh 只对非 auth endpoint 触发一次；refresh 失败时清 token、断 WS、清媒体和用户私有 store，不能再次自动发起无 token 请求。
4. 403、404、409、429、5xx 和网络错误在 UI 中区分可重试、权限、资源不存在和服务不可用，不以空列表隐藏错误。
5. 每个异步动作绑定 context/user/session generation；迟到响应不能写入新用户、新 server 或新 channel。

### 9.2 分域回滚

| 场景 | 先回滚的本地副作用 | 服务端处理 | 最终状态 |
|---|---|---|---|
| 登录成功后 user info 失败 | 清理不完整 session 或显示恢复态 | 不重复注册/登录；按 token 状态决定 refresh | 未认证或可重试，不显示半个用户 |
| WS 握手/重连失败 | 清 timer、socket、过期队列 | 保留 bounded retry；token 过期先 refresh | `error`/`disconnected`，不伪造 connected |
| 语音 join capture 失败 | 停止 tracks、关闭 voice peers、清 voice state | 若 REST join 已成功，best-effort leave；保留失败原因 | 未加入且可重试 |
| 语音 leave REST 失败 | 仍停止 tracks/关闭 peers，保留可重试 membership 错误 | 下一次 leave 或恢复连接时重试 | 不保持本地媒体；服务端状态未确认 |
| 屏幕 reservation/offer 失败 | 停止 display tracks、关闭 screen peers、清 remote/local state | reservation 已建则 best-effort stop | `isSharing=false`，错误可见 |
| 屏幕 display `ended` | 同显式 stop 的幂等清理 | 发送 stop；失败记录待重试 | 不泄漏 track/peer/listener |
| 聊天发送失败 | 临时消息变 failed，保留 retry data | 不重复提交未确认消息 | 不显示为 sent |
| 好友/私信失败 | 保留表单或失败项，撤销错误乐观列表变化 | 依据真实错误决定重试 | 用户能看出失败原因 |
| server/channel 切换 | 释放旧 voice/screen、清旧频道临时状态 | leave old / join new，按实际成功记录 | 新上下文与旧状态隔离 |
| logout/refresh failure | 断 WS、关闭全部 peer、停止所有 tracks、reset 私有 stores | token 清除/黑名单 best-effort | 无凭据、无活跃媒体、无旧通知 |

### 9.3 Electron 和浏览器安全

- renderer 只能通过 `contextBridge` 取得明确方法；不能暴露 `ipcRenderer`、`process`、Node 模块或任意 channel invoke。
- 新增/修改 main/preload 只有在 progress 明确授权具体文件后才可执行；通知、屏幕源和音频源均使用 typed request/response，主进程验证 payload。
- WS token query 只能使用 access token，不能放 refresh token；开发日志只打印 token present/endpoint，不打印 token 值。
- 后端仍是所有资源/角色/频道/媒体权限的最终裁决；前端按钮隐藏不是安全控制。
- 用户内容在 Markdown/通知/消息展示前使用现有安全渲染边界；不把未经信任文本拼成可执行 HTML，不在错误消息中回显凭据或内部栈。
- WebRTC 信令必须经过同频道、目标用户、媒体能力和当前 session generation 检查；未知/畸形 signal 被拒绝且不能使 store 崩溃。
- 只允许本应用需要的 CORS origin、HTTP methods、headers；生产环境不以通配 origin 放宽桌面握手。
- 屏幕/麦克风权限拒绝是正常可见错误，不自动重试到不可控循环；track、object URL、Audio 元素和 listeners 均有释放路径。

## 10. 测试和运行验证矩阵

### 10.1 静态核对与运行时验证的明确区分

| 阶段 | 允许得出的结论 | 明确不能得出的结论 |
|---|---|---|
| 读取源码/rg/类型映射 | 路径、字段、模块连接、潜在差异 | 后端已实现、服务可用、媒体可听可见 |
| `pnpm lint` / `pnpm build` / `pnpm test` | 当前 checkout 的静态/确定性检查结果 | REST/WS/WebRTC/样式运行时通过 |
| `go test` / `gofmt` | 当前 Go checkout 的格式/测试结果 | 前端已经正确调用、live service 可达 |
| mock service/RTCPeerConnection test double | 状态机、错误回滚、字段映射的确定性行为 | 真实 ICE、真实 codec、真实权限和网络 |
| `pnpm dev` 单客户端 | Electron/renderer 启动和单客户端 UI 操作 | 双端媒体互通、后端广播正确 |
| 真实 REST/WS 联调 | 实际服务上的 HTTP/握手/事件证据 | 未执行的错误/权限/重连/平台场景 |
| 双客户端 WebRTC | 实际 SDP、ICE、track、远端渲染、cleanup | 另一平台/另一网络必然相同 |
| 历史 docs、旧 commit、旧测试结果 | 演进背景和待核对线索 | 当前版本已经通过 |

### 10.2 前端静态和确定性检查

| 检查 | 范围/条件 | 必须记录 | 通过不能代替 |
|---|---|---|---|
| `pnpm lint` | 当前授权 diff 或完整前端 | 日期、分支、退出码、错误/警告 | 运行时行为 |
| `pnpm build` | 当前前端构建，确认不覆盖无关 dirty 文件 | main/preload/renderer 构建结果、退出码 | backend/API/media |
| `pnpm test` | 完整 Vitest；focused tests 需 progress 授权 | 用例数、失败名、环境 | live service |
| focused service/store/WebRTC tests | 只运行 progress 授权的现有测试路径 | path、mock 边界、结果 | 真实 codec/权限 |
| `pnpm test:e2e` | 仅在 runner、Chrome、前端和后端都已确认 | URL、浏览器、账号、用例、失败/阻塞 | 未覆盖的媒体双端细节 |

任何命令不存在、依赖缺失、服务不可达、凭据缺失或环境不可用都记录为未执行/阻塞，不能改写为通过。当前 `package.json` 的脚本基准为 `dev`、`build`、`test`、`test:e2e`、`lint`；后续不为本设计临时增加脚本。

### 10.3 后端静态和确定性检查

| 检查 | 条件 | 必须记录 |
|---|---|---|
| `gofmt` 检查 | 只针对 progress 授权的实际 Go 文件 | Go root、branch、文件、输出/退出码 |
| `go test` focused | 实际 package、DB/Redis 条件已确认 | Go version、package、依赖、失败堆栈摘要 |
| `go test ./...` | 后端 checkout 和依赖可用 | 完整结果、未执行 package、环境阻塞 |
| Go 静态 route/DTO/WS 核对 | 只读 | literal path、handler、service、middleware、字段证据 |

Go working tree 当前有 dirty 状态；在另一个后端提交前不能将其静态结果称为稳定基线。

### 10.4 P0/P1 运行时矩阵

| 闭环 | 最小真实操作 | 观察证据 | 失败/阻塞判定 |
|---|---|---|---|
| Auth | 注册新账号、登录、刷新/重载、失效 token、登出 | HTTP method/path/status/body 摘要、storage token 变化、UI 状态 | 无账号/后端/DB/token 处理即阻塞 |
| REST/WS | 登录后握手、join channel、切换、leave、断开重连 | 实际 URL（隐藏 token）、event/data、重连次数和订阅 | 只通过类型/模拟 socket 不算 |
| Navigation | 服务器列表→详情→文字/语音频道→切换/离开 | serverId/channelId、当前 view、消息/成员清理、WS subscription | 页面能点但请求/状态不符即失败 |
| Voice | 两客户端同语音频道 join、讲话、mute、断开、leave | getUserMedia、offer/answer/ICE、track、远端音频、Opus SDP、peer close | 没有远端音频或 Opus 观察不通过 |
| Screen | 两客户端选择源、start、远端显示、stop/source ended | capture source、screen signal、远端 video、H.264/VP8 SDP、track/peer cleanup | REST 200/占位画面不通过 |
| Chat | 两客户端历史分页、发送/接收、编辑/删除/反应、切换频道 | REST response、WS message id、去重、UI/store 状态 | 仅本地 append 不通过 |
| Friends | 两账号好友请求、accept/reject、列表、私信、轮询刷新 | request/message HTTP、双方最终列表、timer cleanup | mock 或无第二账号只能阻塞 |
| Notifications | 触发 mention/pin/friend request、打开/关闭、点击跳转、失焦通知 | source event/data、通知 key/unread、view/channel、IPC 调用结果 | 只有 toast/空态不通过 |
| Members | 读取成员、在线状态、join/leave 广播、权限成功/403 | member DTO、status 请求、WS event、权限响应 | 菜单存在不代表权限通过 |

### 10.5 运行平台矩阵

每次运行记录 Electron、操作系统、窗口/视口、后端版本/branch、浏览器或系统媒体权限。至少分开记录：

- 当前可用 macOS 环境：实际执行项和观察结果。
- Windows：若没有实际环境，标为未执行/需要的环境，不得由 macOS 推断通过。
- Linux：同上。
- 屏幕共享还要记录显示器/窗口类型、系统录屏权限和 source ended 行为。

## 11. 最多四并发请求的调度原则

“最多四并发”同时约束协调任务调度和运行验证请求；不得以 `Promise.all` 或后台 watcher 绕过上限。

### 11.1 Subagent/工具调度上限

1. 任意时刻最多 4 个活跃的 agent/tool 工作请求；超过上限进入有序队列。
2. 同一文件或同一共享契约不得有两个写入者；前端/后端可并行是因为仓库不同且路径不重叠。
3. B0、progress 写回、契约/类型修改属于串行屏障；共享文件写回永远不并行。
4. 实现后最多并行两个只读监督员，分别检查前端和后端；监督返回后由协调器顺序写回，不能由监督员直接写同一文件。
5. P0 未解除的问题优先于 P1/P2；同优先级按依赖顺序和可独立验证程度排队。
6. 每个工作包必须有 exact path allowlist、owner、输入证据、输出证据和停止条件；没有这些字段不占用并发槽执行。
7. 失败、环境阻塞或监督意见矛盾时暂停该依赖链，释放槽位做只读澄清，不派发“绕开问题”的相邻实现。

### 11.2 运行时 HTTP/验证请求上限

1. 单个前端客户端同时在途的 HTTP/API 请求最多 4 个；超过部分排队并保留顺序。
2. auth refresh、server/channel context switch、voice/screen reservation 等依赖请求必须串行；不能在 token 未确认时并发业务请求。
3. 成员在线状态轮询不能对 N 个成员无界 `Promise.all`；使用最多 4 个 worker 或逐个请求，并在 server 切换时取消剩余任务。
4. 聊天分页、好友轮询、通知拉取共享同一限流器；面板反复打开不得重复堆积同类请求，应去重或复用在途请求。
5. 每个请求带 domain/context generation；响应返回时若 generation 已过期，丢弃结果而不是写新上下文。
6. WebSocket 长连接和两端媒体会话不计作普通 HTTP 并发槽，但真实测试最多启动必要的两个媒体客户端；它们的初始化 REST 请求仍遵守每客户端 4 个上限。
7. 不使用后台 watcher、常驻 monitor、隐式同步进程或无限重连；所有 runtime 验证在前台运行，观察完成后停止。

### 11.3 推荐队列顺序

```text
P0 auth/token  >  P0 REST/WS connection  >  P0 context
        >  P0 voice  >  P0 screen
        >  P1 chat  >  P1 friends/notifications/members
        >  P2 visual/non-core
```

当四个槽位已满时，新请求按照上述优先级进入队列；同一 domain 的新请求可以合并，但不得取消一个已有的错误记录。重试使用 bounded backoff，401 只允许一个 refresh gate，409/403/404 不盲目重试。

## 12. 实施轮次、监督和状态机

### 12.1 单轮固定顺序

1. 完整读取 `docs/integration-progress.md` 和本设计。
2. 记录当前前端/后端 branch、dirty path、最新 commit 和本轮 exact allowlist。
3. 确认 Go root、服务启动方式、DB/Redis/JWT/CORS/媒体前置；缺失即记录阻塞。
4. 先写确定性失败测试（如果该行为适合测试），再由专门 agent 修改授权实现。
5. 实现完成只能进入 `待监督`，不能直接进入 `待测试` 或 `已验证`。
6. 并行调用前端/后端只读监督员；每次写回前重新读取 progress，顺序保留双方意见。
7. 有监督问题则进入 `监督问题`，修复前再次读 progress；无监督问题才进入 `待测试`。
8. 运行授权的静态检查、focused tests、真实 REST/WS/WebRTC/样式验证，逐条记录环境和结果。
9. 轮次结束再次读取 progress，确认状态、证据、阻塞、下一步和提交路径一致。
10. 精确暂存本轮授权文件，执行 `diff --check` 和 staged path 检查，单独提交；progress 记录另行提交。

### 12.2 状态规则

```text
待处理 → 处理中 → 待监督 → 监督问题 → 修复中 → 待监督
                              └──────────────→ 待测试 → 已验证
```

- 静态核对发现的缺口默认是 `待处理`，不是失败修复授权。
- 必需测试未执行、失败、结果不明或环境阻塞，保持 `待测试` 或回到 `监督问题`，绝不写 `已验证`。
- 历史通过、旧 commit、单元测试通过、按钮可点击和服务端源码存在都不能跳过运行时状态。
- 两名监督员意见矛盾时增加澄清条目，暂停实现，不凭偏好选择一方。
- progress 是事实账本；纠错追加新证据，不删除历史失败或阻塞记录。

## 13. 验收标准

### 13.1 文档/提交验收

- [ ] 目标文件只描述设计，不含业务代码、配置实现、测试实现或隐含脚本。
- [ ] 明确写出 in-scope、明确延期项、当前工作区和前后端独立提交边界。
- [ ] 文档提交只包含目标 spec，未包含现有 dirty source/test/config/memory/settings/worktree 或 Go 文件；未推送。
- [ ] 明确指出 `docs/api-contract.md` 的历史推导属性及其与当前 Go server/channel 契约的差异。
- [ ] 明确区分 S0/S1 静态证据与 S2/S3 运行时证据，未将历史审计当通过证据。

### 13.2 P0 验收

- [ ] 注册、登录、token refresh/restore/logout 的真实 HTTP 和前端状态转换均有证据；注册不被假设为返回 token。
- [ ] REST/WS URL、鉴权、event/data 包络、订阅、重连、旧队列清理和断开状态在真实服务上有证据。
- [ ] server/channel 导航、上下文切换、成员读取、权限拒绝和 stale-state 清理有真实请求/状态观察。
- [ ] 两客户端语音 join/leave/mute/远端音频/断开清理有 SDP/ICE/track 证据，协商音频为 Opus。
- [ ] 两客户端屏幕 start/stop/远端视频/source ended/cleanup 有 SDP/track/peer 证据，协商视频为 H.264 或 VP8。
- [ ] P0 必需环境不可用时，条目明确写阻塞和解除条件，不以静态结果关闭。

### 13.3 P1 验收

- [ ] 聊天历史/分页/发送/接收/去重/失败回滚与真实 REST/WS 证据一致。
- [ ] 好友请求、好友列表、私信历史/发送按真实 DTO 闭环；私信轮询明确是降级而非实时 WS。
- [ ] 通知聚合源、去重、已读、跳转和 Electron notification IPC 的 source/target 有观察证据。
- [ ] 成员列表、在线状态、member events、role display 和 permitted/forbidden action 有证据。
- [ ] P1 不扩展到延期的 playlist、settings backend、私聊 WS 或完整 role admin。

### 13.4 安全和维护验收

- [ ] 所有 IPC 仍使用 contextBridge typed narrow API，renderer 无 Node/unrestricted ipcRenderer。
- [ ] access token 与 refresh token 作用域、日志脱敏、WS query 编码、失效清理和服务端 JWT 校验明确。
- [ ] server/channel/media 权限由 Go 最终校验；前端隐藏按钮不作为安全证明。
- [ ] 信令 target、mediaType、同频道和 session generation 校验明确；未知 signal 不使客户端崩溃。
- [ ] 麦克风/屏幕 permission denied、track ended、disconnect、logout 和 context switch 均无媒体资源泄漏。
- [ ] 运行请求和成员轮询都遵守最多 4 并发；没有后台 watcher、无限重连或无界 `Promise.all`。
- [ ] 每个“已验证”条目都能从 progress 追溯到命令/环境/操作/观察/监督意见；未覆盖平台仍标记未执行。

## 14. 设计自审记录

本轮写入后按以下类别审阅文档；审阅目标是发现设计本身的占位符、矛盾、歧义和越界，不是宣称产品已经通过。

### 14.1 占位符检查

- 未使用 `TBD`、`TODO`、`FIXME`、`稍后补充`、`占位实现` 作为未决任务的替代。
- 对真实未知项使用“待测试/阻塞/需确认的实际环境”并说明解除条件，不用模糊的“按需处理”。
- 文档中的 deferred 列表是明确的范围决策，不是遗漏的实现任务。

### 14.2 契约矛盾检查

- 已明确：当前 `.env`/源码端口为 8081；历史契约中的 8080 只保留为差异参考。
- 已明确：当前后端是 server/channel + `/channels/:cid`，旧 room 路径延期，不将两套 ID/路由混用。
- 已明确：当前 Go WS 是 `{event,data}`、token query、join/leave subscription；历史 `{type,payload}` 不作为当前事实。
- 已明确：注册返回元数据，登录才取得 token；不采纳历史“注册直接登录”的假设。
- 已明确：后端 join/voice/screen 的具体成功 data 以真实运行响应最终确认，前端不能根据旧文档虚构字段。
- 已明确：私聊没有当前后端 WS 事件，轮询是降级；不把最终一致描述成实时推送。

### 14.3 歧义检查

- “加入语音”拆成 REST membership、capture、presence、signaling、media 五个观察点，避免只看按钮。
- “屏幕共享成功”拆成 reservation、capture、offer/answer/ICE、远端视频、codec、停止清理六类证据。
- “权限通过”区分客户端门控和服务端授权，并要求普通用户错误路径。
- “心跳”区分 native WebSocket ping/pong 与应用事件 ping/pong，未观察前不擅自扩展。
- “最多四并发”同时给出 agent/tool 槽位和 HTTP/轮询请求限制，避免把长连接误算为无限 API 并发。

### 14.4 范围和提交自审

- 本文没有授权任何现有业务代码、测试、配置、progress、memory、settings 或 Go 文件的修改。
- P0→P1→P2 顺序明确；P0 阻塞不能由 P1/P2 美化掩盖。
- 监督员是只读角色，progress 写回由协调器顺序完成。
- 文档要求真实 REST/WS/WebRTC/media/style 证据，并明确历史审计、静态检查和测试 double 的边界。
- 本设计不改变 API 契约、不声称服务已启动、不声称测试已运行、不声称任何产品功能已验证。

### 14.5 最终自审结论

设计覆盖了范围/延期项、dirty 工作区与 commit 边界、前后端分工、P0/P1 批次和依赖、导航/语音/屏幕/好友/通知/成员契约、错误回滚、安全边界、静态与运行时验证矩阵、最多四并发调度和验收标准。已显式处理历史文档与当前源码冲突、后端 dirty 状态、私聊实时性缺口、媒体 codec 证据和跨平台未执行边界。

结论仅为“设计文档自审通过”；不等于任何代码、测试、服务、联调、媒体或样式通过。
