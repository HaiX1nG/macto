---
name: ws-dual-token-fix
description: WebSocket double-token bug (401) and the fix in WebSocketService.connect()
metadata:
  type: project
---

WebSocket 连接双 token 拼接 bug 已修复（2026-08-09）。

**根因**：`wsConnection.buildUrl()` 已用 `url.searchParams.set('token', token)` 生成 `?token=X`，但这个 URL 又作为 `options.url` 传入 `WebSocketService.connect()`，后者（旧逻辑 73-74 行）检测到 `effectiveToken` 后又用模板字符串拼了一次，得到 `?token=X?token=X`。后端 Go `c.Query("token")` 只取第一个匹配 → 401。

**修复（方案2，改动最小）**：在 `WebSocketService.connect()`（src/renderer/services/websocketService.ts）中，先用 `new URL(this.options.url).searchParams.has('token')` 判断 URL 是否已含 token 参数；若已包含则直接原样使用 `this.options.url`，不再拼接。仅当 URL 无 token 且确有空 `effectiveToken` 时才补。

**关键约束（保留的既有机制）**：
- `this.effectiveToken` 来源链仍是 `token ?? this.tokenProvider?.() ?? this.token`——token persist / tokenProvider 刷新逻辑未动，仍为"无 token 的 URL"补充 token。
- `wsConnection.ts` 与 `websocketService.ts` 两条连接路径并存：前者 URL 自带 token，后者依赖 effectiveToken 补充。

四项验证均通过：`pnpm lint`、`pnpm exec tsc --noEmit`、`pnpm test`（186 tests pass）、`pnpm build`。
