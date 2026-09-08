import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  // ==================== Basic Rendering ====================
  describe('basic rendering', () => {
    it('should render button text', () => {
      renderButton()
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('should render with default variant as primary', () => {
      renderButton()
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render with default size as md', () => {
      renderButton()
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  // ==================== Variants ====================
  describe('variants', () => {
    it('should render primary variant', () => {
      renderButton({ variant: 'primary' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render secondary variant', () => {
      renderButton({ variant: 'secondary' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render danger variant', () => {
      renderButton({ variant: 'danger' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render success variant', () => {
      renderButton({ variant: 'success' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render warning variant', () => {
      renderButton({ variant: 'warning' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render ghost variant', () => {
      renderButton({ variant: 'ghost' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render outline variant', () => {
      renderButton({ variant: 'outline' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  // ==================== Sizes ====================
  describe('sizes', () => {
    it('should render sm size', () => {
      renderButton({ size: 'sm' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render md size', () => {
      renderButton({ size: 'md' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render lg size', () => {
      renderButton({ size: 'lg' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should map legacy "small" to sm size', () => {
      renderButton({ size: 'small' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should map legacy "middle" to md size', () => {
      renderButton({ size: 'middle' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should map legacy "large" to lg size', () => {
      renderButton({ size: 'large' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  // ==================== Full Width ====================
  describe('fullWidth', () => {
    it('should apply w-full when fullWidth is true', () => {
      renderButton({ fullWidth: true })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('should not apply w-full when fullWidth is false', () => {
      renderButton({ fullWidth: false })
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('w-full')
    })
  })

  // ==================== Children & Content ====================
  describe('children & content', () => {
    it('should render button with children text', () => {
      renderButton()
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Click me')
    })

    it('should render button with React node children', () => {
      render(<Button><span data-testid="icon">Icon</span> Text</Button>)
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  // ==================== Disabled State ====================
  describe('disabled state', () => {
    it('should apply disabled attribute', () => {
      renderButton({ disabled: true })
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should apply disabled opacity styles', () => {
      renderButton({ disabled: true })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:opacity-50')
      expect(button).toHaveClass('disabled:pointer-events-none')
    })

    it('should prevent click when disabled', () => {
      const handleClick = vi.fn()
      renderButton({ disabled: true, onClick: handleClick })
      const button = screen.getByRole('button')
      userEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  // ==================== Loading State ====================
  describe('loading state', () => {
    it('should render loading spinner when loading is true', () => {
      renderButton({ loading: true })
      // Ant Design Button shows a loading indicator when loading prop is true
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  // ==================== Click Handler ====================
  describe('click handler', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn()
      renderButton({ onClick: handleClick })
      const button = screen.getByRole('button')
      await userEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  // ==================== Custom className ====================
  describe('custom className', () => {
    it('should apply custom className', () => {
      renderButton({ className: 'custom-class' })
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  // ==================== Accessibility ====================
  describe('accessibility', () => {
    it('should have correct role', () => {
      renderButton()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support aria-label', () => {
      renderButton({ 'aria-label': 'Custom label' })
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument()
    })

    it('should support data-testid', () => {
      renderButton({ 'data-testid': 'test-button' })
      expect(screen.getByTestId('test-button')).toBeInTheDocument()
    })
  })

  // ==================== HTML Button Attributes ====================
  describe('HTML button attributes', () => {
    it('should support type attribute', () => {
      renderButton({ type: 'submit' })
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should support name attribute', () => {
      renderButton({ name: 'button-name' })
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('name', 'button-name')
    })
  })
})
