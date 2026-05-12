import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { cn } from '@renderer/utils/cn'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Custom sanitize schema to allow specific HTML elements and attributes
const sanitizeSchema = {
  tagNames: [
    // Standard HTML elements
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
    'details', 'summary',
    'mark', 'small', 'sub', 'sup',
    'abbr', 'cite', 'dfn', 'kbd', 'samp', 'var',
    'dl', 'dt', 'dd',
    'figure', 'figcaption',
    'ruby', 'rt', 'rp',
    'time',
    'wbr',
  ],
  attributes: {
    '*': ['className', 'class', 'style', 'title', 'lang', 'dir'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    td: ['colSpan', 'rowSpan', 'align', 'valign'],
    th: ['colSpan', 'rowSpan', 'align', 'valign', 'scope'],
    ol: ['start', 'type', 'reversed'],
    ul: ['type'],
    li: ['value'],
    time: ['datetime'],
    abbr: ['title'],
    input: ['type', 'checked', 'disabled', 'readonly'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https', 'data'],
  },
}

// Helper function to open external links
const openExternal = (url: string) => {
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
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
          rehypeHighlight,
        ]}
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
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-[var(--color-bg-darker)] px-1.5 py-0.5 rounded text-[var(--color-primary)] text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('text-sm font-mono', className)} {...props}>
                {children}
              </code>
            )
          },
          // Headings
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-2 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-1 mt-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-bold mb-1 mt-2">{children}</h4>,
          h5: ({ children }) => <h5 className="text-sm font-bold mb-1 mt-2">{children}</h5>,
          h6: ({ children }) => <h6 className="text-xs font-bold mb-1 mt-2 text-[var(--color-text-muted)]">{children}</h6>,
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
          // Underline
          u: ({ children }) => <u className="underline">{children}</u>,
          // Mark/Highlight
          mark: ({ children }) => (
            <mark className="bg-yellow-500/30 text-inherit px-1 rounded">
              {children}
            </mark>
          ),
          // Small text
          small: ({ children }) => <small className="text-xs text-[var(--color-text-muted)]">{children}</small>,
          // Subscript and Superscript
          sub: ({ children }) => <sub className="text-xs">{children}</sub>,
          sup: ({ children }) => <sup className="text-xs">{children}</sup>,
          // Keyboard input
          kbd: ({ children }) => (
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[var(--color-bg-darker)] border border-[var(--color-border)] rounded shadow-sm">
              {children}
            </kbd>
          ),
          // Abbreviation
          abbr: ({ title, children }) => (
            <abbr title={title} className="underline decoration-dotted cursor-help">
              {children}
            </abbr>
          ),
          // Details/Summary for collapsible content
          details: ({ children }) => (
            <details className="my-2 p-2 bg-[var(--color-bg-darker)] rounded-lg">
              {children}
            </details>
          ),
          summary: ({ children }) => (
            <summary className="cursor-pointer font-medium hover:text-[var(--color-primary)]">
              {children}
            </summary>
          ),
          // Definition lists
          dl: ({ children }) => <dl className="my-2">{children}</dl>,
          dt: ({ children }) => <dt className="font-semibold mt-2">{children}</dt>,
          dd: ({ children }) => <dd className="ml-4 text-[var(--color-text-muted)]">{children}</dd>,
          // Figure and caption
          figure: ({ children }) => <figure className="my-2">{children}</figure>,
          figcaption: ({ children }) => (
            <figcaption className="text-sm text-[var(--color-text-muted)] text-center mt-1">
              {children}
            </figcaption>
          ),
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
          // Insert
          ins: ({ children }) => <ins className="underline decoration-green-500">{children}</ins>,
          // Task list items (GFM)
          input: ({ checked }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-2 accent-[var(--color-primary)]"
            />
          ),
          // Div and Span for custom styling
          div: ({ children, className: divClass }) => (
            <div className={divClass}>{children}</div>
          ),
          span: ({ children, className: spanClass }) => (
            <span className={spanClass}>{children}</span>
          ),
          // Time element
          time: ({ children, ...props }) => {
            const datetime = (props as { dateTime?: string }).dateTime
            return (
              <time dateTime={datetime} className="text-[var(--color-text-muted)]">
                {children}
              </time>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
