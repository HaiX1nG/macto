import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@renderer/utils/cn'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Helper function to open external links
const openExternal = (url: string) => {
  if (typeof window !== 'undefined' && 'electronAPI' in window) {
    const electronAPI = (window as unknown as { electronAPI?: { openExternal: (url: string) => void } }).electronAPI
    electronAPI?.openExternal?.(url)
  } else {
    ;(window as unknown as { open: (url: string, target: string, features: string) => void }).open(url, '_blank', 'noopener,noreferrer')
  }
}

// Decode HTML entities that may have been encoded by the backend
// Only decode < > and quotes, but preserve & to avoid breaking code blocks
function decodeHtmlEntities(text: string): string {
  // Decode named entities
  let result = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')

  // Decode numeric entities like &#34; &#60; etc.
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))

  // Decode hex entities like &#x22; &#x3C; etc.
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

  return result
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Decode HTML entities before rendering
  const decodedContent = decodeHtmlEntities(content)

  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeHighlight,
        ]}
                components={{
          // Handle links - open in external browser in Electron
          a: ({ href, children, ...props }) => {
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
                {...props}
              >
                {children}
              </a>
            )
          },
          // Code blocks
          pre: ({ children, ...props }) => (
            <pre className="bg-[var(--color-bg-darker)] rounded-lg p-4 overflow-x-auto my-2" {...props}>
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
          h1: ({ children, ...props }) => <h1 className="text-2xl font-bold mb-2 mt-4" {...props}>{children}</h1>,
          h2: ({ children, ...props }) => <h2 className="text-xl font-bold mb-2 mt-3" {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 className="text-lg font-bold mb-1 mt-2" {...props}>{children}</h3>,
          h4: ({ children, ...props }) => <h4 className="text-base font-bold mb-1 mt-2" {...props}>{children}</h4>,
          h5: ({ children, ...props }) => <h5 className="text-sm font-bold mb-1 mt-2" {...props}>{children}</h5>,
          h6: ({ children, ...props }) => <h6 className="text-xs font-bold mb-1 mt-2 text-[var(--color-text-muted)]" {...props}>{children}</h6>,
          // Lists
          ul: ({ children, ...props }) => <ul className="list-disc list-inside ml-4 mb-2 space-y-1" {...props}>{children as ReactNode}</ul>,
          ol: ({ children, ...props }) => <ol className="list-decimal list-inside ml-4 mb-2 space-y-1" {...props}>{children as ReactNode}</ol>,
          li: ({ children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
          // Blockquote
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-[var(--color-primary)] pl-4 my-2 italic text-[var(--color-text-muted)]" {...props}>
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: (props) => <hr className="my-4 border-[var(--color-border)]" {...props} />,
          // Paragraph
          p: ({ children, ...props }) => <p className="leading-relaxed mb-1 last:mb-0" {...props}>{children}</p>,
          // Strong and emphasis
          strong: ({ children, ...props }) => <strong className="font-semibold" {...props}>{children}</strong>,
          em: ({ children, ...props }) => <em className="italic" {...props}>{children}</em>,
          b: ({ children, ...props }) => <b className="font-bold" {...props}>{children}</b>,
          i: ({ children, ...props }) => <i className="italic" {...props}>{children}</i>,
          // Underline
          u: ({ children, ...props }) => <u className="underline" {...props}>{children}</u>,
          // Mark/Highlight
          mark: ({ children, ...props }) => (
            <mark className="bg-yellow-500/30 text-inherit px-1 rounded" {...props}>
              {children}
            </mark>
          ),
          // Small text
          small: ({ children, ...props }) => <small className="text-xs text-[var(--color-text-muted)]" {...props}>{children}</small>,
          // Big text (deprecated but supported)
          big: ({ children, ...props }) => <span className="text-lg" {...props}>{children}</span>,
          // Subscript and Superscript
          sub: ({ children, ...props }) => <sub className="text-xs" {...props}>{children}</sub>,
          sup: ({ children, ...props }) => <sup className="text-xs" {...props}>{children}</sup>,
          // Keyboard input
          kbd: ({ children, ...props }) => (
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[var(--color-bg-darker)] border border-[var(--color-border)] rounded shadow-sm" {...props}>
              {children}
            </kbd>
          ),
          // Sample output
          samp: ({ children, ...props }) => (
            <samp className="px-1.5 py-0.5 text-xs font-mono bg-[var(--color-bg-darker)] rounded" {...props}>
              {children}
            </samp>
          ),
          // Variable
          var: ({ children, ...props }) => <var className="italic text-[var(--color-primary)]" {...props}>{children}</var>,
          // Citation
          cite: ({ children, ...props }) => <cite className="italic text-[var(--color-text-muted)]" {...props}>{children}</cite>,
          // Definition
          dfn: ({ children, ...props }) => <dfn className="italic font-semibold" {...props}>{children}</dfn>,
          // Abbreviation
          abbr: ({ title, children, ...props }) => (
            <abbr title={title} className="underline decoration-dotted cursor-help" {...props}>
              {children}
            </abbr>
          ),
          // Quote
          q: ({ children, ...props }) => <q className="italic" {...props}>{children}</q>,
          // Data element
          data: ({ children, ...props }) => <data {...props}>{children}</data>,
          // Time element
          time: ({ children, ...props }) => (
            <time className="text-[var(--color-text-muted)]" {...props}>
              {children}
            </time>
          ),
          // Bi-directional text
          bdi: ({ children, ...props }) => <bdi {...props}>{children}</bdi>,
          bdo: ({ children, ...props }) => <bdo {...props}>{children}</bdo>,
          // Details/Summary for collapsible content
          details: ({ children, ...props }) => (
            <details className="my-2 p-2 bg-[var(--color-bg-darker)] rounded-lg" {...props}>
              {children}
            </details>
          ),
          summary: ({ children, ...props }) => (
            <summary className="cursor-pointer font-medium hover:text-[var(--color-primary)]" {...props}>
              {children}
            </summary>
          ),
          // Dialog
          dialog: ({ children, ...props }) => (
            <dialog className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]" {...props}>
              {children}
            </dialog>
          ),
          // Definition lists
          dl: ({ children, ...props }) => <dl className="my-2" {...props}>{children}</dl>,
          dt: ({ children, ...props }) => <dt className="font-semibold mt-2" {...props}>{children}</dt>,
          dd: ({ children, ...props }) => <dd className="ml-4 text-[var(--color-text-muted)]" {...props}>{children}</dd>,
          // Figure and caption
          figure: ({ children, ...props }) => <figure className="my-2" {...props}>{children}</figure>,
          figcaption: ({ children, ...props }) => (
            <figcaption className="text-sm text-[var(--color-text-muted)] text-center mt-1" {...props}>
              {children}
            </figcaption>
          ),
          // Tables
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-[var(--color-border)]" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => <thead className="bg-[var(--color-bg-darker)]" {...props}>{children}</thead>,
          tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
          tfoot: ({ children, ...props }) => <tfoot className="bg-[var(--color-bg-darker)]" {...props}>{children}</tfoot>,
          caption: ({ children, ...props }) => <caption className="text-sm text-[var(--color-text-muted)] mb-2" {...props}>{children}</caption>,
          colgroup: ({ children, ...props }) => <colgroup {...props}>{children}</colgroup>,
          col: (props) => <col {...props} />,
          tr: ({ children, ...props }) => <tr className="border-b border-[var(--color-border)]" {...props}>{children as ReactNode}</tr>,
          th: ({ children, ...props }) => (
            <th className="px-4 py-2 text-left font-semibold border-r border-[var(--color-border)] last:border-r-0" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 border-r border-[var(--color-border)] last:border-r-0" {...props}>
              {children}
            </td>
          ),
          // Images - handle click to open in external browser
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-md rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                if (src) {
                  openExternal(src)
                }
              }}
              {...props}
            />
          ),
          // Audio
          audio: ({ children, ...props }) => (
            <audio className="w-full max-w-md" controls {...props}>
              {children}
            </audio>
          ),
          // Video
          video: ({ children, ...props }) => (
            <video className="w-full max-w-lg rounded-lg" controls {...props}>
              {children}
            </video>
          ),
          // Source
          source: (props) => <source {...props} />,
          // Track
          track: (props) => <track {...props} />,
          // Iframe
          iframe: ({ ...props }) => (
            <iframe
              className="w-full max-w-lg rounded-lg border border-[var(--color-border)]"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              {...props}
            />
          ),
          // Embed
          embed: (props) => <embed className="w-full max-w-lg rounded-lg" {...props} />,
          // Object
          object: ({ children, ...props }) => <object className="w-full max-w-lg rounded-lg" {...props}>{children}</object>,
          // Canvas
          canvas: (props) => <canvas className="rounded-lg border border-[var(--color-border)]" {...props} />,
          // Picture
          picture: ({ children, ...props }) => <picture {...props}>{children}</picture>,
          // Strikethrough (GFM)
          del: ({ children, ...props }) => <del className="line-through opacity-70" {...props}>{children}</del>,
          // Strike (deprecated) - use span with styling
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          strike: ({ children, ...props }: any) => (
            <span className="line-through opacity-70" {...props}>
              {children}
            </span>
          ),
          s: ({ children, ...props }) => <s className="line-through opacity-70" {...props}>{children}</s>,
          // Insert
          ins: ({ children, ...props }) => <ins className="underline decoration-green-500" {...props}>{children}</ins>,
          // Teletype (deprecated) - use span with font-mono
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tt: ({ children, ...props }: any) => <span className="font-mono" {...props}>{children}</span>,
          // Font (deprecated) - pass through
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          font: ({ children, ...props }: any) => <span {...props}>{children}</span>,
          // Center (deprecated)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          center: ({ children, ...props }: any) => <div className="text-center" {...props}>{children}</div>,
          // Task list items (GFM)
          input: (props) => {
            const inputProps = props as { type?: string; checked?: boolean }
            if (inputProps.type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={inputProps.checked}
                  readOnly
                  className="mr-2 accent-[var(--color-primary)]"
                />
              )
            }
            return <input {...props} />
          },
          // Form elements
          form: ({ children, ...props }) => <form className="my-2 p-3 bg-[var(--color-bg-darker)] rounded-lg" {...props}>{children}</form>,
          fieldset: ({ children, ...props }) => <fieldset className="border border-[var(--color-border)] p-3 rounded-lg" {...props}>{children}</fieldset>,
          legend: ({ children, ...props }) => <legend className="px-2 font-semibold" {...props}>{children}</legend>,
          label: ({ children, ...props }) => <label className="block mb-1 text-sm font-medium" {...props}>{children}</label>,
          textarea: (props) => <textarea className="w-full p-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]" {...props} />,
          select: ({ children, ...props }) => (
            <select className="w-full p-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]" {...props}>
              {children}
            </select>
          ),
          option: ({ children, ...props }) => <option {...props}>{children}</option>,
          optgroup: ({ children, ...props }) => <optgroup {...props}>{children}</optgroup>,
          button: ({ children, ...props }) => (
            <button className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity" {...props}>
              {children}
            </button>
          ),
          output: ({ children, ...props }) => <output className="block p-2 bg-[var(--color-bg-tertiary)] rounded-lg" {...props}>{children}</output>,
          meter: (props) => <meter className="w-full h-4" {...props} />,
          progress: (props) => <progress className="w-full h-4" {...props} />,
          datalist: ({ children, ...props }) => <datalist {...props}>{children}</datalist>,
          // Sections
          article: ({ children, ...props }) => <article className="my-2 p-3 bg-[var(--color-bg-darker)] rounded-lg" {...props}>{children}</article>,
          section: ({ children, ...props }) => <section className="my-2" {...props}>{children}</section>,
          nav: ({ children, ...props }) => <nav className="my-2" {...props}>{children}</nav>,
          aside: ({ children, ...props }) => <aside className="my-2 p-3 bg-[var(--color-bg-darker)] rounded-lg" {...props}>{children}</aside>,
          header: ({ children, ...props }) => <header className="my-2" {...props}>{children}</header>,
          footer: ({ children, ...props }) => <footer className="my-2" {...props}>{children}</footer>,
          main: ({ children, ...props }) => <main {...props}>{children}</main>,
          address: ({ children, ...props }) => <address className="italic text-[var(--color-text-muted)] my-2" {...props}>{children}</address>,
          hgroup: ({ children, ...props }) => <hgroup className="my-2" {...props}>{children}</hgroup>,
          // Div and Span for custom styling
          div: ({ children, ...props }) => <div {...props}>{children}</div>,
          span: ({ children, ...props }) => <span {...props}>{children}</span>,
          // Menu
          menu: ({ children, ...props }) => <menu className="list-none p-0 m-0" {...props}>{children}</menu>,
          // SVG elements - pass through with minimal styling
          svg: ({ children, ...props }) => <svg className="max-w-full h-auto" {...props}>{children as ReactNode}</svg>,
          path: (props) => <path {...props} />,
          circle: (props) => <circle {...props} />,
          rect: (props) => <rect {...props} />,
          line: (props) => <line {...props} />,
          ellipse: (props) => <ellipse {...props} />,
          polygon: (props) => <polygon {...props} />,
          polyline: (props) => <polyline {...props} />,
          g: ({ children, ...props }) => <g {...props}>{children as ReactNode}</g>,
          defs: ({ children, ...props }) => <defs {...props}>{children as ReactNode}</defs>,
          use: (props) => <use {...props} />,
          symbol: ({ children, ...props }) => <symbol {...props}>{children as ReactNode}</symbol>,
          clipPath: ({ children, ...props }) => <clipPath {...props}>{children as ReactNode}</clipPath>,
          linearGradient: ({ children, ...props }) => <linearGradient {...props}>{children as ReactNode}</linearGradient>,
          radialGradient: ({ children, ...props }) => <radialGradient {...props}>{children as ReactNode}</radialGradient>,
          stop: (props) => <stop {...props} />,
          filter: ({ children, ...props }) => <filter {...props}>{children as ReactNode}</filter>,
          feGaussianBlur: (props) => <feGaussianBlur {...props} />,
          // Line break
          br: (props) => <br {...props} />,
          // Word break opportunity
          wbr: (props) => <wbr {...props} />,
        // Type assertion needed: react-markdown's Components type doesn't include deprecated HTML elements
        // like 'strike', 'tt', 'font', 'center' which we handle for legacy content support
        } as React.ComponentPropsWithoutRef<typeof ReactMarkdown>['components']}
      >
        {decodedContent}
      </ReactMarkdown>
    </div>
  )
}