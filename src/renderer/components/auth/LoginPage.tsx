import { useState } from 'react'
import { Form, Input, Button, Checkbox, App } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@renderer/stores/authStore'
import { cn } from '@renderer/utils/cn'

interface LoginFormValues {
  username: string
  password: string
  remember?: boolean
}

interface RegisterFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
}

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

const errorVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: 0.3, ease: 'easeOut' as const }
  },
  exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.2 } }
}

const floatVariants = {
  animate: {
    y: [0, -15, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const }
  }
}

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { login, register, isLoading, error, clearError } = useAuthStore()
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const { message } = App.useApp()

  const handleLogin = async (values: LoginFormValues) => {
    clearError()
    try {
      await login(values.username, values.password)
      message.success('登录成功')
    } catch (_err) {
      message.error(error || '登录失败')
    }
  }

  const handleRegister = async (values: RegisterFormValues) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    clearError()
    try {
      await register(values.username, values.password, values.email)
      message.success('注册成功')
    } catch (_err) {
      message.error(error || '注册失败')
    }
  }

  const switchToRegister = () => {
    setMode('register')
    clearError()
    loginForm.resetFields()
  }

  const switchToLogin = () => {
    setMode('login')
    clearError()
    registerForm.resetFields()
  }

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
              {mode === 'login' ? '正在登录...' : '正在注册...'}
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
              <svg viewBox="0 0 28 20" className="w-8 h-6 text-white" fill="currentColor">
                <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3416 0C8.49087 0.322199 6.68661 0.885653 4.97361 1.68345C1.53179 6.77853 0.559612 11.7417 1.04602 16.6309C3.04912 18.1166 5.31187 19.2137 7.72333 19.8612C8.25832 19.1384 8.73498 18.3699 9.14898 17.5624C8.37544 17.2724 7.62992 16.9089 6.92297 16.4756C7.10261 16.3474 7.27777 16.2131 7.44717 16.0745C11.7197 18.0621 16.3394 18.0621 20.5554 16.0745C20.7248 16.2131 20.8999 16.3474 21.0796 16.4756C20.3714 16.9102 19.6246 17.275 18.8497 17.5637C19.2637 18.3711 19.7403 19.1397 20.2753 19.8625C22.6881 19.2137 24.9508 18.1153 26.954 16.6309C27.5307 10.9745 26.0372 6.05798 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0455 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6811 9.54272 20.6544 10.994C20.6544 12.4453 19.6249 13.6383 18.3161 13.6383Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-normal)]">Macto</h1>
            <p className="text-[var(--color-text-muted)] mt-1">语音与屏幕共享应用</p>
          </motion.div>

          {/* Mode indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex rounded-xl bg-[var(--color-bg-secondary)] p-1">
              <button
                onClick={() => mode !== 'login' && switchToLogin()}
                className={cn(
                  'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                  mode === 'login'
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]'
                )}
              >
                登录
              </button>
              <button
                onClick={() => mode !== 'register' && switchToRegister()}
                className={cn(
                  'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                  mode === 'register'
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]'
                )}
              >
                注册
              </button>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mb-4"
              >
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-dnd)]/10 border border-[var(--color-dnd)]/20 text-[var(--color-dnd)]">
                  <CloseCircleOutlined />
                  <span className="text-sm">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form
                  form={loginForm}
                  onFinish={handleLogin}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="用户名"
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="密码"
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <div className="flex items-center justify-between mb-4">
                    <Form.Item name="remember" valuePropName="checked" className="mb-0">
                      <Checkbox
                        className="text-[var(--color-text-muted)]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        记住我
                      </Checkbox>
                    </Form.Item>
                    <button
                      type="button"
                      className="text-sm text-[var(--color-primary)] hover:underline"
                      onClick={() => message.info('请联系管理员重置密码')}
                    >
                      忘记密码？
                    </button>
                  </div>

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
                      登录
                    </Button>
                  </Form.Item>
                </Form>

                <div className="text-center mt-6">
                  <span className="text-[var(--color-text-muted)] text-sm">还没有账号？</span>
                  <button
                    onClick={switchToRegister}
                    disabled={isLoading}
                    className="text-[var(--color-primary)] hover:underline font-semibold px-1 text-sm transition-colors"
                  >
                    立即注册
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form
                  form={registerForm}
                  onFinish={handleRegister}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, max: 50, message: '用户名长度为3-50个字符' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="用户名"
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="邮箱"
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, max: 50, message: '密码长度为6-50个字符' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="密码"
                      className="rounded-xl h-11 login-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-[var(--color-text-muted)]" />}
                      placeholder="确认密码"
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
                      注册
                    </Button>
                  </Form.Item>
                </Form>

                <div className="text-center mt-6">
                  <span className="text-[var(--color-text-muted)] text-sm">已有账号？</span>
                  <button
                    onClick={switchToLogin}
                    disabled={isLoading}
                    className="text-[var(--color-primary)] hover:underline font-semibold px-1 text-sm transition-colors"
                  >
                    立即登录
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
