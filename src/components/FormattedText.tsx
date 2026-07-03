import type { ReactNode } from 'react'

/** Render inline **bold** markers in mock copy (không parse full markdown) */
export function FormattedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  const nodes: ReactNode[] = parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-ns-primary">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
  return <span className={className}>{nodes}</span>
}
