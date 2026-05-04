import { Card, Row, Col, Switch, Typography, Space } from 'antd'
import { MoonOutlined, SunOutlined, SettingOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

const { Title, Text } = Typography

export function ThemeSettingsDemo() {
  return (
    <Card className="rounded-xl border-gray-200 dark:border-gray-800">
      <div className="mb-6">
        <Title level={4}>主题设置</Title>
        <Text type="secondary" className="text-sm">
          配置应用的主题和外观
        </Text>
      </div>

      <Space direction="vertical" size="large" className="w-full">
        {/* 主题模式 */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <Space>
              <SunOutlined className="text-lg text-orange-500" />
              <div>
                <Title level={5} className="mb-0">明亮模式</Title>
                <Text type="secondary" className="text-xs">浅色背景，适合白天使用</Text>
              </div>
            </Space>
            <Switch defaultChecked />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <Space>
              <MoonOutlined className="text-lg text-blue-500" />
              <div>
                <Title level={5} className="mb-0">暗黑模式</Title>
                <Text type="secondary" className="text-xs">深色背景，适合夜间使用</Text>
              </div>
            </Space>
            <Switch />
          </div>
        </div>

        {/* 预设主题 */}
        <div>
          <Title level={5} className="mb-4">预设主题</Title>
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={8} md={6}>
              <div
                className={cn(
                  'p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:shadow-cardHover',
                  'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <Text className="text-sm">默认</Text>
                </div>
                <Text type="secondary" className="text-xs">Ant Design Blue</Text>
              </div>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <div
                className={cn(
                  'p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:shadow-cardHover',
                  'bg-[#001529] border-[#1890ff]'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-[#1890ff]" />
                  <Text className="text-sm text-white">深蓝</Text>
                </div>
                <Text className="text-xs text-gray-400">Ant Design Dark</Text>
              </div>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <div
                className={cn(
                  'p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:shadow-cardHover',
                  'bg-[#2c3e50] border-[#3498db]'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-[#3498db]" />
                  <Text className="text-sm text-white">极简</Text>
                </div>
                <Text className="text-xs text-gray-400">Minimal Blue</Text>
              </div>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <div
                className={cn(
                  'p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:shadow-cardHover',
                  'bg-[#1a1a1a] border-[#00f2ff]'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-[#00f2ff]" />
                  <Text className="text-sm text-white">赛博</Text>
                </div>
                <Text className="text-xs text-gray-400">Cyberpunk</Text>
              </div>
            </Col>
          </Row>
        </div>

        {/* 主题说明 */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start gap-3">
            <SettingOutlined className="text-blue-500 mt-0.5" />
            <div>
              <Title level={5} className="mb-2">自定义主题</Title>
              <Text type="secondary" className="text-xs mb-2">
                在 <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">src/renderer/styles/antdTheme.ts</code> 中可以自定义 Ant Design 组件的主题颜色。
              </Text>
              <Text type="secondary" className="text-xs">
                在 <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">tailwind.config.ts</code> 中可以自定义 Tailwind CSS 的颜色和间距。
              </Text>
            </div>
          </div>
        </div>
      </Space>
    </Card>
  )
}
