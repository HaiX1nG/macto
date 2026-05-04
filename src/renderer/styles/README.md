# Kook 风格样式集成

本项目已成功整合 Ant Design + Tailwind CSS，实现了类似 Kook 的风格设计。

## 🎨 设计特点

### Kook 风格配色
- **主色调**: `#FFC300` (黄色)
- **背景色**: 白色/浅灰
- **文字色**: 深灰/黑色
- **圆角**: 8px (小), 12px (中), 16px (大)
- **阴影**: 轻量级阴影效果

### 核心组件

#### 1. 按钮组件
```tsx
import { Button } from 'antd'
import { btnKook } from '@renderer/styles/utils'

// 主色调按钮
<Button type="primary" className={btnKook()}>
  主要按钮
</Button>

// 次要按钮
<Button className={btnKook('secondary')}>
  次要按钮
</Button>

// 幽灵按钮
<Button className={btnKook('ghost')}>
  幽灵按钮
</Button>

// 危险按钮
<Button className={btnKook('danger')}>
  危险操作
</Button>
```

#### 2. 输入框组件
```tsx
import { Input } from 'antd'
import { inputKook } from '@renderer/styles/utils'

// 标准输入框
<Input className={inputKook()} placeholder="输入内容" />

// 大号输入框
<Input className={inputKook('lg')} placeholder="大号输入框" />

// 小号输入框
<Input className={inputKook('sm')} placeholder="小号输入框" />
```

#### 3. 卡片组件
```tsx
import { Card } from 'antd'
import { cardKook } from '@renderer/styles/utils'

<Card className={cardKook()}>
  卡片内容
</Card>
```

#### 4. 标签组件
```tsx
import { Tag } from 'antd'
import { tagKook } from '@renderer/styles/utils'

<Tag className={tagKook('primary')}>主要标签</Tag>
<Tag className={tagKook('success')}>成功</Tag>
<Tag className={tagKook('warning')}>警告</Tag>
<Tag className={tagKook('danger')}>危险</Tag>
```

#### 5. 徽章组件
```tsx
import { Badge } from 'antd'
import { badgeKook } from '@renderer/styles/utils'

<Badge className={badgeKook('primary')} count="99+">消息</Badge>
<Badge className={badgeKook('success')} count="3">通知</Badge>
<Badge className={badgeKook('warning')} count="5">待办</Badge>
<Badge className={badgeKook('danger')} count="2">错误</Badge>
```

#### 6. 头像组件
```tsx
import { Avatar } from 'antd'
import { avatarKook } from '@renderer/styles/utils'

<Avatar className={avatarKook('sm')} src="..." />
<Avatar className={avatarKook('md')} src="..." />
<Avatar className={avatarKook('lg')} src="..." />
<Avatar className={avatarKook('xl')} src="..." />
<Avatar className={avatarKook('2xl')} src="..." />
```

### Tailwind CSS 工具类

#### Kook 专用颜色
```tsx
// 主色调
bg-kook-primary    // #FFC300
text-kook-primary  // #FFC300

// 背景色
bg-kook-bg         // #FFFFFF
bg-kook-bg-secondary  // #F9FAFB
bg-kook-bg-tertiary   // #F3F4F6

// 文字色
text-kook-text         // #111827
text-kook-text-secondary // #6B7280
text-kook-text-tertiary // #9CA3AF

// 边框色
border-kook-border        // #E5E7EB
border-kook-border-hover  // #D1D5DB

// 阴影
shadow-kook        // 0 2px 8px rgba(0, 0, 0, 0.08)
shadow-kookHover   // 0 4px 16px rgba(0, 0, 0, 0.12)
shadow-kookLight   // 0 8px 32px rgba(0, 0, 0, 0.15)
```

#### 圆角工具
```tsx
rounded-kook    // 8px
rounded-kookLG  // 12px
rounded-kookXL  // 16px
```

#### 自定义组件类
```tsx
// 按钮
btn-kook
btn-kook-primary
btn-kook-secondary
btn-kook-ghost
btn-kook-danger

// 输入框
input-kook
input-kook-lg
input-kook-sm

// 卡片
card-kook

// 标签
tag-kook
tag-kook-primary
tag-kook-success
tag-kook-warning
tag-kook-danger

// 徽章
badge-kook
badge-kook-primary
badge-kook-success
badge-kook-warning
badge-kook-danger

// 头像
avatar-kook
avatar-kook-lg
avatar-kook-xl
avatar-kook-2xl

// 导航栏
nav-kook

// 侧边栏
sidebar-kook

// 对话框
modal-kook

// 分隔线
divider-kook
divider-kook-vertical

// 加载动画
spinner-kook

// 悬浮提示
tooltip-kook

// 玻璃态
glass-kook
```

## 📁 文件结构

```
src/renderer/styles/
├── index.css          # 全局样式和组件类
├── theme.ts           # Kook 主题配置
├── antdTheme.ts       # Ant Design 主题配置
└── utils.ts           # 样式工具函数
```

## 🎯 使用示例

### 完整示例
```tsx
import React from 'react'
import { Button, Input, Card, Tag, Avatar, Space } from 'antd'
import { UserOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { btnKook, inputKook, cardKook, tagKook, avatarKook } from '@renderer/styles/utils'

export default function Example() {
  return (
    <div className="p-8">
      <Card className={cardKook()}>
        <div className="flex items-center gap-4 mb-6">
          <Avatar className={avatarKook('lg')} src="https://..." />
          <div>
            <h2 className="text-xl font-bold text-gray-900">用户信息</h2>
            <div className="flex items-center gap-2 mt-1">
              <Tag className={tagKook('success')}>在线</Tag>
              <Tag className={tagKook('primary')}>管理员</Tag>
            </div>
          </div>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            className={inputKook()}
            prefix={<SearchOutlined />}
            placeholder="搜索..."
          />
          <div className="flex gap-3">
            <Button type="primary" className={btnKook()}>
              <PlusOutlined /> 新建
            </Button>
            <Button className={btnKook('secondary')}>
              取消
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  )
}
```

## 🌙 暗色模式

暗色模式已完全支持，使用 Ant Design 的 `darkAlgorithm`：

```tsx
<ConfigProvider
  theme={theme === 'dark' ? kookDarkTheme : kookAntdTheme}
  prefixCls="kook"
>
  <App />
</ConfigProvider>
```

## 🎭 动画效果

Kook 风格包含以下动画效果：

- **按钮悬停**: 轻微放大 + 阴影增强
- **卡片悬停**: 上浮效果
- **输入框聚焦**: 环形光晕效果
- **加载动画**: Kook 风格旋转加载器

## 🔄 主题定制

如需修改 Kook 风格，编辑以下文件：

1. **`src/renderer/styles/theme.ts`** - Tailwind CSS 主题配置
2. **`src/renderer/styles/antdTheme.ts`** - Ant Design 主题配置

## 📦 依赖包

已安装的关键依赖：
- `antd` - Ant Design UI 组件库
- `@ant-design/icons` - Ant Design 图标
- `clsx` - 类名合并工具
- `tailwind-merge` - Tailwind CSS 类名合并

## 🚀 快速开始

1. 在组件中导入需要的工具函数：
```tsx
import { btnKook, inputKook, cardKook } from '@renderer/styles/utils'
```

2. 使用对应的类名：
```tsx
<Button className={btnKook()}>按钮</Button>
```

3. 查看完整示例组件：
```tsx
import KookStyleDemo from '@renderer/components/KookStyleDemo'
```
