import { useState } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { UserOutlined, TeamOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export const CreateSessionModal = ({
  isOpen,
  onClose,
  onCreate,
}: CreateSessionModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      onCreate(values.name)
      form.resetFields()
      message.success('会话创建成功')
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
            'bg-gradient-to-br from-[var(--color-primary)] to-purple-600',
            'flex items-center justify-center',
            'text-white shadow-lg shadow-[var(--color-primary)]/30'
          )}>
            <TeamOutlined />
          </div>
          <span className="text-lg font-bold">创建会话</span>
        </div>
      }
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="创建"
      cancelText="取消"
      confirmLoading={loading}
      width={500}
      okButtonProps={{
        className: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl px-6',
      }}
      cancelButtonProps={{
        className: 'rounded-xl px-6',
      }}
      zIndex={2000}
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
          label={<span className="font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">会话名称</span>}
          name="name"
          rules={[
            { required: true, message: '请输入会话名称' },
            { max: 50, message: '会话名称不能超过50个字符' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)]" />}
            placeholder="输入会话名称..."
            allowClear
            className="rounded-xl py-2.5"
          />
        </Form.Item>
        <Form.Item>
          <div className={cn(
            'p-4 rounded-xl',
            'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
            'border border-[var(--color-primary)]/20 dark:border-[var(--color-primary)]/30'
          )}>
            <p className="text-sm text-[var(--color-primary)] dark:text-[var(--color-primary)]">
              创建一个新的语音会话，邀请朋友一起交流
            </p>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}