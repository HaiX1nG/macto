import { useState } from 'react'
import { Form, Input, Button, Steps, App } from 'antd'
import { MailOutlined, SafetyOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@renderer/utils/cn'

interface Step1Values {
  email: string
}

interface Step2Values {
  verificationCode: string
}

interface Step3Values {
  newPassword: string
  confirmPassword: string
}

type ForgotPasswordStep = 0 | 1 | 2

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } }
}

const formVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: 0.1, ease: 'easeOut' as const }
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
}

const floatVariants = {
  animate: {
    y: [0, -15, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const }
  }
}

export function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(0)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { message } = App.useApp()
  const [form1] = Form.useForm<Step1Values>()
  const [form2] = Form.useForm<Step2Values>()
  const [form3] = Form.useForm<Step3Values>()

  const handleStep1 = async (_values: Step1Values) => {
    setIsLoading(true)
    try {
      // TODO: 调用发送验证码 API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setEmail(_values.email)
      setCurrentStep(1)
      message.success('验证码已发送到您的邮箱')
    } catch (_err) {
      message.error('发送验证码失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2 = async (_values: Step2Values) => {
    setIsLoading(true)
    try {
      // TODO: 调用验证验证码 API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCurrentStep(2)
      message.success('验证码验证成功')
    } catch (_err) {
      message.error('验证码验证失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3 = async (values: Step3Values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    setIsLoading(true)
    try {
      // TODO: 调用重置密码 API
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('密码重置成功，请使用新密码登录')
      // 重置表单并回到第一步
      setCurrentStep(0)
      setEmail('')
      form1.resetFields()
      form2.resetFields()
      form3.resetFields()
    } catch (_err) {
      message.error('密码重置失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const stepItems = [
    { title: '验证身份', description: '输入邮箱' },
    { title: '验证验证码', description: '输入验证码' },
    { title: '重置密码', description: '设置新密码' },
  ]

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="login-page-bg" />

      {/* Background decoration with animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          variants={floatVariants}
          animate="animate"
          className="login-page-decoration -top-40 -right-40 w-96 h-96 opacity-60"
        />
        <motion.div
          variants={floatVariants}
          animate="animate"
          className="login-page-decoration -bottom-40 -left-40 w-96 h-96 opacity-40"
          style={{ animationDelay: '2s' }}
        />
        <div className="login-page-decoration top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-30" />
        <div className="login-page-decoration top-20 left-1/4 w-64 h-64 opacity-20" />
        <div className="login-page-decoration bottom-20 right-1/4 w-64 h-64 opacity-20" />
      </div>

      {/* Full-screen loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--color-bg-base)]/80 backdrop-blur-sm"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[var(--color-primary)]/20" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-[var(--color-primary)] animate-spin" />
            </div>
            <p className="mt-4 text-[var(--color-text-normal)] font-medium">
              处理中...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          'w-[420px] max-w-[90vw] rounded-2xl shadow-2xl relative z-10',
          'bg-[var(--color-bg-base)]',
          'border border-[var(--color-border)]',
          'overflow-hidden'
        )}
      >
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)]" />

        <div className="p-8 sm:p-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className={cn(
              'w-16 h-16 rounded-2xl mx-auto mb-4',
              'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
              'flex items-center justify-center',
              'shadow-lg shadow-[var(--color-primary)]/30'
            )}>
              <LockOutlined className="text-2xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-normal)]">忘记密码</h1>
            <p className="text-[var(--color-text-muted)] mt-1">重置您的密码</p>
          </motion.div>

          {/* Steps */}
          <div className="mb-8">
            <Steps
              current={currentStep}
              items={stepItems}
              size="small"
              className="forgot-password-steps"
            />
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step1"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form
                  form={form1}
                  onFinish={handleStep1}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="请输入您的邮箱"
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <Form.Item className="mb-0">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading}
                      disabled={isLoading}
                      block
                      className={cn(
                        'rounded-xl h-12 login-button',
                        'bg-[var(--color-primary)] hover:!bg-[var(--color-primary)]/90',
                        'border-[var(--color-primary)] hover:!border-[var(--color-primary)]/90',
                        'font-semibold text-lg text-white',
                        'transition-all duration-200',
                        'active:scale-[0.98]'
                      )}
                    >
                      发送验证码
                    </Button>
                  </Form.Item>
                </Form>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step2"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form
                  form={form2}
                  onFinish={handleStep2}
                  layout="vertical"
                  size="large"
                >
                  <div className="mb-4 p-3 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
                    <p className="text-sm text-[var(--color-text-muted)]">
                      验证码已发送至 <span className="text-[var(--color-primary)] font-medium">{email}</span>
                    </p>
                  </div>

                  <Form.Item
                    name="verificationCode"
                    rules={[
                      { required: true, message: '请输入验证码' },
                      { len: 6, message: '验证码为6位数字' },
                    ]}
                  >
                    <Input
                      prefix={<SafetyOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <Form.Item className="mb-0">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading}
                      disabled={isLoading}
                      block
                      className={cn(
                        'rounded-xl h-12 login-button',
                        'bg-[var(--color-primary)] hover:!bg-[var(--color-primary)]/90',
                        'border-[var(--color-primary)] hover:!border-[var(--color-primary)]/90',
                        'font-semibold text-lg text-white',
                        'transition-all duration-200',
                        'active:scale-[0.98]'
                      )}
                    >
                      验证
                    </Button>
                  </Form.Item>
                </Form>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step3"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form
                  form={form3}
                  onFinish={handleStep3}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="newPassword"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, max: 50, message: '密码长度为6-50个字符' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="新密码"
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="确认新密码"
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <Form.Item className="mb-0">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading}
                      disabled={isLoading}
                      block
                      className={cn(
                        'rounded-xl h-12 login-button',
                        'bg-[var(--color-primary)] hover:!bg-[var(--color-primary)]/90',
                        'border-[var(--color-primary)] hover:!border-[var(--color-primary)]/90',
                        'font-semibold text-lg text-white',
                        'transition-all duration-200',
                        'active:scale-[0.98]'
                      )}
                    >
                      重置密码
                    </Button>
                  </Form.Item>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to login */}
          <div className="text-center mt-6">
            <a
              href="/login"
              className="text-[var(--color-primary)] hover:underline text-sm transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeftOutlined />
              返回登录
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
