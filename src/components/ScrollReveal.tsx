import { useEffect, useRef, useState, type ReactNode } from 'react'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'fade' | 'left' | 'right'
  /** Re-animate when scrolling back up (default: once) */
  once?: boolean
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const dirClass = {
    up: 'scroll-reveal-up',
    fade: 'scroll-reveal-fade',
    left: 'scroll-reveal-left',
    right: 'scroll-reveal-right',
  }[direction]

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${dirClass} ${visible ? 'scroll-reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
