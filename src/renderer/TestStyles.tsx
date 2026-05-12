import { Button, Input, Card, Tag, Badge, Avatar, Space, Switch, Progress, Tabs } from 'antd'
import { UserOutlined, SearchOutlined } from '@ant-design/icons'
import '../styles/index.css'

export default function TestStyles() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Kook 风格样式测试</h1>

        {/* 按钮测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">按钮组件</h2>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button type="primary" style={{ backgroundColor: '#FFC300', borderColor: '#FFC300' }}>
              主要按钮 (Kook 黄色)
            </Button>
            <Button>默认按钮</Button>
            <Button danger>危险按钮</Button>
            <Button>幽灵按钮</Button>
          </Space>
        </Card>

        {/* 输入框测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">输入框组件</h2>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Input placeholder="标准输入框" />
            <Input.Password placeholder="密码输入框" />
            <Input.Search placeholder="搜索输入框" prefix={<SearchOutlined />} />
          </Space>
        </Card>

        {/* 卡片测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">卡片组件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="卡片标题" bordered={false}>
              <p className="text-gray-600">这是卡片内容</p>
            </Card>
            <Card title="悬停效果" bordered={false} hoverable>
              <p className="text-gray-600">鼠标悬停查看效果</p>
            </Card>
          </div>
        </Card>

        {/* 标签测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">标签组件</h2>
          <Space wrap>
            <Tag color="gold">金色标签</Tag>
            <Tag color="green">成功</Tag>
            <Tag color="orange">警告</Tag>
            <Tag color="red">危险</Tag>
            <Tag color="blue">信息</Tag>
          </Space>
        </Card>

        {/* 徽章测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">徽章组件</h2>
          <Space wrap>
            <Badge count="99+" showZero>
              消息
            </Badge>
            <Badge count={5} showZero>
              通知
            </Badge>
            <Badge count={0} showZero>
              待办
            </Badge>
            <Badge dot>
              <Avatar size="small" icon={<UserOutlined />} />
            </Badge>
            <Badge status="success" text="成功" />
            <Badge status="warning" text="警告" />
            <Badge status="error" text="错误" />
          </Space>
        </Card>

        {/* 头像测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">头像组件</h2>
          <Space wrap>
            <Avatar size="small" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
            <Avatar size="default" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
            <Avatar size="large" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
            <Avatar icon={<UserOutlined />} />
            <Avatar style={{ backgroundColor: '#FFC300' }}>M</Avatar>
          </Space>
        </Card>

        {/* 开关测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">开关组件</h2>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space>
              <span>开关 1</span>
              <Switch defaultChecked />
            </Space>
            <Space>
              <span>开关 2</span>
              <Switch />
            </Space>
          </Space>
        </Card>

        {/* 进度条测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">进度条组件</h2>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Progress percent={75} status="active" />
            <Progress percent={50} status="success" />
            <Progress percent={30} status="exception" />
          </Space>
        </Card>

        {/* 选项卡测试 */}
        <Card className="border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold mb-4">选项卡组件</h2>
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab="选项卡 1" key="1">
              内容 1
            </Tabs.TabPane>
            <Tabs.TabPane tab="选项卡 2" key="2">
              内容 2
            </Tabs.TabPane>
            <Tabs.TabPane tab="选项卡 3" key="3">
              内容 3
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}