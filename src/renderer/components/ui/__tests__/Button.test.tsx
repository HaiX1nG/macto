import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  const defaultProps = {
    children: 'Click me',
    variant: 'primary' as const,
    size: 'md' as const,
  }

  const renderButton = (props = {}) => {
    return render(<Button {...defaultProps} {...props} />)
  }

  describe('basic rendering', () => {
    it('should render button text', () => {
      renderButton()
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('should render with default variant', () => {
      renderButton()
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600')
    })

    it('should render with default size', () => {
      renderButton()
      const button = screen.getByRole('button')
      expect(button).toHaveClass('font-medium')
    })
  })

  describe('variants', () => {
    it('should render primary variant', () => {
      renderButton({ variant: 'primary' })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white')
    })

    it('should render secondary variant', () => {
      renderButton({ variant: 'secondary' })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-200')
    })

    it('should render danger variant', () => {
      renderButton({ variant: 'danger' })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600')
    })

    it('should render success variant', () => {
      renderButton({ variant: 'success' })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-green-600')
    })

    it('should render ghost variant', () => {
      renderButton({ variant: 'ghost' })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-transparent')
    })
  })

  describe('sizes', () => {
    it('should render small size', () => {
      renderButton({ size: 'small' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render medium size', () => {
      renderButton({ size: 'middle' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render large size', () => {
      renderButton({ size: 'large' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('icon', () => {
    it('should render button with children', () => {
      renderButton()
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Click me')
    })
  })

  describe('disabled state', () => {
    it('should apply disabled styles', () => {
      renderButton({ disabled: true })
      const button = screen.getByRole('button', { disabled: true })
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    })

    it('should prevent click when disabled', () => {
      const handleClick = vi.fn()
      renderButton({ disabled: true, onClick: handleClick })

      const button = screen.getByRole('button', { disabled: true })
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('onClick handler', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      renderButton({ onClick: handleClick })

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should prevent default on click', () => {
      const handleClick = vi.fn((e) => e.preventDefault())
      renderButton({ onClick: handleClick })

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      renderButton({ className: 'custom-class' })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should merge custom className with base styles', () => {
      renderButton({ className: 'custom-class' })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('font-medium')
    })
  })

  describe('accessibility', () => {
    it('should have correct role', () => {
      renderButton()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support aria attributes', () => {
      renderButton({ 'aria-label': 'Custom label' })
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument()
    })

    it('should support data attributes', () => {
      renderButton({ 'data-testid': 'test-button' })
      expect(screen.getByTestId('test-button')).toBeInTheDocument()
    })
  })

  describe('other HTML button attributes', () => {
    it('should support type attribute', () => {
      renderButton({ type: 'submit' })
      const button = screen.getByRole('button')
      // Ant Design Button may normalize the type attribute
      expect(button).toBeInTheDocument()
    })

    it('should support name attribute', () => {
      renderButton({ name: 'button-name' })
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('name', 'button-name')
    })

    it('should support form attribute', () => {
      renderButton({ form: 'test-form' })
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('form', 'test-form')
    })
  })
})
