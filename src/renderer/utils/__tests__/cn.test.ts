import { describe, it, expect } from 'vitest'
import { cn } from '../cn'

describe('cn utility', () => {
  describe('basic functionality', () => {
    it('should return single string', () => {
      expect(cn('hello')).toBe('hello')
    })

    it('should return multiple space-separated strings', () => {
      expect(cn('hello', 'world')).toBe('hello world')
    })

    it('should handle empty strings', () => {
      expect(cn('hello', '', 'world')).toBe('hello world')
    })

    it('should handle only empty strings', () => {
      expect(cn('', '', '')).toBe('')
    })
  })

  describe('with falsy values', () => {
    it('should handle false', () => {
      expect(cn('hello', false, 'world')).toBe('hello world')
    })

    it('should handle null', () => {
      expect(cn('hello', null, 'world')).toBe('hello world')
    })

    it('should handle undefined', () => {
      expect(cn('hello', undefined, 'world')).toBe('hello world')
    })

    it('should handle 0', () => {
      expect(cn('hello', 0, 'world')).toBe('hello world')
    })
  })

  describe('with arrays', () => {
    it('should handle array of strings', () => {
      expect(cn(['hello', 'world'])).toBe('hello world')
    })

    it('should handle nested arrays', () => {
      expect(cn(['hello', ['world', 'test']])).toBe('hello world test')
    })

    it('should handle array with falsy values', () => {
      expect(cn(['hello', false, 'world'])).toBe('hello world')
    })
  })

  describe('with objects (Tailwind merge)', () => {
    it('should merge conflicting classes (last wins)', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should combine non-conflicting classes', () => {
      expect(cn('text-red-500', 'font-bold')).toBe('text-red-500 font-bold')
    })

    it('should handle multiple conflicting classes', () => {
      expect(cn('p-4', 'p-8', 'p-2')).toBe('p-2')
    })

    it('should handle conflicting and non-conflicting classes', () => {
      const result = cn('text-red-500', 'p-4', 'text-blue-500', 'font-bold')
      expect(result).toContain('text-blue-500')
      expect(result).toContain('p-4')
      expect(result).toContain('font-bold')
    })
  })

  describe('with template-like strings', () => {
    it('should handle template class names', () => {
      expect(cn('bg-[#5865F2]', 'text-white')).toBe('bg-[#5865F2] text-white')
    })

    it('should handle arbitrary values', () => {
      expect(cn('w-[100px]', 'h-[200px]')).toBe('w-[100px] h-[200px]')
    })

    it('should handle modifier-based classes', () => {
      expect(cn('hover:bg-red-500', 'focus:ring-2')).toBe('hover:bg-red-500 focus:ring-2')
    })
  })

  describe('complex scenarios', () => {
    it('should handle mixed input types', () => {
      const result = cn('base', ['with', 'array'], null, false, 'end')
      expect(result).toBe('base with array end')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false

      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active')
    })

    it('should handle ternary conditional classes', () => {
      const isActive = true

      expect(cn('base', isActive ? 'active' : 'inactive')).toBe('base active')

      const isNotActive = false
      expect(cn('base', isNotActive ? 'active' : 'inactive')).toBe('base inactive')
    })

    it('should preserve order for non-conflicting classes', () => {
      expect(cn('first', 'second', 'third', 'fourth')).toBe('first second third fourth')
    })
  })

  describe('edge cases', () => {
    it('should handle no arguments', () => {
      expect(cn()).toBe('')
    })

    it('should handle single empty array', () => {
      expect(cn([])).toBe('')
    })

    it('should handle array with all falsy values', () => {
      expect(cn([false, null, undefined, ''])).toBe('')
    })

    it('should handle deeply nested arrays', () => {
      expect(cn(['a', ['b', ['c', 'd']]])).toBe('a b c d')
    })
  })

  describe('performance', () => {
    it('should handle many classes efficiently', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`)
      const result = cn(classes)
      expect(result.split(' ').length).toBe(100)
    })
  })
})
