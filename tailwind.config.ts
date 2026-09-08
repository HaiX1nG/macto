import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/main/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 主题颜色 - 通过 CSS 变量实现主题切换
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        // 背景颜色
        'bg-base': 'var(--color-bg-base)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-darker': 'var(--color-bg-darker)',
        'bg-darkest': 'var(--color-bg-darkest)',
        // 文本颜色
        'text-normal': 'var(--color-text-normal)',
        'text-muted': 'var(--color-text-muted)',
        // 边框颜色
        border: 'var(--color-border)',
        // 状态颜色
        online: 'var(--color-online)',
        idle: 'var(--color-idle)',
        dnd: 'var(--color-dnd)',
        // 语义化颜色
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        'surface-active': 'var(--color-surface-active)',
        divider: 'var(--color-divider)',
        'text-inverse': 'var(--color-text-inverse)',
        link: 'var(--color-link)',
        overlay: 'var(--color-overlay)',
        // Ant Design 兼容颜色
        success: {
          DEFAULT: '#52c41a',
          light: '#f6ffed',
        },
        warning: {
          DEFAULT: '#faad14',
          light: '#fffbe6',
        },
        error: {
          DEFAULT: '#f5222d',
          light: '#fff1f0',
        },
        info: {
          DEFAULT: '#1890ff',
          light: '#e6f7ff',
        },
        // 玻璃态效果
        glass: {
          light: 'rgba(255, 255, 255, 0.8)',
          dark: 'rgba(10, 10, 15, 0.8)',
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'floating': '0 8px 32px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px var(--color-primary)',
        'glow-sm': '0 0 10px var(--color-primary)',
        'glow-lg': '0 0 30px var(--color-primary)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        // 基础动画 - 使用 CSS 变量
        'fade-in': 'fade-in var(--duration-normal) var(--ease-out)',
        'fade-out': 'fade-out var(--duration-normal) var(--ease-out)',
        'fade-in-up': 'fade-in-up var(--duration-slow) var(--ease-out)',
        'fade-in-down': 'fade-in-down var(--duration-slow) var(--ease-out)',
        'scale-in': 'scale-in var(--duration-normal) var(--ease-out)',
        'scale-out': 'scale-out var(--duration-normal) var(--ease-out)',
        'slide-in-up': 'slide-in-up var(--duration-slow) var(--ease-out)',
        'slide-in-down': 'slide-in-down var(--duration-slow) var(--ease-out)',
        'slide-in-left': 'slide-in-left var(--duration-slow) var(--ease-out)',
        'slide-in-right': 'slide-in-right var(--duration-slow) var(--ease-out)',
        'bounce-in': 'bounce-in 0.4s var(--ease-out)',
        // 消息动画 - 消息出现时从下往上滑入
        'message-in': 'message-in var(--duration-slow) var(--ease-out)',
        // 特殊动画
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 2s var(--ease-in-out) infinite',
        'shimmer': 'shimmer 2s var(--ease-in-out) infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.95)' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-down': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'message-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'very-slow': 'var(--duration-very-slow)',
      },
      transitionTimingFunction: {
        'default': 'var(--ease-default)',
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
    },
  },
  plugins: [],
} satisfies Config
