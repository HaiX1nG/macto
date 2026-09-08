# Macto 项目 - 联合决策文档：无边框玻璃态设计方案

---

## 评审背景

本次评审的设计方案为 Macto 桌面应用（Electron + React）的 UI 升级方案。方案由设计师提出，经架构师、Electron 专家、设计师三方交叉评审后，现整合各方意见，输出本联合决策文档。

**参与评审方：**
- **设计师**：方案提出方
- **架构师**：评审布局可行性、组件复用性、性能影响
- **Electron 专家**：评审跨平台窗口、性能、IPC 通信、安全

---

## 一、各方共识（三方一致同意）

### 1.1 视觉方向

| 决策项 | 共识内容 |
|--------|----------|
| **设计风格** | 无边框玻璃态（frameless glassmorphism）作为核心视觉方向 |
| **主背景** | 亮色 `#fafafa` / 暗色 `#09090b` — 保持当前方案不变 |
| **强调色** | Sky-600 `#0284c7` — 色彩系统无需调整 |
| **圆角** | 基础 10px / 卡片 16px / 弹窗 20px — 符合 macOS 设计语言，一致通过 |
| **阴影** | `0 4px 24px rgba(0,0,0,0.06)` + inset 细边框 — 三方均认可该阴影的细腻程度 |

### 1.2 技术方案

| 决策项 | 共识内容 |
|--------|----------|
| **窗口模式** | `frame: false` + 自定义标题栏 — Electron 专家确认技术可行，设计师确认视觉方向 |
| **CSS Grid** | 布局与无边框设计兼容，继续使用现有 CSS Grid 方案 — 架构师确认兼容 |
| **AntD 迁移** | 长期方向是逐步迁移至 Radix，但非阻塞当前开发 — 三方均认可渐进式迁移策略 |
| **布局状态** | 布局偏好存储在 renderer 端，无需同步到主进程 — Electron 专家确认无 IPC 需求 |
| **安全性** | `layoutPreferencesStore` 持久化到 localStorage 风险可控（非敏感数据） — Electron 专家确认 |
| **IPC 通信** | 窗口控制（最小化/最大化/关闭）需要通过 IPC 桥接 — 三方一致同意 |

### 1.3 用户体验

| 决策项 | 共识内容 |
|--------|----------|
| **平台适配** | 接受 macOS/Windows/Linux 之间的视觉差异（按钮位置、阴影风格等），定义"平台适配层"而非维护两套规范 — 设计师与 Electron 专家达成一致 |
| **自定义标题栏** | 需实现双击最大化 — 设计师与 Electron 专家一致要求 |
| **拖拽区域** | 必须解决拖拽区域与交互元素重叠的问题 — 三方一致同意 |

---

## 二、争议点与解决方案

### 2.1 `backdrop-blur` 性能开销

| | 意见 |
|---|------|
| **架构师** | 5+ 重叠 blur 区域可达 10-20% GPU 开销，需封装 `GlassSurface` 组件实现自动降级 |
| **Electron 专家** | 4K 分辨率下开销明显，建议限制 blur 区域 |
| **设计师** | 视觉方向不变，但接受性能优化方案 |

**最终决策：采用性能分级策略**

- **方案**：封装 `GlassSurface` 组件，内置平台检测 + GPU 性能检测
  - **高性能设备**（独显 / M 系列芯片）：完整 glassmorphism
  - **中低性能设备**：降级为半透明 + 边框，移除 blur
  - **Electron 专家补充**：限制 blur 区域不超过 3 个，超出部分降级
- **验收标准**：通过 `requestAnimationFrame` 检测 GPU 帧率，连续 3 秒低于 30fps 时自动降级
- **实现方**：`ui-builder` Subagent

### 2.2 跨平台兼容方案

| | 意见 |
|---|------|
| **架构师** | Windows/Linux 需要 fallback 方案，但具体实现未明确 |
| **Electron 专家** | 平台差异可接受，滚动条建议平台自适应 |
| **设计师** | 平台差异可接受，滚动条需平台自适应 |

**最终决策：三层兼容架构**

1. **核心层**：统一 glassmorphism 视觉（所有平台）
2. **平台适配层**（新增）：
   - macOS：原生窗口控件风格、原生滚动条
   - Windows：适配 Windows 11 Mica/Acrylic 效果（如可用），否则使用统一 glassmorphism
   - Linux：简化 blur 效果，优先保证功能可用
3. **降级层**：通过 `GlassSurface` 组件自动降级

- **实现方**：`ui-builder` Subagent（平台适配层）、`electron-main` Subagent（窗口检测）

### 2.3 组件封装策略

| | 意见 |
|---|------|
| **架构师** | 封装 `GlassSurface` 组件，实现平台检测 + 自动降级 |
| **设计师** | 窗口控件使用语义化 button、添加 ARIA 属性 |
| **Electron 专家** | 自定义标题栏需实现右键菜单、双击最大化 |

**最终决策：统一封装 `GlassSurface` + `WindowControls` 组件**

- **GlassSurface 组件**：
  - 平台检测（macOS / Windows / Linux）
  - GPU 性能检测与自动降级
  - 应用背景：`rgba(255,255,255,0.72)` + `backdrop-blur-xl`
  - Inset 细边框
- **WindowControls 组件**：
  - 语义化 `<button>` 元素
  - ARIA 属性：`aria-label`（关闭/最小化/最大化）
  - 双击最大化支持
  - 右键菜单（还原、移动、大小、最小化、最大化、关闭）
- **实现方**：`ui-builder` Subagent

### 2.4 可访问性（a11y）优先级

| | 意见 |
|---|------|
| **设计师** | 需添加键盘导航、屏幕阅读器支持、`prefers-reduced-motion` 支持 |
| **架构师** | 未明确反对，但建议分阶段实施 |
| **Electron 专家** | 未明确反对，但建议非阻塞当前开发 |

**最终决策：分阶段实施**

- **P0（当前阶段）**：
  - `WindowControls` 组件 ARIA 属性
  - `prefers-reduced-motion` 媒体查询（动画降级）
- **P1（下一个迭代）**：
  - 键盘导航（Tab 顺序、快捷键）
- **P2（后续迭代）**：
  - 屏幕阅读器完整支持（需要更全面的测试）

---

## 三、修订后的设计草案

### 3.1 视觉规范

| 规范项 | 值 |
|--------|-----|
| **主背景（亮色）** | `#fafafa` |
| **主背景（暗色）** | `#09090b` |
| **玻璃表面** | `rgba(255,255,255,0.72)` + `backdrop-blur-xl`（高性能设备）；`rgba(255,255,255,0.85)`（降级） |
| **强调色** | Sky-600 `#0284c7` |
| **基础圆角** | 10px |
| **卡片圆角** | 16px |
| **弹窗圆角** | 20px |
| **阴影** | `0 4px 24px rgba(0,0,0,0.06)` |
| **inset 边框** | `inset 0 0 0 1px rgba(255,255,255,0.15)` |

### 3.2 组件规范

#### GlassSurface 组件

```typescript
interface GlassSurfaceProps {
  children: React.ReactNode;
  blur?: boolean;           // 默认 true，可强制关闭
  border?: boolean;           // 默认 true
  platform?: 'auto' | 'macos' | 'windows' | 'linux'; // 默认 auto
  fallbackToSolid?: boolean;  // 降级为纯色，默认 false（自动检测）
  className?: string;
}
```

**行为逻辑：**
1. 检测平台（`navigator.platform` / Electron API）
2. 检测 GPU 性能（可选，通过 `requestAnimationFrame` 帧率采样）
3. 自动降级：
   - 高帧率（>= 50fps）：完整 glassmorphism
   - 中帧率（30-50fps）：减少 blur 强度
   - 低帧率（< 30fps）：纯色半透明（无 blur）
   - `prefers-reduced-motion`：无 blur + 减少阴影

#### WindowControls 组件

```typescript
interface WindowControlsProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  // 双击最大化：组件内部实现
  // 右键菜单：组件内部实现
}
```

**行为要求：**
- 双击标题栏空白区域：最大化 / 还原
- 右键标题栏：显示系统右键菜单（还原、移动、大小、最小化、最大化、关闭）
- ARIA：`aria-label="Close window"`, `aria-label="Minimize window"`, `aria-label="Maximize window"`
- 键盘支持：Alt+F4 关闭，Cmd+M / Ctrl+M 最小化

### 3.3 平台适配层

| 平台 | 玻璃态效果 | 滚动条 | 窗口控件 | 备注 |
|------|-----------|--------|----------|------|
| **macOS** | 完整 blur | 原生（细滚动条） | 左侧（红/黄/绿） | 优先使用原生效果 |
| **Windows** | 完整 blur，4K 下限制 | 原生（宽滚动条） | 右侧（最大化/最小化/关闭） | 适配 Windows 11 Mica |
| **Linux** | 简化 blur（无 backdrop-filter 时降级） | 原生 | 右侧 | 优先保证功能 |

### 3.4 可访问性要求

| 要求 | 优先级 | 说明 |
|------|--------|------|
| `prefers-reduced-motion` 支持 | P0 | 减少/移除动画和 blur |
| 窗口控件 ARIA 属性 | P0 | `aria-label` |
| 键盘导航 | P1 | Tab 顺序、快捷键 |
| 屏幕阅读器 | P2 | 完整支持 |
| 高对比度模式 | P2 | Windows 高对比度主题适配 |

---

## 四、实施优先级

### P0 - 核心功能（阻塞上线）

| 序号 | 任务 | 负责人 | 依赖 |
|------|------|--------|------|
| 1 | 创建 `GlassSurface` 组件（含平台检测 + 自动降级） | `ui-builder` | - |
| 2 | 创建 `WindowControls` 组件（双击最大化、右键菜单、ARIA） | `ui-builder` | - |
| 3 | 无边框窗口配置（`frame: false` + 自定义标题栏） | `electron-main` | - |
| 4 | 窗口控制 IPC 桥接（最小化/最大化/关闭） | `electron-main` | #3 |
| 5 | `prefers-reduced-motion` 支持 | `ui-builder` | #1 |
| 6 | 暗色/亮色主题 glassmorphism 适配 | `ui-builder` | #1 |
| 7 | 集成测试（跨平台窗口控制、降级逻辑） | `test-engineer` | #1-#4 |

### P1 - 重要功能（下个迭代）

| 序号 | 任务 | 负责人 | 依赖 |
|------|------|--------|------|
| 8 | 键盘导航支持（Tab 顺序、快捷键） | `ui-builder` | P0 完成 |
| 9 | 平台自适应滚动条 | `ui-builder` | P0 完成 |
| 10 | GPU 性能检测自动降级（`requestAnimationFrame` 帧率采样） | `electron-main` | P0 完成 |
| 11 | AntD 组件迁移至 Radix（渐进式） | `ui-builder` | P0 完成 |
| 12 | 4K 分辨率性能优化（blur 区域限制） | `electron-main` | P0 完成 |

### P2 - 增强功能（后续迭代）

| 序号 | 任务 | 负责人 | 依赖 |
|------|------|--------|------|
| 13 | 屏幕阅读器完整支持 | `ui-builder` | P1 完成 |
| 14 | 高对比度模式（Windows） | `ui-builder` | P1 完成 |
| 15 | Windows 11 Mica/Acrylic 效果适配 | `electron-main` | P1 完成 |
| 16 | Linux 平台特殊适配（窗口管理器兼容性） | `electron-main` | P1 完成 |

---

## 五、风险提示

### 5.1 高风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **`backdrop-blur` 在某些 Linux 发行版上不可行** | 视觉回退严重，用户体验不一致 | 1. `GlassSurface` 组件必须包含 Linux 降级逻辑<br>2. 在 Ubuntu / Fedora / Arch 上提前测试<br>3. 准备纯色 fallback 方案 |
| **自定义标题栏拖拽与交互元素重叠** | 用户无法正常点击按钮、输入框 | 1. 严格定义 draggable 区域（`-webkit-app-region: drag`）<br>2. 交互元素添加 `-webkit-app-region: no-drag`<br>3. 在 `WindowControls` 中隔离处理 |
| **4K 分辨率下 GPU 开销导致卡顿** | 帧率下降，用户体验差 | 1. 限制 blur 区域不超过 3 个<br>2. 实现 GPU 性能检测自动降级<br>3. 提供手动关闭 blur 的选项 |

### 5.2 中风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **AntD 深度覆写导致维护成本上升** | 升级 AntD 时样式断裂 | 1. 渐进式迁移至 Radix<br>2. 覆写样式使用 CSS 变量而非硬编码<br>3. 建立 AntD 覆写文档 |
| **跨平台滚动条样式不一致** | 视觉不协调 | 1. 使用 `::-webkit-scrollbar` 自定义<br>2. 平台检测后应用不同样式<br>3. 提供手动覆盖选项 |
| **双击最大化与拖拽冲突** | 用户误操作 | 1. 双击区域限制在标题栏空白处<br>2. 300ms 内检测两次 click<br>3. 排除按钮区域 |

### 5.3 低风险（需关注）

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **`prefers-reduced-motion` 用户占比低但影响体验** | 动画敏感用户不适 | 1. 默认开启支持<br>2. 在设置中提供手动开关 |
| **localStorage 持久化布局偏好可能丢失** | 用户设置重置 | 1. 添加默认值回退<br>2. 未来考虑迁移到 Electron `safeStorage` |

---

## 六、验收标准

### 6.1 P0 验收清单

- [ ] macOS：无边框窗口正常显示，自定义标题栏可拖拽、可双击最大化、右键菜单正常
- [ ] Windows：无边框窗口正常显示，自定义标题栏可拖拽、可双击最大化、右键菜单正常
- [ ] Linux：无边框窗口正常显示，自定义标题栏可拖拽、可双击最大化、右键菜单正常
- [ ] `GlassSurface` 组件在高性能设备上显示完整 glassmorphism 效果
- [ ] `GlassSurface` 组件在低性能设备上自动降级为纯色半透明
- [ ] `prefers-reduced-motion` 开启时，blur 效果被移除
- [ ] 窗口控件（关闭/最小化/最大化）通过 IPC 正确触发主进程行为
- [ ] ARIA 属性在 screen reader 中正确朗读

### 6.2 P1 验收清单

- [ ] Tab 导航在自定义标题栏中正常工作
- [ ] 键盘快捷键（Alt+F4, Cmd+M/Ctrl+M）正常工作
- [ ] GPU 性能检测自动降级在 4K 分辨率下生效
- [ ] 平台自适应滚动条在各平台上显示正确
- [ ] AntD 迁移至 Radix 的第一批组件完成

---

## 七、附录

### 7.1 相关文件路径

- 设计规范：`/docs/design-system.md`（待创建）
- `GlassSurface` 组件：`src/renderer/components/ui/GlassSurface.tsx`
- `WindowControls` 组件：`src/renderer/components/ui/WindowControls.tsx`
- 无边框窗口配置：`src/main/index.ts`
- IPC 通信：`src/shared/types/ipc.ts`

### 7.2 参考链接

- [Electron frameless window](https://www.electronjs.org/docs/latest/api/frameless-window)
- [CSS backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

**文档版本**：v1.0  
**评审日期**：2026/05/27  
**参与方**：设计师、架构师、Electron 专家  
**状态**：已批准，进入 P0 实施阶段
