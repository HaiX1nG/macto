import { useState } from 'react'
import { Form, Input, Button, Card, Checkbox, App } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#5865f2] via-[#7289da] to-[#99aab5]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      <Card
        className={cn(
          'w-[400px] rounded-2xl shadow-2xl',
          'bg-white/95 backdrop-blur-xl',
          'border-0'
        )}
        styles={{ body: { padding: '40px' } }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={cn(
            'w-16 h-16 rounded-2xl mx-auto mb-4',
            'bg-gradient-to-br from-[#5865f2] to-[#7289da]',
            'flex items-center justify-center',
            'shadow-lg shadow-[#5865f2]/30'
          )}>
            <svg viewBox="0 0 28 20" className="w-8 h-6 text-white" fill="currentColor">
              <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3416 0C8.49087 0.322199 6.68661 0.885653 4.97361 1.68345C1.53179 6.77853 0.559612 11.7417 1.04602 16.6309C3.04912 18.1166 5.31187 19.2137 7.72333 19.8612C8.25832 19.1384 8.73498 18.3699 9.14898 17.5624C8.37544 17.2724 7.62992 16.9089 6.92297 16.4756C7.10261 16.3474 7.27777 16.2131 7.44717 16.0745C11.7197 18.0621 16.3394 18.0621 20.5554 16.0745C20.7248 16.2131 20.8999 16.3474 21.0796 16.4756C20.3714 16.9102 19.6246 17.275 18.8497 17.5637C19.2637 18.3711 19.7403 19.1397 20.2753 19.8625C22.6881 19.2137 24.9508 18.1153 26.954 16.6309C27.5307 10.9745 26.0372 6.05798 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0455 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6811 9.54272 20.6544 10.994C20.6544 12.4453 19.6249 13.6383 18.3161 13.6383Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Macto</h1>
          <p className="text-gray-500 mt-1">语音与屏幕共享应用</p>
        </div>

        {mode === 'login' ? (
          <>
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
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="用户名"
                  className="rounded-xl"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="密码"
                  className="rounded-xl"
                />
              </Form.Item>

              <Form.Item name="remember" valuePropName="checked">
                <Checkbox>记住我</Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  className={cn(
                    'rounded-xl h-12',
                    'bg-[#5865f2] hover:bg-[#4752c4]',
                    'font-semibold text-lg'
                  )}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>

            <div className="text-center mt-4">
              <span className="text-gray-500">还没有账号？</span>
              <Button
                type="link"
                onClick={switchToRegister}
                className="text-[#5865f2] font-semibold px-2"
              >
                注册
              </Button>
            </div>
          </>
        ) : (
          <>
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
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="用户名"
                  className="rounded-xl"
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
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="邮箱"
                  className="rounded-xl"
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
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="密码"
                  className="rounded-xl"
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
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="确认密码"
                  className="rounded-xl"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  className={cn(
                    'rounded-xl h-12',
                    'bg-[#5865f2] hover:bg-[#4752c4]',
                    'font-semibold text-lg'
                  )}
                >
                  注册
                </Button>
              </Form.Item>
            </Form>

            <div className="text-center mt-4">
              <span className="text-gray-500">已有账号？</span>
              <Button
                type="link"
                onClick={switchToLogin}
                className="text-[#5865f2] font-semibold px-2"
              >
                登录
              </Button>
            </div>
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-500 text-center text-sm">
            {error}
          </div>
        )}
      </Card>
    </div>
  )
}

export default LoginPage
