import React from 'react'
import { Button, Input, Card, Tag, Badge, Avatar, Space } from 'antd'
import {
  VideoCameraOutlined,
  AudioOutlined,
  MessageOutlined,
  BellOutlined,
  SearchOutlined,
  SendOutlined,
  MoreOutlined,
  DesktopOutlined,
  PhoneOutlined,
  AudioMutedOutlined,
  StopOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  PlusOutlined,
} from '@ant-design/icons'

/**
 * Kook 风格组件展示
 */
export default function KookStyleDemo() {
  React.useState('voice')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 头部导航 */}
        <nav className="px-6 py-4 flex items-center justify-between bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <MessageOutlined className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold text-gray-900">Kook 风格演示</span>
          </div>
          <Space>
            <Button icon={<SearchOutlined />} type="text" />
            <Button icon={<BellOutlined />} type="text" />
            <Button type="primary" icon={<PlusOutlined />}>
              新建会话
            </Button>
          </Space>
        </nav>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧边栏 */}
          <div className="space-y-4">
            <Card bordered={false} className="rounded-xl">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button type="primary" block icon={<VideoCameraOutlined />}>
                  开始会话
                </Button>
                <Button block icon={<AudioOutlined />}>
                  语音通话
                </Button>
                <Button block icon={<DesktopOutlined />}>
                  屏幕共享
                </Button>
              </Space>
            </Card>

            <Card bordered={false} className="rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-3">快速操作</h3>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Button type="text" block icon={<EditOutlined />}>编辑设置</Button>
                <Button type="text" block icon={<DeleteOutlined />}>删除会话</Button>
                <Button type="text" block icon={<CheckOutlined />}>完成会话</Button>
              </Space>
            </Card>
          </div>

          {/* 中间内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 会话信息卡片 */}
            <Card bordered={false} className="rounded-xl">
              <div className="flex items-start gap-4">
                <Avatar size={48} src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">Kook 风格演示</h2>
                  <p className="text-sm text-gray-500 mt-1">创建于 2026-04-29</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Tag color="success">活跃</Tag>
                    <Tag color="processing">语音通话</Tag>
                    <Tag color="warning">3 人在线</Tag>
                  </div>
                </div>
                <Button icon={<MoreOutlined />} type="text" />
              </div>
            </Card>

            {/* 成员列表 */}
            <Card bordered={false} className="rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4">成员 (3)</h3>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge count={i === 2 ? 1 : 0} offset={[-5, 5]}>
                        <Avatar
                          size="default"
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                        />
                      </Badge>
                      <div>
                        <div className="font-medium text-gray-900">用户 {i}</div>
                        <div className="text-xs text-gray-500">在线</div>
                      </div>
                    </div>
                    <Space>
                      {i === 2 && <Badge color="blue" count="说话中" />}
                      <Button icon={<AudioOutlined />} type="text" size="small" />
                      <Button icon={<AudioMutedOutlined />} type="text" size="small" />
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>

            {/* 消息输入 */}
            <Card bordered={false} className="rounded-xl">
              <div className="flex items-end gap-3">
                <Avatar size="small" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                <div className="flex-1">
                  <Input.TextArea
                    placeholder="输入消息..."
                    rows={2}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                  />
                </div>
                <Button type="primary" icon={<SendOutlined />}>
                  发送
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* 底部控制栏 */}
        <Card bordered={false} className="rounded-xl">
          <div className="flex items-center justify-between">
            <Space size="middle">
              <Button type="primary" icon={<VideoCameraOutlined />}>
                视频
              </Button>
              <Button icon={<AudioOutlined />}>
                音频
              </Button>
              <Button icon={<DesktopOutlined />}>
                屏幕
              </Button>
              <Button icon={<PhoneOutlined />}>
                挂断
              </Button>
            </Space>
            <Space size="middle">
              <Button icon={<AudioOutlined />} />
              <Button icon={<AudioMutedOutlined />} />
              <Button icon={<DesktopOutlined />} />
              <Button icon={<StopOutlined />} />
            </Space>
          </div>
        </Card>
      </div>
    </div>
  )
}