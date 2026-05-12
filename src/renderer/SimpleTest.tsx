import { ConfigProvider } from 'antd'
import '../styles/index.css'

export default function SimpleTest() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FFC300',
          borderRadius: 8,
        },
      }}
    >
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Kook 风格测试</h1>

          {/* 测试按钮 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">按钮</h2>
            <div className="flex gap-4 flex-wrap">
              <button className="px-4 py-2 bg-[#FFC300] text-white rounded-lg font-semibold hover:bg-[#FFD933] transition-colors">
                Kook 黄色按钮
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                蓝色按钮
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                灰色按钮
              </button>
            </div>
          </div>

          {/* 测试卡片 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">卡片</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 border-4 border-yellow-400">
                <h3 className="text-lg font-bold mb-2">黄色边框卡片</h3>
                <p className="text-gray-600">这是带有 Kook 风格黄色边框的卡片</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-2">普通卡片</h3>
                <p className="text-gray-600">这是普通卡片</p>
              </div>
            </div>
          </div>

          {/* 测试输入框 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">输入框</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Kook 风格输入框"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#FFC300] focus:outline-none transition-colors"
              />
              <input
                type="password"
                placeholder="密码输入框"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#FFC300] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* 测试标签 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">标签</h2>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 bg-[#FFC300]/10 text-[#FFC300] border border-[#FFC300]/20 rounded-lg text-sm font-medium">
                黄色标签
              </span>
              <span className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-sm font-medium">
                成功
              </span>
              <span className="px-3 py-1 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-lg text-sm font-medium">
                警告
              </span>
              <span className="px-3 py-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded-lg text-sm font-medium">
                危险
              </span>
            </div>
          </div>

          {/* 测试颜色变量 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">CSS 变量</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#FFC300]" />
                  <span className="font-mono text-sm">--kook-primary: #FFC300</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#F9FAFB]" />
                  <span className="font-mono text-sm">--kook-bg-secondary: #F9FAFB</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#111827]" />
                  <span className="font-mono text-sm">--kook-text: #111827</span>
                </div>
              </div>
            </div>
          </div>

          {/* 测试 Ant Design 组件 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Ant Design 组件</h2>
            <div className="space-y-4">
              <button type="button" className="ant-btn ant-btn-primary" style={{ backgroundColor: '#FFC300', borderColor: '#FFC300' }}>
                Ant Design 按钮
              </button>
              <div className="ant-input ant-input-lg" style={{ borderRadius: '8px' }}>
                Ant Design 输入框
              </div>
              <div className="ant-card ant-card-bordered" style={{ borderRadius: '12px' }}>
                <div className="ant-card-head-title">Ant Design 卡片</div>
                <div className="ant-card-body">这是 Ant Design 卡片内容</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
