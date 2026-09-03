# FE-REVIEW 风险修复 Implementation Plan

## writing-plans

### Goal
- [ ] 修复 FE-REVIEW-001 消息分页重复与顺序问题，确保后端 DESC 分页结果稳定合并、消息 ID 去重，且临时消息不影响页码。
- [ ] 修复 FE-REVIEW-002，确保 `useRoomWebSocket` 是唯一的 screen `webrtc_signal` 分发入口，`useScreenShare` 不重复消费，同时保留屏幕共享 start/stop 能力。
- [ ] 修复 FE-REVIEW-003，确保 `webrtcManager` 的 screen manager 不添加 local audio，同时保持 voice manager 的音频协商行为不回归。

### Architecture
- [ ] 以 `chatStore` 的独立分页状态作为服务端页码推进的唯一依据，将服务端 DESC 结果转换并合并为稳定的消息集合；临时消息与服务端分页状态分离。
- [ ] 以 `useRoomWebSocket` 作为房间 WebSocket 的统一 screen 信令入口，screen 信令只路由到 screen manager 一次；`useScreenShare` 仅保留屏幕共享控制生命周期，不再建立重复信令消费路径。
- [ ] 以 WebRTC manager 的媒体类型职责隔离轨道添加逻辑：screen manager 只协商屏幕媒体，voice manager 继续按语音规则添加音频。

### Tech Stack
- [ ] React 19 + TypeScript strict mode。
- [ ] Zustand `chatStore` 状态管理。
- [ ] WebSocket `webrtc_signal` 事件分发。
- [ ] WebRTC `RTCPeerConnection` 与既有 `webrtcManager`。
- [ ] Vitest + React Testing Library；pnpm、TypeScript、ESLint。

## Files map

- [ ] `src/renderer/stores/chatStore.ts`：独立维护服务端分页页码/加载状态，合并 DESC 结果并按消息 ID 去重，排除临时消息的页码影响。
- [ ] `src/renderer/hooks/useRoomWebSocket.ts`：保留唯一 screen `webrtc_signal` 分发入口，覆盖统一 manager 路由行为。
- [ ] `src/renderer/hooks/useScreenShare.ts`：移除重复 screen 信令消费，仅保留 start/stop 及必要的屏幕共享生命周期逻辑。
- [ ] `src/renderer/utils/webrtcManager.ts`：按 manager 媒体类型限制轨道添加，screen manager 不添加 local audio，voice manager 行为保持不变。
- [ ] 对应必要测试文件：仅在证明上述修复所需时新增或修改，且不得超出授权前端文件范围。
- [ ] `docs/code-change-relay.md`：只读，不修改；每次修改代码前重新读取最新内容。

## Task 1：chatStore 分页与消息合并

- [ ] 修改 `chatStore` 或对应必要测试前，重新读取 `docs/code-change-relay.md`，确认 FE-REVIEW-001 授权范围和最新状态未变化。
- [ ] 先编写会失败的定向测试，覆盖：后端按 DESC 返回的连续分页不会把较新消息错误前置；跨页重叠消息按消息 ID 去重；临时消息不参与下一页页码推导；分页状态独立于展示消息列表。
- [ ] 运行精确失败测试命令：`pnpm exec vitest run src/renderer/stores/__tests__/chatStore.test.ts`；预期新增断言在最小实现前失败，失败原因应对应分页顺序、重复消息或临时消息页码问题。
- [ ] 以最小范围实现独立分页状态，使用服务端分页页码或等价的独立 next-page 状态推进请求；将 DESC 页面按现有 UI 展示顺序合并；插入服务端消息前按消息 ID 去重；临时消息保留在展示层但不计入分页页码。
- [ ] 重新运行精确测试命令：`pnpm exec vitest run src/renderer/stores/__tests__/chatStore.test.ts`；预期所有 chatStore 分页、顺序、去重和临时消息断言通过。
- [ ] 仅修改已授权的 `src/renderer/stores/chatStore.ts` 及证明修复必要的对应测试文件，不修改其他源代码、配置或 relay 文件。

## Task 2：统一 screen `webrtc_signal` 分发

- [ ] 修改 WebSocket/屏幕共享 Hook 或对应必要测试前，重新读取 `docs/code-change-relay.md`，确认 FE-REVIEW-002 授权范围和最新状态未变化。
- [ ] 先编写会失败的定向测试，覆盖：screen `webrtc_signal` 由 `useRoomWebSocket` 路由到 screen manager 一次；`useScreenShare` 不再重复消费同一信令；屏幕共享 start/stop 行为仍可用。
- [ ] 运行精确失败测试命令：`pnpm exec vitest run src/renderer/hooks/__tests__/useRoomWebSocket.test.ts src/renderer/hooks/__tests__/useScreenShare.test.ts`；预期新增断言在最小实现前失败，失败原因应对应重复监听或 start/stop 回归。
- [ ] 从 `useScreenShare` 移除重复的 screen `webrtc_signal` 监听/消费路径，保留 start/stop 及必要生命周期逻辑；确保 `useRoomWebSocket` 继续作为唯一入口并只向 screen manager 分发一次。
- [ ] 重新运行精确测试命令：`pnpm exec vitest run src/renderer/hooks/__tests__/useRoomWebSocket.test.ts src/renderer/hooks/__tests__/useScreenShare.test.ts`；预期信令单次分发及 start/stop 断言通过。
- [ ] 仅修改已授权的 `src/renderer/hooks/useRoomWebSocket.ts`、`src/renderer/hooks/useScreenShare.ts` 及证明修复必要的对应测试文件，不修改其他源代码、配置或 relay 文件。

## Task 3：隔离 screen/voice WebRTC 轨道

- [ ] 修改 `webrtcManager` 或对应必要测试前，重新读取 `docs/code-change-relay.md`，确认 FE-REVIEW-003 授权范围和最新状态未变化。
- [ ] 先编写会失败的定向测试，覆盖：screen manager 响应 screen offer 时不添加 local audio；voice manager 响应 voice offer 时仍添加所需 audio track；screen manager 的 answer 不出现由本地 voice stream 引入的 audio m-line。
- [ ] 运行精确失败测试命令：`pnpm exec vitest run src/renderer/utils/__tests__/webrtcManager.test.ts`；预期新增 screen/voice 轨道断言在最小实现前失败，失败原因应对应 screen manager 错误添加 audio 或 voice 行为变化。
- [ ] 在 `webrtcManager` 中按 manager 媒体类型限制 `handleOffer` 的本地轨道添加：screen manager 只添加 screen 轨道，voice manager 继续添加 local audio；保持现有 start/stop 与信令行为不变。
- [ ] 重新运行精确测试命令：`pnpm exec vitest run src/renderer/utils/__tests__/webrtcManager.test.ts`；预期 screen 不添加 audio、voice 不回归的断言全部通过。
- [ ] 仅修改已授权的 `src/renderer/utils/webrtcManager.ts` 及证明修复必要的对应测试文件，不修改其他源代码、配置或 relay 文件。

## 最终验证

- [ ] 修改任何代码前，最后一次涉及代码修改的执行者必须先重新读取 `docs/code-change-relay.md`，确认授权范围仍为四个指定源文件及必要测试文件。
- [ ] 运行全部本轮定向测试：`pnpm exec vitest run src/renderer/stores/__tests__/chatStore.test.ts src/renderer/hooks/__tests__/useRoomWebSocket.test.ts src/renderer/hooks/__tests__/useScreenShare.test.ts src/renderer/utils/__tests__/webrtcManager.test.ts`；记录实际通过/失败数量及失败原因。
- [ ] 运行类型检查：`pnpm exec tsc --noEmit`；记录实际输出。
- [ ] 对本轮改动文件运行定向 lint：`pnpm exec eslint src/renderer/stores/chatStore.ts src/renderer/hooks/useRoomWebSocket.ts src/renderer/hooks/useScreenShare.ts src/renderer/utils/webrtcManager.ts`，并按实际存在的必要测试文件补充路径；记录实际输出。
- [ ] 如需运行完整 `pnpm test -- --run` 或完整 `pnpm lint`，如实记录 `.claude/worktrees` 副本收集/`tsconfigRootDir` 候选路径阻塞，以及既有 `sessionStore` 测试请求旧 `/rooms` API 返回 404 的阻塞；不得将受阻的完整检查宣称为通过。
- [ ] 不运行或声称通过未被执行的应用端到端验证；如环境不支持运行时验证，记录未执行及解除条件。
- [ ] 完成后仅汇报实际修改文件、测试命令与结果、未解决阻塞；不提交计划文件。
