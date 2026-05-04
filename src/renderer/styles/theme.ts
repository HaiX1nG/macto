import type { ThemeConfig } from 'antd'
import type { Config } from 'tailwindcss'

const kookTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    fontSize: 14,
    fontSizeLG: 15,
    fontSizeSM: 13,
    fontWeightStrong: 600,
    fontFamilyCode: [
      'Menlo',
      'Monaco',
      'Consolas',
      '"Courier New"',
      'monospace',
    ],
  },
  components: {
    Button: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
      fontWeight: 600,
      boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
      boxShadowHover: '0 4px 16px rgba(24, 144, 255, 0.4)',
      colorPrimaryHover: '#40a9ff',
      colorPrimaryActive: '#096dd9',
    },
    Input: {
      borderRadius: 8,
      colorBorder: '#d9d9d9',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      paddingLG: 10,
      fontSize: 14,
    },
    Modal: {
      borderRadiusLG: 16,
      colorBgContainer: '#ffffff',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    },
    Card: {
      borderRadiusLG: 16,
      colorBgContainer: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    Dropdown: {
      colorBgElevated: '#ffffff',
      borderRadiusLG: 12,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    },
    Menu: {
      colorBgElevated: '#f9fafb',
      borderRadiusLG: 12,
      itemBgHover: '#f3f4f6',
      itemBgSelected: '#1890ff',
      itemColor: '#374151',
      itemColorSelected: '#ffffff',
      itemHoverBg: '#f3f4f6',
      itemSelectedBg: '#1890ff',
      groupBorderColor: '#e5e7eb',
      subMenuItemBg: '#f9fafb',
    },
    Select: {
      borderRadius: 8,
      colorBgContainer: '#ffffff',
      colorBorder: '#d9d9d9',
      optionSelectedBg: '#1890ff',
      optionSelectedColor: '#ffffff',
      optionActiveBg: '#f3f4f6',
    },
    Checkbox: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
    },
    Radio: {
      colorPrimary: '#1890ff',
      borderRadius: 50,
    },
    Switch: {
      colorPrimary: '#1890ff',
      handleSize: 20,
      trackSize: 40,
    },
    Slider: {
      colorPrimary: '#1890ff',
      trackBg: '#e5e7eb',
      handleSize: 18,
      handleSizeHover: 20,
      handleSizeActive: 20,
    },
    Table: {
      borderRadiusLG: 12,
      colorBgContainer: '#ffffff',
      colorBorder: '#e5e7eb',
      headerBg: '#f9fafb',
      rowHoverBg: '#f3f4f6',
      cellPaddingLG: 12,
    },
    Tag: {
      colorPrimary: '#1890ff',
      colorPrimaryBorder: '#1890ff',
      borderRadius: 6,
      fontSize: 12,
      paddingBlock: 2,
      paddingInline: 8,
    },
    Tooltip: {
      colorBg: '#1f2937',
      colorText: '#ffffff',
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    },
    Avatar: {
      borderRadius: 50,
      size: 32,
      sizeLG: 40,
      sizeSM: 24,
    },
    Progress: {
      colorPrimary: '#1890ff',
      trailColor: '#e5e7eb',
      borderRadius: 99,
      strokeLinecap: 'round',
    },
    Tabs: {
      colorPrimary: '#1890ff',
      cardBg: '#ffffff',
      inkBarColor: '#1890ff',
      itemActiveColor: '#1890ff',
      itemHoverColor: '#1890ff',
      itemInactiveColor: '#6b7280',
      borderRadiusLG: 12,
    },
    Drawer: {
      colorBgContainer: '#ffffff',
      borderRadiusLG: 16,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    },
    Popover: {
      colorBg: '#ffffff',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    },
    message: {
      colorBg: '#1f2937',
      colorText: '#ffffff',
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    },
    notification: {
      colorBg: '#ffffff',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    },
  },
}

const tailwindConfig: Config = {
  content: [
    './index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/main/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          light: '#ffffff',
          dark: '#0a0a0f',
        },
        text: {
          light: '#111827',
          dark: '#e0e0e0',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

export { kookTheme, tailwindConfig }
