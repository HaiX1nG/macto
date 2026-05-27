import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名
 * 自动处理类名冲突，后面的类名优先级更高
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 检查是否为暗色模式
 */
export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

/**
 * 获取当前主题
 */
export function getCurrentTheme(): string {
  return document.documentElement.getAttribute('data-theme') ?? 'tech'
}

/**
 * 设置主题
 */
export function setTheme(theme: string): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * 条件性类名助手
 * @example conditionalClasses({ 'bg-red-500': isError, 'text-white': true })
 */
export function conditionalClasses(classes: Record<string, boolean>): string {
  return cn(
    ...Object.entries(classes)
      .filter(([, condition]) => condition)
      .map(([className]) => className)
  )
}

/**
 * 创建变体类名助手
 * @example createVariant({ primary: 'bg-blue-500', secondary: 'bg-gray-500' }, 'primary')
 */
export function createVariant<T extends string>(
  variants: Record<T, string>,
  variant: T
): string {
  return variants[variant] ?? ''
}

/**
 * 合并多个样式对象
 */
export function mergeStyles<T extends Record<string, unknown>>(
  ...styles: (T | undefined)[]
): T {
  return Object.assign({}, ...styles.filter(Boolean))
}

/**
 * 创建响应式类名
 * @example responsive('text-sm', { md: 'text-base', lg: 'text-lg' })
 */
export function responsive(
  baseClass: string,
  breakpoints?: Record<string, string>
): string {
  const classes = [baseClass]

  if (breakpoints) {
    Object.entries(breakpoints).forEach(([bp, className]) => {
      classes.push(`${bp}:${className}`)
    })
  }

  return cn(classes)
}

/**
 * 状态类名助手
 */
export const stateClasses = {
  hover: 'hover:bg-surface-hover',
  active: 'active:bg-surface-active',
  focus: 'focus:ring-2 focus:ring-primary focus:ring-offset-2',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const

/**
 * 常用布局类名
 */
export const layoutClasses = {
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',
  flexCol: 'flex flex-col',
  flexColCenter: 'flex flex-col items-center justify-center',
  absoluteCenter: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  absoluteFill: 'absolute inset-0',
} as const

/**
 * 文本工具类
 */
export const textClasses = {
  truncate: 'truncate',
  lineClamp2: 'line-clamp-2',
  lineClamp3: 'line-clamp-3',
  ellipsis: 'overflow-hidden text-ellipsis whitespace-nowrap',
} as const

/**
 * 过渡动画类
 * 使用精确的过渡属性代替 transition-all，提升渲染性能
 */
export const transitionClasses = {
  fast: 'transition-colors duration-fast ease-out',
  normal: 'transition-colors duration-normal ease-out',
  slow: 'transition-colors duration-slow ease-out',
  colors: 'transition-colors duration-normal ease-out',
  transform: 'transition-transform duration-normal ease-out',
  opacity: 'transition-opacity duration-normal ease-out',
  shadow: 'transition-shadow duration-normal ease-out',
  all: 'transition-all duration-normal ease-out',
} as const

/**
 * 动画时间 Token（与 CSS 变量保持一致）
 */
export const DURATION = {
  fast: 'var(--duration-fast)',
  normal: 'var(--duration-normal)',
  slow: 'var(--duration-slow)',
  verySlow: 'var(--duration-very-slow)',
} as const

/**
 * 动画时间 Token 的数值版本（单位: ms），用于 JS 计算
 */
export const DURATION_MS = {
  fast: 150,
  normal: 200,
  slow: 300,
  verySlow: 500,
} as const

/**
 * Easing Token（与 CSS 变量保持一致）
 */
export const EASING = {
  default: 'var(--ease-default)',
  in: 'var(--ease-in)',
  out: 'var(--ease-out)',
  inOut: 'var(--ease-in-out)',
} as const

/**
 * Easing Token 的原始值，用于 JS 计算
 */
export const EASING_RAW = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

/**
 * 动画常量对象 - 集中管理动画参数
 */
export const ANIMATION = {
  duration: DURATION,
  durationMs: DURATION_MS,
  easing: EASING,
  easingRaw: EASING_RAW,
} as const

/**
 * 交错延迟计算
 * 用于列表项逐个出现的动画效果
 * @param index - 元素索引（从 0 开始）
 * @param baseDelay - 基础延迟（单位: ms），默认 50ms
 * @returns CSS 延迟值字符串
 */
export function staggerDelay(index: number, baseDelay: number = 50): string {
  return `${index * baseDelay}ms`
}

/**
 * 生成过渡字符串
 * 用于内联样式中生成精确的 transition 属性值
 * @param properties - 过渡属性名或属性名数组
 * @param duration - 持续时间，默认使用 normal token
 * @param easing - 缓动函数，默认使用 ease-out token
 * @returns CSS transition 字符串
 */
export function getTransition(
  properties: string | string[],
  duration: string = DURATION.normal,
  easing: string = EASING.out
): string {
  const props = Array.isArray(properties) ? properties : [properties]
  return props.map((prop) => `${prop} ${duration} ${easing}`).join(', ')
}

/**
 * 阴影类
 */
export const shadowClasses = {
  soft: 'shadow-soft',
  md: 'shadow-soft-md',
  lg: 'shadow-soft-lg',
  card: 'shadow-card hover:shadow-card-hover transition-shadow',
  floating: 'shadow-floating',
  glow: 'shadow-glow',
} as const

/**
 * 圆角类
 */
export const radiusClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  default: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const