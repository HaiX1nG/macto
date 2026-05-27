import { useState, useEffect } from 'react'
import { Avatar, Button, Input, Upload, Modal, App } from 'antd'
import { UserOutlined, CameraOutlined, MailOutlined, LockOutlined, LogoutOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useAuthStore } from '@renderer/stores/authStore'
import { authService } from '@renderer/services'
import { cn } from '@renderer/utils/cn'
import type { UploadProps } from 'antd'

export const SettingsProfile = () => {
  const { currentUser, updateProfile, changePassword, logout, isLoading, fetchUserInfo } = useAuthStore()
  const { message } = App.useApp()

  // 组件加载时获取最新用户信息
  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '')
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)

  // Username state
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [username, setUsername] = useState(currentUser?.username || '')

  // Email state
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [email, setEmail] = useState(currentUser?.email || '')

  // Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleAvatarChange = async () => {
    if (!avatarUrl.trim()) {
      message.error('请输入头像链接')
      return
    }
    try {
      await updateProfile({ avatarUrl })
      message.success('头像更新成功')
      setIsEditingAvatar(false)
    } catch (_err) {
      message.error('头像更新失败')
    }
  }

  const handleUsernameChange = async () => {
    if (!username.trim()) {
      message.error('用户名不能为空')
      return
    }
    if (username === currentUser?.username) {
      setIsEditingUsername(false)
      return
    }
    try {
      await updateProfile({ username })
      message.success('用户名更新成功')
      setIsEditingUsername(false)
    } catch (_err) {
      message.error('用户名更新失败')
    }
  }

  const handleEmailChange = async () => {
    if (!email.trim()) {
      message.error('邮箱不能为空')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.error('请输入有效的邮箱地址')
      return
    }
    if (email === currentUser?.email) {
      setIsEditingEmail(false)
      return
    }
    try {
      await updateProfile({ email })
      message.success('邮箱更新成功')
      setIsEditingEmail(false)
    } catch (_err) {
      message.error('邮箱更新失败')
    }
  }

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      message.error('请填写所有密码字段')
      return
    }
    if (newPassword.length < 6) {
      message.error('新密码至少需要6个字符')
      return
    }
    if (newPassword !== confirmPassword) {
      message.error('两次输入的新密码不一致')
      return
    }
    try {
      await changePassword({ oldPassword, newPassword })
      message.success('密码修改成功')
      setShowPasswordModal(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (_err) {
      message.error('密码修改失败')
    }
  }

  const handleLogout = () => {
    logout()
    message.success('已退出登录')
  }

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount()
      message.success('账户已删除')
      setShowDeleteModal(false)
      logout()
    } catch (_err) {
      message.error('删除账户失败')
    }
  }

  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件')
        return false
      }
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('图片大小不能超过 5MB')
        return false
      }
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setAvatarUrl(dataUrl)
        // Auto save on upload
        updateProfile({ avatarUrl: dataUrl }).then(() => {
          message.success('头像更新成功')
        }).catch(() => {
          message.error('头像更新失败')
        })
      }
      reader.readAsDataURL(file)
      return false
    },
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 scrollbar-thin px-2 sm:px-0">
      {/* Avatar Section - Glassmorphism Card */}
      <div className="flex flex-col items-center py-6 sm:py-8 border-b border-[var(--color-border)] backdrop-blur-sm bg-[var(--color-bg-secondary)]/50 rounded-xl sm:rounded-2xl mx-0 sm:mx-4">
        <div className="relative group">
          <Avatar
            size={80}
            src={currentUser?.avatarUrl || undefined}
            className="bg-gradient-to-br from-[var(--color-primary)] to-purple-600 text-white text-2xl font-bold shadow-lg ring-2 ring-white/10"
          >
            {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Upload {...uploadProps}>
            <button className={cn(
              'absolute bottom-0 right-0',
              'w-7 h-7 rounded-full',
              'bg-[var(--color-bg-tertiary)]',
              'border-2 border-[var(--color-border)]',
              'flex items-center justify-center',
              'shadow-md cursor-pointer',
              'hover:bg-[var(--color-bg-darker)]',
              'transition-colors'
            )}>
              <CameraOutlined className="text-[var(--color-text-muted)] text-xs" />
            </button>
          </Upload>
        </div>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          点击相机图标更换头像
        </p>
      </div>

      {/* Avatar URL Input */}
      {isEditingAvatar ? (
        <div className="space-y-2">
          <Input
            placeholder="输入头像图片链接"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            prefix={<UserOutlined className="text-[var(--color-text-muted)]" />}
            className="rounded-lg"
          />
          <div className="flex gap-2">
            <Button
              type="primary"
              onClick={handleAvatarChange}
              loading={isLoading}
              className="rounded-lg"
            >
              保存
            </Button>
            <Button
              onClick={() => {
                setIsEditingAvatar(false)
                setAvatarUrl(currentUser?.avatarUrl || '')
              }}
              className="rounded-lg"
            >
              取消
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="dashed"
          block
          onClick={() => setIsEditingAvatar(true)}
          className="rounded-lg h-9"
        >
          手动输入头像链接
        </Button>
      )}

      {/* User Info - Responsive Grid */}
      <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
        {/* Username */}
        <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[var(--color-bg-tertiary)] backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <UserOutlined className="text-[var(--color-text-muted)]" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--color-text-muted)]">用户名</p>
            {isEditingUsername ? (
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                size="small"
                onPressEnter={handleUsernameChange}
              />
            ) : (
              <p className="font-medium text-[var(--color-text-normal)] truncate">{currentUser?.username || '-'}</p>
            )}
          </div>
          {isEditingUsername ? (
            <div className="flex gap-1">
              <Button size="small" type="primary" onClick={handleUsernameChange} loading={isLoading}>保存</Button>
              <Button size="small" onClick={() => { setIsEditingUsername(false); setUsername(currentUser?.username || '') }}>取消</Button>
            </div>
          ) : (
            <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditingUsername(true)} />
          )}
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
          <MailOutlined className="text-[var(--color-text-muted)]" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--color-text-muted)]">邮箱</p>
            {isEditingEmail ? (
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                size="small"
                type="email"
                onPressEnter={handleEmailChange}
              />
            ) : (
              <p className="font-medium text-[var(--color-text-normal)] truncate">{currentUser?.email || '-'}</p>
            )}
          </div>
          {isEditingEmail ? (
            <div className="flex gap-1">
              <Button size="small" type="primary" onClick={handleEmailChange} loading={isLoading}>保存</Button>
              <Button size="small" onClick={() => { setIsEditingEmail(false); setEmail(currentUser?.email || '') }}>取消</Button>
            </div>
          ) : (
            <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditingEmail(true)} />
          )}
        </div>

        {/* User ID */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
          <LockOutlined className="text-[var(--color-text-muted)]" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--color-text-muted)]">用户 ID</p>
            <p className="font-medium text-[var(--color-text-normal)]">{currentUser?.userId || '-'}</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)] my-4" />

      {/* Password Change */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center gap-3">
            <LockOutlined className="text-[var(--color-text-muted)]" />
            <div>
              <span className="font-medium text-[var(--color-text-normal)]">修改密码</span>
            </div>
          </div>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setShowPasswordModal(true)}
            className="rounded-lg"
          >
            修改
          </Button>
        </div>

        {/* Logout */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center gap-3">
            <LogoutOutlined className="text-[var(--color-text-muted)]" />
            <div>
              <span className="font-medium text-[var(--color-text-normal)]">退出登录</span>
            </div>
          </div>
          <Button
            danger
            size="small"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="rounded-lg"
          >
            退出
          </Button>
        </div>

        {/* Delete Account */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-dnd)]/10 border border-[var(--color-dnd)]/30">
          <div className="flex items-center gap-3">
            <DeleteOutlined className="text-[var(--color-dnd)]" />
            <div>
              <span className="font-medium text-[var(--color-text-normal)]">删除账户</span>
            </div>
          </div>
          <Button
            danger
            type="primary"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => setShowDeleteModal(true)}
            className="rounded-lg"
          >
            删除
          </Button>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        open={showPasswordModal}
        title="修改密码"
        onCancel={() => {
          setShowPasswordModal(false)
          setOldPassword('')
          setNewPassword('')
          setConfirmPassword('')
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowPasswordModal(false)
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
          }} className="rounded-lg">
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handlePasswordChange} loading={isLoading} className="rounded-lg">
            确认修改
          </Button>,
        ]}
        zIndex={2000}
        styles={{
          body: { backgroundColor: 'var(--color-bg-secondary)' },
        }}
      >
        <div className="space-y-3 py-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-1">当前密码</p>
            <Input.Password
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入当前密码"
            />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-1">新密码</p>
            <Input.Password
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码 (至少6位)"
            />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-1">确认新密码</p>
            <Input.Password
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        open={showDeleteModal}
        title="确认删除账户"
        onCancel={() => setShowDeleteModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDeleteModal(false)} className="rounded-lg">
            取消
          </Button>,
          <Button key="delete" type="primary" danger onClick={handleDeleteAccount} loading={isLoading} className="rounded-lg">
            确认删除
          </Button>,
        ]}
        zIndex={2000}
        styles={{
          body: { backgroundColor: 'var(--color-bg-secondary)' },
        }}
      >
        <div className="py-4">
          <p className="text-[var(--color-text-normal)]">
            您确定要删除您的账户吗？此操作不可撤销，所有数据将被永久删除。
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default SettingsProfile
