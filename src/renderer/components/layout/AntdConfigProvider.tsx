// AntdConfigProvider is deprecated, use ConfigProvider directly in main.tsx
// This file is kept for backwards compatibility
export function AntdConfigProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
