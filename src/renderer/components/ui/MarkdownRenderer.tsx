import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@renderer/utils/cn'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Helper function to open external links
const openExternal = (url: string) => {
  // Try to use Electron's shell.openExternal via IPC if available
  if (typeof window !== 'undefined' && 'electronAPI' in window) {
    const electronAPI = (window as unknown as { electronAPI?: { openExternal: (url: string) => void } }).electronAPI
    electronAPI?.openExternal?.(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Handle links - open in external browser in Electron
          a: ({ href, children }) => {
            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault()
              if (href) {
                openExternal(href)
              }
            }
            return (
              <a
                href={href}
                onClick={handleClick}
                className="text-[var(--color-primary)] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            )
          },
          // Code blocks
          pre: ({ children }) => (
            <pre className="bg-[var(--color-bg-darker)] rounded-lg p-4 overflow-x-auto my-2">
              {children}
            </pre>
          ),
          code: ({ className, children, inline }) => {
            if (inline) {
              return (
                <code className="bg-[var(--color-bg-darker)] px-1.5 py-0.5 rounded text-[var(--color-primary)] text-sm font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('text-sm font-mono', className)}>
                {children}
              </code>
            )
          },
          // Headings
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-2 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-1 mt-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-bold mb-1 mt-2">{children}</h4>,
          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside ml-4 mb-2 space-y-1">{children as ReactNode}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside ml-4 mb-2 space-y-1">{children as ReactNode}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[var(--color-primary)] pl-4 my-2 italic text-[var(--color-text-muted)]">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => <hr className="my-4 border-[var(--color-border)]" />,
          // Paragraph
          p: ({ children }) => <p className="leading-relaxed mb-1 last:mb-0">{children}</p>,
          // Strong and emphasis
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-[var(--color-border)]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[var(--color-bg-darker)]">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-[var(--color-border)]">{children as ReactNode}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold border-r border-[var(--color-border)] last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-r border-[var(--color-border)] last:border-r-0">
              {children}
            </td>
          ),
          // Images - handle click to open in external browser
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-md rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                if (src) {
                  openExternal(src)
                }
              }}
            />
          ),
          // Strikethrough (GFM)
          del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
          // Task list items (GFM)
          input: ({ checked }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-2 accent-[var(--color-primary)]"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
