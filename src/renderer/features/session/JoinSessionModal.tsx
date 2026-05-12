import { useState } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

interface JoinSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onJoin: (sessionId: string) => void
}

export const JoinSessionModal = ({
  isOpen,
  onClose,
  onJoin,
}: JoinSessionModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      onJoin(values.sessionId)
      form.resetFields()
      message.success('成功加入会话')
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      title={
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl',
            'bg-gradient-to-br from-green-500 to-teal-600',
            'flex items-center justify-center',
            'text-white shadow-lg shadow-green-500/30'
          )}>
            <TeamOutlined />
          </div>
          <span className="text-lg font-bold">加入会话</span>
        </div>
      }
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="加入"
      cancelText="取消"
      confirmLoading={loading}
      width={500}
      okButtonProps={{
        className: 'bg-green-600 hover:bg-green-700 rounded-xl px-6',
      }}
      cancelButtonProps={{
        className: 'rounded-xl px-6',
      }}
      styles={{
        body: { padding: '24px' },
      }}
      style={{ borderRadius: '16px' }}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        className="mt-4"
      >
        <Form.Item
          label={<span className="font-semibold text-gray-700 dark:text-gray-300">会话 ID</span>}
          name="sessionId"
          rules={[
            { required: true, message: '请输入会话 ID' },
            { min: 8, message: '会话 ID 至少需要8个字符' },
          ]}
        >
          <Input
            prefix={<TeamOutlined className="text-gray-400" />}
            placeholder="输入会话 ID..."
            allowClear
            className="rounded-xl py-2.5"
          />
        </Form.Item>
        <Form.Item>
          <div className={cn(
            'p-4 rounded-xl',
            'bg-green-50 dark:bg-green-900/20',
            'border border-green-100 dark:border-green-800'
          )}>
            <p className="text-sm text-green-700 dark:text-green-400">
              输入会话 ID 加入已有的语音会话
            </p>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}