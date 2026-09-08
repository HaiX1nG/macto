import { useCallback, useRef, useEffect, useState } from 'react'

/**
 * useDebouncedCallback - 返回稳定的防抖函数引用
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fnRef.current(...args), delay)
    },
    [delay]
  ) as T
}

/**
 * useDebouncedValue - 防抖值（用于搜索输入等）
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/**
 * useThrottledCallback - 返回稳定的节流函数引用
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const lastCallRef = useRef(0)

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now
        fnRef.current(...args)
      }
    },
    [delay]
  ) as T
}
