import { theme } from 'antd'
import { kookTheme } from './theme'

const { defaultAlgorithm, darkAlgorithm } = theme

const components = kookTheme.components ?? {}

export const kookAntdTheme = {
  ...kookTheme,
  algorithm: defaultAlgorithm,
  components: {
    Button: {
      ...components.Button,
      algorithm: true,
    },
    Input: {
      ...components.Input,
      algorithm: true,
    },
    Modal: {
      ...components.Modal,
      algorithm: true,
    },
    Card: {
      ...components.Card,
      algorithm: true,
    },
    Dropdown: {
      ...components.Dropdown,
      algorithm: true,
    },
    Menu: {
      ...components.Menu,
      algorithm: true,
    },
    Select: {
      ...components.Select,
      algorithm: true,
    },
    Checkbox: {
      ...components.Checkbox,
      algorithm: true,
    },
    Radio: {
      ...components.Radio,
      algorithm: true,
    },
    Switch: {
      ...components.Switch,
      algorithm: true,
    },
    Slider: {
      ...components.Slider,
      algorithm: true,
    },
    Table: {
      ...components.Table,
      algorithm: true,
    },
    Tag: {
      ...components.Tag,
      algorithm: true,
    },
    Tooltip: {
      ...components.Tooltip,
      algorithm: true,
    },
    Avatar: {
      ...components.Avatar,
      algorithm: true,
    },
    Progress: {
      ...components.Progress,
      algorithm: true,
    },
    Tabs: {
      ...components.Tabs,
      algorithm: true,
    },
    Drawer: {
      ...components.Drawer,
      algorithm: true,
    },
    Popover: {
      ...components.Popover,
      algorithm: true,
    },
    Message: {
      ...components.Message,
      algorithm: true,
    },
    Notification: {
      ...components.Notification,
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
    Button: {
      ...components.Button,
      algorithm: true,
    },
    Input: {
      ...components.Input,
      algorithm: true,
    },
    Modal: {
      ...components.Modal,
      algorithm: true,
    },
    Card: {
      ...components.Card,
      algorithm: true,
    },
    Dropdown: {
      ...components.Dropdown,
      algorithm: true,
    },
    Menu: {
      ...components.Menu,
      algorithm: true,
    },
    Select: {
      ...components.Select,
      algorithm: true,
    },
    Checkbox: {
      ...components.Checkbox,
      algorithm: true,
    },
    Radio: {
      ...components.Radio,
      algorithm: true,
    },
    Switch: {
      ...components.Switch,
      algorithm: true,
    },
    Slider: {
      ...components.Slider,
      algorithm: true,
    },
    Table: {
      ...components.Table,
      algorithm: true,
    },
    Tag: {
      ...components.Tag,
      algorithm: true,
    },
    Tooltip: {
      ...components.Tooltip,
      algorithm: true,
    },
    Avatar: {
      ...components.Avatar,
      algorithm: true,
    },
    Progress: {
      ...components.Progress,
      algorithm: true,
    },
    Tabs: {
      ...components.Tabs,
      algorithm: true,
    },
    Drawer: {
      ...components.Drawer,
      algorithm: true,
    },
    Popover: {
      ...components.Popover,
      algorithm: true,
    },
    Message: {
      ...components.Message,
      algorithm: true,
    },
    Notification: {
      ...components.Notification,
      algorithm: true,
    },
  },
}