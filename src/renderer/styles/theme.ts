import type { ThemeConfig } from 'antd'

/**
 * 获取主题对应的 Ant Design 配置
 * @param theme - 主题名称 ('sakura' | 'ancient' | 'tech')
 */
export function getAntdThemeConfig(theme: string): ThemeConfig {
  const themes: Record<string, ThemeConfig> = {
    sakura: {
      token: {
        colorPrimary: '#f8b4c4',
        colorSuccess: '#7ec699',
        colorWarning: '#f0b232',
        colorError: '#e57373',
        colorInfo: '#f8b4c4',
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
    },
    ancient: {
      token: {
        colorPrimary: '#c9a86c',
        colorSuccess: '#6b8e5a',
        colorWarning: '#c9a86c',
        colorError: '#a85454',
        colorInfo: '#c9a86c',
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
    },
    tech: {
      token: {
        colorPrimary: '#00d4ff',
        colorSuccess: '#00ff88',
        colorWarning: '#ffcc00',
        colorError: '#ff4757',
        colorInfo: '#00d4ff',
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
    },
  }

  return themes[theme] ?? themes.tech
}

/**
 * 默认 Ant Design 主题配置
 * 用于 Ant Design 组件的基础样式配置
 */
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

/**
 * 主题颜色定义
 */
export const themeColors = {
  sakura: {
    primary: '#f8b4c4',
    secondary: '#ffd6e0',
    accent: '#e891a2',
    bgBase: '#fff5f7',
    bgSecondary: '#ffeef1',
    textNormal: '#4a2c3a',
    textMuted: '#7d5a68',
    border: '#f5d0d8',
  },
  ancient: {
    primary: '#c9a86c',
    secondary: '#d4b896',
    accent: '#8b6914',
    bgBase: '#1a1612',
    bgSecondary: '#231e19',
    textNormal: '#f0e6d8',
    textMuted: '#c4b49c',
    border: '#4a3f35',
  },
  tech: {
    primary: '#00d4ff',
    secondary: '#0099cc',
    accent: '#7b2dff',
    bgBase: '#0a0e17',
    bgSecondary: '#0f1520',
    textNormal: '#f0faff',
    textMuted: '#8fa8c4',
    border: '#1e2d42',
  },
} as const

export type ThemeName = keyof typeof themeColors

export { kookTheme }
