import { Card, Row, Col, Typography } from 'antd'
import { DesktopOutlined, MobileOutlined, TabletOutlined } from '@ant-design/icons'
// // // import { cn } from '@renderer/utils/cn'

const { Title, Paragraph } = Typography

export function ResponsiveGridDemo() {
  return (
    <Card className="rounded-xl border-gray-200 dark:border-gray-800">
      <div className="mb-6">
        <Title level={4}>响应式布局示例</Title>
        <Paragraph type="secondary" className="text-sm">
          使用 Tailwind CSS 的响应式断点实现自适应布局
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {/* 移动端全宽 */}
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="text-center border-t-4 border-t-blue-500 hover:shadow-cardHover transition-shadow duration-200"
            styles={{ body: { padding: '24px' } }}
          >
            <DesktopOutlined className="text-4xl text-blue-500 mb-3" />
            <Title level={5} className="mb-2">桌面端</Title>
            <Paragraph type="secondary" className="text-xs mb-0">
              lg 断点及以上
            </Paragraph>
          </Card>
        </Col>

        {/* 平板端半宽 */}
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="text-center border-t-4 border-t-purple-500 hover:shadow-cardHover transition-shadow duration-200"
            styles={{ body: { padding: '24px' } }}
          >
            <TabletOutlined className="text-4xl text-purple-500 mb-3" />
            <Title level={5} className="mb-2">平板端</Title>
            <Paragraph type="secondary" className="text-xs mb-0">
              sm 断点及以上
            </Paragraph>
          </Card>
        </Col>

        {/* 移动端全宽 */}
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="text-center border-t-4 border-t-green-500 hover:shadow-cardHover transition-shadow duration-200"
            styles={{ body: { padding: '24px' } }}
          >
            <MobileOutlined className="text-4xl text-green-500 mb-3" />
            <Title level={5} className="mb-2">移动端</Title>
            <Paragraph type="secondary" className="text-xs mb-0">
              xs 断点及以上
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <Title level={5} className="mb-3">响应式断点说明</Title>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-600 dark:text-blue-400">xs:</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">&lt;576px</span>
          </div>
          <div>
            <span className="font-medium text-purple-600 dark:text-purple-400">sm:</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">&ge;576px</span>
          </div>
          <div>
            <span className="font-medium text-green-600 dark:text-green-400">md:</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">&ge;768px</span>
          </div>
          <div>
            <span className="font-medium text-orange-600 dark:text-orange-400">lg:</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">&ge;992px</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
