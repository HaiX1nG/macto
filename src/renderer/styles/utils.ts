import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Kook 风格的按钮类名
 */
export function btnKook(variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary') {
  const variants = {
    primary: 'btn-kook-primary',
    secondary: 'btn-kook-secondary',
    ghost: 'btn-kook-ghost',
    danger: 'btn-kook-danger',
  }
  return cn('btn-kook', variants[variant])
}

/**
 * Kook 风格的输入框类名
 */
export function inputKook(size: 'sm' | 'md' | 'lg' = 'md') {
  const sizes = {
    sm: 'input-kook-sm',
    md: 'input-kook',
    lg: 'input-kook-lg',
  }
  return cn('input-kook', sizes[size])
}

/**
 * Kook 风格的卡片类名
 */
export function cardKook() {
  return 'card-kook'
}

/**
 * Kook 风格的标签类名
 */
export function tagKook(type: 'primary' | 'success' | 'warning' | 'danger' = 'primary') {
  const types = {
    primary: 'tag-kook-primary',
    success: 'tag-kook-success',
    warning: 'tag-kook-warning',
    danger: 'tag-kook-danger',
  }
  return cn('tag-kook', types[type])
}

/**
 * Kook 风格的徽章类名
 */
export function badgeKook(type: 'primary' | 'success' | 'warning' | 'danger' = 'primary') {
  const types = {
    primary: 'badge-kook-primary',
    success: 'badge-kook-success',
    warning: 'badge-kook-warning',
    danger: 'badge-kook-danger',
  }
  return cn('badge-kook', types[type])
}

/**
 * Kook 风格的头像类名
 */
export function avatarKook(size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md') {
  const sizes: Record<string, string> = {
    sm: 'avatar-kook',
    md: 'avatar-kook',
    lg: 'avatar-kook-lg',
    xl: 'avatar-kook-xl',
    '2xl': 'avatar-kook-2xl',
  }
  return cn('avatar-kook', sizes[size])
}

/**
 * Kook 风格的导航栏类名
 */
export function navKook() {
  return 'nav-kook'
}

/**
 * Kook 风格的侧边栏类名
 */
export function sidebarKook() {
  return 'sidebar-kook'
}

/**
 * Kook 风格的对话框类名
 */
export function modalKook() {
  return 'modal-kook'
}

/**
 * Kook 风格的分隔线类名
 */
export function dividerKook(vertical = false) {
  return vertical ? 'divider-kook-vertical' : 'divider-kook'
}

/**
 * Kook 风格的加载动画类名
 */
export function spinnerKook() {
  return 'spinner-kook'
}

/**
 * Kook 风格的悬浮提示类名
 */
export function tooltipKook() {
  return 'tooltip-kook'
}

/**
 * Kook 风格的玻璃态类名
 */
export function glassKook() {
  return 'glass-kook'
}

/**
 * 检查是否为暗色模式
 */
export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}
