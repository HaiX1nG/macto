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
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
    fontSize: 14,
    fontSizeLG: 15,
    fontSizeSM: 13,
    fontWeightStrong: 600,
    fontFamilyCode: 'Menlo, Monaco, Consolas, "Courier New", monospace',
  },
  components: {
    Button: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
      fontWeight: 600,
      colorPrimaryHover: '#40a9ff',
      colorPrimaryActive: '#096dd9',
    },
    Input: {
      borderRadius: 8,
      colorBorder: '#d9d9d9',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      fontSize: 14,
    },
    Modal: {
      borderRadiusLG: 16,
      colorBgContainer: '#ffffff',
    },
    Card: {
      borderRadiusLG: 16,
      colorBgContainer: '#ffffff',
    },
    Dropdown: {
      colorBgElevated: '#ffffff',
      borderRadiusLG: 12,
    },
    Menu: {
      colorBgElevated: '#f9fafb',
      borderRadiusLG: 12,
      itemHoverBg: '#f3f4f6',
      itemSelectedBg: '#1890ff',
      itemColor: '#374151',
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
    },
    Slider: {
      colorPrimary: '#1890ff',
      trackBg: '#e5e7eb',
      handleSize: 18,
      handleSizeHover: 20,
    },
    Table: {
      borderRadiusLG: 12,
      colorBgContainer: '#ffffff',
      colorBorder: '#e5e7eb',
      headerBg: '#f9fafb',
      rowHoverBg: '#f3f4f6',
    },
    Tag: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      fontSize: 12,
      paddingInline: 8,
    },
    Tooltip: {
      colorBgSpotlight: '#1f2937',
      colorText: '#ffffff',
      borderRadius: 8,
    },
    Avatar: {
      borderRadius: 50,
    },
    Progress: {
      colorPrimary: '#1890ff',
      borderRadius: 99,
      strokeLinecap: 'round',
    },
    Tabs: {
      colorPrimary: '#1890ff',
      inkBarColor: '#1890ff',
      itemActiveColor: '#1890ff',
      itemHoverColor: '#1890ff',
      borderRadiusLG: 12,
    },
    Drawer: {
      colorBgContainer: '#ffffff',
      borderRadiusLG: 16,
    },
    Popover: {
      colorBgElevated: '#ffffff',
      borderRadius: 12,
    },
    Message: {
      colorBgContainer: '#1f2937',
      colorText: '#ffffff',
      borderRadius: 8,
    },
    Notification: {
      colorBgContainer: '#ffffff',
      borderRadius: 12,
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