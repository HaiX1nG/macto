# 样式布局重构说明

## 概述

Macto 项目已完成样式布局重构，使用 **Ant Design** 组件库配合 **Tailwind CSS** 实现响应式布局，并支持明暗主题切换。

## 技术栈

- **Ant Design 6.x**: 企业级 UI 组件库
- **Tailwind CSS 4.x**: 实用优先的 CSS 框架
- **TypeScript**: 类型安全的开发体验

## 主要变更

### 1. 组件库迁移

#### 布局组件
- `Sidebar` - 使用 Ant Design `Layout.Sider` + `Menu`
- `Header` - 使用 Ant Design 布局 + 自定义样式
- `Content` - 使用 Ant Design 布局 + 自定义样式

#### UI 组件
- `Button` - 基于 Ant Design `Button` 封装
- `Card` - 基于 Ant Design `Card` 封装
- `Badge` - 基于 Ant Design `Tag` 封装
- `Input` - 基于 Ant Design `Input` 封装

### 2. 响应式布局

使用 Tailwind CSS 的响应式断点：

```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={8}>
    {/* 移动端全宽 */}
  </Col>
  <Col xs={24} sm={12} lg={8}>
    {/* 平板端半宽 */}
  </Col>
  <Col xs={24} sm={12} lg={8}>
    {/* 桌面端三分之一宽 */}
  </Col>
</Row>
```

**响应式断点：**
- `xs`: < 576px (移动端)
- `sm`: ≥ 576px (小屏幕)
- `md`: ≥ 768px (平板)
- `lg`: ≥ 992px (桌面)
- `xl`: ≥ 1200px (大桌面)
- `2xl`: ≥ 1536px (超大桌面)

### 3. 明暗主题切换

#### 主题配置
- 主题配置文件: `src/renderer/styles/antdTheme.ts`
- Tailwind 配置: `tailwind.config.ts`

#### 主题切换实现
```tsx
// 使用 AntdConfigProvider 包裹应用
<AntdConfigProvider>
  <App />
</AntdConfigProvider>

// 主题切换组件
<ThemeToggle />
```

#### 主题变量
```css
:root {
  --bg-color: #ffffff;
  --text-color: #111827;
  --border-color: #d9d9d9;
}

.dark {
  --bg-color: #0a0a0f;
  --text-color: #e0e0e0;
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### 4. 新增组件

#### ResponsiveGridDemo
响应式布局演示组件，展示如何使用 Tailwind CSS 实现自适应布局。

#### ThemeSettingsDemo
主题设置演示组件，展示主题切换和自定义主题配置。

### 5. 文件结构

```
src/renderer/
├── components/
│   ├── layout/
│   │   ├── AntdConfigProvider.tsx    # Ant Design 配置提供者
│   │   ├── Sidebar.tsx               # 侧边栏组件
│   │   ├── Header.tsx                # 头部组件
│   │   ├── Content.tsx               # 内容区域组件
│   │   ├── ResponsiveGridDemo.tsx    # 响应式布局演示
│   │   └── ThemeSettingsDemo.tsx     # 主题设置演示
│   └── ui/
│       ├── Button.tsx                # 按钮组件
│       ├── Card.tsx                  # 卡片组件
│       ├── Badge.tsx                 # 徽章组件
│       └── Input.tsx                 # 输入框组件
├── styles/
│   ├── index.css                     # 全局样式
│   ├── antdTheme.ts                  # Ant Design 主题配置
│   └── theme.ts                      # Tailwind 主题配置
└── App.tsx                           # 主应用组件
```

## 使用指南

### 使用 Ant Design 组件

```tsx
import { Button, Card, Space } from 'antd'

<Button type="primary">Primary Button</Button>
<Card title="Card Title">Content</Card>
<Space>Item 1 Item 2</Space>
```

### 使用 Tailwind CSS

```tsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl">
  <span className="text-gray-900 dark:text-white">Text</span>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    Click
  </button>
</div>
```

### 切换主题

```tsx
import { ThemeToggle } from '@renderer/components/layout/Sidebar'

// 添加到 HeaderActions
<HeaderActions>
  <ThemeToggle />
</HeaderActions>
```

## 自定义主题

### 自定义 Ant Design 主题

编辑 `src/renderer/styles/antdTheme.ts`:

```typescript
const kookTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontSize: 14,
  },
  components: {
    Button: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
    },
  },
}
```

### 自定义 Tailwind 主题

编辑 `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1890ff',
          hover: '#40a9ff',
        },
      },
    },
  },
}
```

## 运行项目

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行测试
pnpm test
```

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)

## 注意事项

1. 所有样式都支持明暗主题切换
2. 响应式布局在移动端、平板和桌面端都有良好表现
3. 使用 TypeScript 严格模式，避免 `any` 类型
4. 组件使用 `React.memo` 优化性能
5. 使用 `useMemo` 和 `useCallback` 避免不必要的重渲染
