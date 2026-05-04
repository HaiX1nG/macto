import { theme } from 'antd'
import { kookTheme } from './theme'

const { defaultAlgorithm, darkAlgorithm } = theme

export const kookAntdTheme = {
  ...kookTheme,
  algorithm: defaultAlgorithm,
  components: {
    ...kookTheme.components,
    Button: {
      ...kookTheme.components.Button,
      algorithm: true,
    },
    Input: {
      ...kookTheme.components.Input,
      algorithm: true,
    },
    Modal: {
      ...kookTheme.components.Modal,
      algorithm: true,
    },
    Card: {
      ...kookTheme.components.Card,
      algorithm: true,
    },
    Dropdown: {
      ...kookTheme.components.Dropdown,
      algorithm: true,
    },
    Menu: {
      ...kookTheme.components.Menu,
      algorithm: true,
    },
    Select: {
      ...kookTheme.components.Select,
      algorithm: true,
    },
    Checkbox: {
      ...kookTheme.components.Checkbox,
      algorithm: true,
    },
    Radio: {
      ...kookTheme.components.Radio,
      algorithm: true,
    },
    Switch: {
      ...kookTheme.components.Switch,
      algorithm: true,
    },
    Slider: {
      ...kookTheme.components.Slider,
      algorithm: true,
    },
    Table: {
      ...kookTheme.components.Table,
      algorithm: true,
    },
    Tag: {
      ...kookTheme.components.Tag,
      algorithm: true,
    },
    Tooltip: {
      ...kookTheme.components.Tooltip,
      algorithm: true,
    },
    Avatar: {
      ...kookTheme.components.Avatar,
      algorithm: true,
    },
    Progress: {
      ...kookTheme.components.Progress,
      algorithm: true,
    },
    Tabs: {
      ...kookTheme.components.Tabs,
      algorithm: true,
    },
    Drawer: {
      ...kookTheme.components.Drawer,
      algorithm: true,
    },
    Popover: {
      ...kookTheme.components.Popover,
      algorithm: true,
    },
    Message: {
      ...kookTheme.components.Message,
      algorithm: true,
    },
    Notification: {
      ...kookTheme.components.Notification,
      algorithm: true,
    },
  },
}

export const kookDarkTheme = {
  ...kookTheme,
  algorithm: darkAlgorithm,
  token: {
    ...kookTheme.token,
    colorBgContainer: '#0a0a0f',
    colorBgElevated: '#12121a',
    colorBgLayout: '#0a0a0f',
    colorBgSpotlight: '#1a1a25',
    colorText: '#e0e0e0',
    colorTextSecondary: '#8a8a9a',
    colorTextTertiary: '#5a5a6a',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
  },
  components: {
    ...kookTheme.components,
    Button: {
      ...kookTheme.components.Button,
      algorithm: true,
    },
    Input: {
      ...kookTheme.components.Input,
      algorithm: true,
    },
    Modal: {
      ...kookTheme.components.Modal,
      algorithm: true,
    },
    Card: {
      ...kookTheme.components.Card,
      algorithm: true,
    },
    Dropdown: {
      ...kookTheme.components.Dropdown,
      algorithm: true,
    },
    Menu: {
      ...kookTheme.components.Menu,
      algorithm: true,
    },
    Select: {
      ...kookTheme.components.Select,
      algorithm: true,
    },
    Checkbox: {
      ...kookTheme.components.Checkbox,
      algorithm: true,
    },
    Radio: {
      ...kookTheme.components.Radio,
      algorithm: true,
    },
    Switch: {
      ...kookTheme.components.Switch,
      algorithm: true,
    },
    Slider: {
      ...kookTheme.components.Slider,
      algorithm: true,
    },
    Table: {
      ...kookTheme.components.Table,
      algorithm: true,
    },
    Tag: {
      ...kookTheme.components.Tag,
      algorithm: true,
    },
    Tooltip: {
      ...kookTheme.components.Tooltip,
      algorithm: true,
    },
    Avatar: {
      ...kookTheme.components.Avatar,
      algorithm: true,
    },
    Progress: {
      ...kookTheme.components.Progress,
      algorithm: true,
    },
    Tabs: {
      ...kookTheme.components.Tabs,
      algorithm: true,
    },
    Drawer: {
      ...kookTheme.components.Drawer,
      algorithm: true,
    },
    Popover: {
      ...kookTheme.components.Popover,
      algorithm: true,
    },
    Message: {
      ...kookTheme.components.Message,
      algorithm: true,
    },
    Notification: {
      ...kookTheme.components.Notification,
      algorithm: true,
    },
  },
}
