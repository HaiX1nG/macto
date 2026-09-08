---
name: 响应式布局优化任务
description: 前端响应式布局优化任务的详细需求和计划
type: project
---

## 任务概述

优化前端项目的响应式布局，使项目在不同屏幕尺寸下有更好的用户体验。

**Why:** 用户要求优化响应式布局，当前项目在三套主题（Sakura、Ancient、Tech）下的响应式体验需要改进。

**How to apply:** 当开发响应式相关功能时，参考此任务的优化方案。

## 当前状态分析

### 已读取的关键文件
1. `src/renderer/styles/index.css` - 响应式断点定义
2. `src/renderer/components/layout/MainLayout.tsx` - 主布局组件
3. `src/renderer/stores/layoutStore.ts` - 布局状态管理
4. `tailwind.config.ts` - Tailwind 配置
5. `src/renderer/components/layout/ServerSidebar.tsx` - 服务器侧边栏
6. `src/renderer/components/layout/ChannelSidebar.tsx` - 频道侧边栏
7. `src/renderer/components/layout/Header.tsx` - 头部组件
8. `src/renderer/components/chat/ChatView.tsx` - 聊天视图
9. `src/renderer/components/chat/MessageInput.tsx` - 消息输入框
10. `src/renderer/components/members/MemberList.tsx` - 成员列表

### 发现的问题
1. CSS 断点（768px、640px）与 Tailwind 默认断点不完全对齐
2. ServerSidebar 在移动端没有尺寸调整
3. ChannelSidebar 在移动端缺少抽屉式覆盖效果
4. 部分按钮触摸目标不足 44px

## 优化计划

### Phase 1: CSS 断点对齐
- 更新 `index.css` 中的媒体查询断点
- 添加 CSS 变量用于断点值

### Phase 2: layoutStore 增强
- 添加 `mobileChannelSidebarOpen` 状态
- 添加 `toggleMobileChannelSidebar` 方法
- 实现断点变化自动关闭逻辑

### Phase 3: 组件优化
1. **MainLayout**: 改进 Grid 模板计算逻辑
2. **ServerSidebar**: 移动端尺寸调整
3. **ChannelSidebar**: 添加抽屉式覆盖
4. **Header**: 响应式工具栏
5. **ChatView**: 头部工具栏响应式
6. **MessageInput**: 移动端适配

## 技术约束
- 使用 Tailwind CSS 响应式类
- 保持三套主题兼容
- 动画使用 CSS 变量
- 触摸目标至少 44px
