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
        // 基础颜色
        bg: {
          light: '#ffffff',
          dark: '#0a0a0f',
        },
        text: {
          light: '#111827',
          dark: '#e0e0e0',
        },
        // Ant Design 颜色
        primary: {
          DEFAULT: '#1890ff',
          hover: '#40a9ff',
          active: '#096dd9',
        },
        success: {
          DEFAULT: '#52c41a',
          light: '#f6ffed',
          lightHover: '#d9f7be',
          lightActive: '#b7eb8f',
        },
        warning: {
          DEFAULT: '#faad14',
          light: '#fffbe6',
          lightHover: '#ffe58f',
          lightActive: '#ffd666',
        },
        error: {
          DEFAULT: '#f5222d',
          light: '#fff1f0',
          lightHover: '#ffccc7',
          lightActive: '#ffa39e',
        },
        info: {
          DEFAULT: '#1890ff',
          light: '#e6f7ff',
          lightHover: '#bae7ff',
          lightActive: '#91d5ff',
        },
        // 玻璃态效果
        glass: {
          light: 'rgba(255, 255, 255, 0.8)',
          dark: 'rgba(10, 10, 15, 0.8)',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'scifi': '0 0 20px rgba(0, 0, 0, 0.3)',
        'scifiHover': '0 0 30px rgba(0, 0, 0, 0.4)',
        'scifiLight': '0 0 50px rgba(0, 0, 0, 0.5)',
        'scifiGlow': '0 0 20px rgba(0, 240, 255, 0.1)',
        'scifiGlowHover': '0 0 30px rgba(0, 240, 255, 0.2)',
        // Ant Design 风格阴影
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'cardHover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'floating': '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      backdropBlur: {
        'scifi': '20px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scanline': 'scanline 3s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
