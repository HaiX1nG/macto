import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  }

  const renderModal = (props = {}) => {
    return render(<Modal {...defaultProps} {...props} />)
  }

  describe('basic rendering', () => {
    it('should render when isOpen is true', () => {
      renderModal()
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      renderModal({ isOpen: false })
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })

    it('should render with default size', () => {
      renderModal()
      const modal = document.querySelector('.max-w-lg')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('should render small size', () => {
      renderModal({ size: 'sm' })
      const modal = document.querySelector('.max-w-md')
      expect(modal).toBeInTheDocument()
    })

    it('should render medium size', () => {
      renderModal({ size: 'md' })
      const modal = document.querySelector('.max-w-lg')
      expect(modal).toBeInTheDocument()
    })

    it('should render large size', () => {
      renderModal({ size: 'lg' })
      const modal = document.querySelector('.max-w-2xl')
      expect(modal).toBeInTheDocument()
    })

    it('should render extra large size', () => {
      renderModal({ size: 'xl' })
      const modal = document.querySelector('.max-w-4xl')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('close button', () => {
    it('should render close button', () => {
      renderModal()
      const closeButton = document.querySelector('button')
      expect(closeButton).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      const handleClose = vi.fn()
      renderModal({ onClose: handleClose })

      const closeButton = document.querySelector('button')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('backdrop', () => {
    it('should render backdrop', () => {
      renderModal()
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60')
      expect(backdrop).toBeInTheDocument()
    })

    it('should call onClose when backdrop is clicked', () => {
      const handleClose = vi.fn()
      renderModal({ onClose: handleClose })

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60')
      if (backdrop) {
        fireEvent.click(backdrop)
      }

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('footer', () => {
    it('should not render footer when footer prop is not provided', () => {
      renderModal()
      expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument()
    })

    it('should render footer when provided', () => {
      renderModal({
        footer: (
          <>
            <button data-testid="cancel">Cancel</button>
            <button data-testid="confirm">Confirm</button>
          </>
        ),
      })

      expect(screen.getByTestId('cancel')).toBeInTheDocument()
      expect(screen.getByTestId('confirm')).toBeInTheDocument()
    })

    it('should render footer with correct styles', () => {
      renderModal({
        footer: <button data-testid="footer-btn">Footer Button</button>,
      })

      const footer = document.querySelector('[data-testid="footer-btn"]')?.closest('div')
      expect(footer).toHaveClass('flex', 'items-center', 'justify-end')
    })
  })

  describe('content', () => {
    it('should render children content', () => {
      renderModal({ children: <div data-testid="custom-content">Custom Content</div> })
      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    })

    it('should render content with correct padding', () => {
      renderModal()
      // Component uses px-6 py-5 for content padding
      const content = document.querySelector('.px-6.py-5')
      expect(content).toBeInTheDocument()
    })
  })

  describe('header', () => {
    it('should render title in header', () => {
      renderModal()
      const title = screen.getByText('Test Modal')
      // Component uses text-xl font-bold for title
      expect(title).toHaveClass('text-xl', 'font-bold')
    })

    it('should render header with correct styles', () => {
      renderModal()
      const header = document.querySelector('.border-b')
      expect(header).toBeInTheDocument()
    })
  })

  describe('close behavior', () => {
    it('should not render modal DOM when closed', () => {
      renderModal({ isOpen: false })

      const modal = document.querySelector('.fixed.inset-0')
      expect(modal).not.toBeInTheDocument()
    })
  })

  describe('z-index and positioning', () => {
    it('should render with correct z-index', () => {
      renderModal()
      const modal = document.querySelector('.z-\\[2000\\]')
      expect(modal).toBeInTheDocument()
    })

    it('should be centered on screen', () => {
      renderModal()
      const container = document.querySelector('.flex.items-center.justify-center')
      expect(container).toBeInTheDocument()
    })
  })

  describe('animation classes', () => {
    it('should render with animation classes', () => {
      renderModal()
      // Component uses animate-fade-in and animate-scale-in for CSS animations
      const modal = document.querySelector('.animate-fade-in, .animate-scale-in')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty children', () => {
      renderModal({ children: null })
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })

    it('should handle empty title', () => {
      renderModal({ title: '' })
      const header = screen.getByRole('heading')
      expect(header).toBeInTheDocument()
    })

    it('should handle null footer', () => {
      renderModal({ footer: null })
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })
  })
})
