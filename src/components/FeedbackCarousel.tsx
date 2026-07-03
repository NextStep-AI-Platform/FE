import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'
import AssetImage from './AssetImage'
import { TESTIMONIALS, type Testimonial } from '../data/testimonials'
import { getInitials } from '../lib/utils'

const AUTO_MS = 5000
const GAP_PX = 16
const CARD_MIN_H = 340

function useVisibleCount() {
  const [visible, setVisible] = useState(3)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setVisible(mq.matches ? 3 : 1)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return visible
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0" aria-label={`${rating} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'keep-accent text-amber-400 fill-amber-400' : 'text-ns-faint/40'}
        />
      ))}
      <span className="text-ns-muted text-xs ml-1.5 font-medium">{rating}/5</span>
    </div>
  )
}

function FeedbackCard({ item, widthPx }: { item: Testimonial; widthPx: number }) {
  return (
    <article
      className="feedback-card shrink-0 bg-ns-card border border-ns rounded-2xl p-5 shadow-card flex flex-col gap-3"
      style={{ width: widthPx, minHeight: CARD_MIN_H, height: CARD_MIN_H }}
    >
      <div className="flex items-start gap-3 shrink-0">
        <AssetImage
          src={item.avatar}
          alt={item.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/20 shrink-0"
          fallback={
            <span className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {getInitials(item.name)}
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <p className="text-ns-primary font-semibold text-sm leading-snug">{item.name}</p>
          <p className="text-ns-faint text-[11px] leading-snug mt-0.5 min-h-[2.5rem]">{item.role}</p>
        </div>
        <Quote size={18} className="keep-accent text-blue-400/50 shrink-0" aria-hidden />
      </div>
      <p className="text-ns-secondary text-sm leading-relaxed flex-1 overflow-y-auto pr-0.5">{item.content}</p>
      <div className="flex items-center justify-between pt-3 border-t border-ns-sub gap-2 shrink-0">
        <StarRow rating={item.rating} />
        <time className="text-ns-faint text-[11px] shrink-0">{item.date}</time>
      </div>
    </article>
  )
}

export default function FeedbackCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [cardWidth, setCardWidth] = useState(0)
  const [paused, setPaused] = useState(false)
  const dragRef = useRef({ active: false, startX: 0, startIndex: 0, moved: false })
  const visibleCount = useVisibleCount()

  const maxIndex = Math.max(0, TESTIMONIALS.length - visibleCount)
  const slideStep = cardWidth + GAP_PX

  const measure = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return
    const w = vp.clientWidth
    const cw = (w - GAP_PX * (visibleCount - 1)) / visibleCount
    setCardWidth(Math.floor(cw))
  }, [visibleCount])

  useEffect(() => {
    measure()
    const vp = viewportRef.current
    if (!vp) return
    const ro = new ResizeObserver(measure)
    ro.observe(vp)
    return () => ro.disconnect()
  }, [measure])

  useEffect(() => {
    setIndex(prev => Math.min(prev, maxIndex))
  }, [maxIndex])

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1))
    },
    [maxIndex],
  )

  useEffect(() => {
    if (paused || maxIndex === 0) return
    const timer = window.setInterval(() => {
      setIndex(prev => (prev >= maxIndex ? 0 : prev + 1))
    }, AUTO_MS)
    return () => window.clearInterval(timer)
  }, [paused, maxIndex])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragRef.current = { active: true, startX: e.clientX, startIndex: index, moved: false }
    setPaused(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || slideStep <= 0) return
    const delta = e.clientX - dragRef.current.startX
    if (Math.abs(delta) > 8) dragRef.current.moved = true
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    const delta = e.clientX - dragRef.current.startX
    dragRef.current.active = false
    if (dragRef.current.moved && slideStep > 0) {
      const steps = Math.round(-delta / slideStep)
      if (steps !== 0) goTo(index + steps)
      else if (delta < -40) goTo(index + 1)
      else if (delta > 40) goTo(index - 1)
    }
    window.setTimeout(() => setPaused(false), AUTO_MS)
  }

  const handlePrev = () => {
    setPaused(true)
    goTo(index - 1)
    window.setTimeout(() => setPaused(false), AUTO_MS)
  }

  const handleNext = () => {
    setPaused(true)
    goTo(index + 1)
    window.setTimeout(() => setPaused(false), AUTO_MS)
  }

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10 animate-slide-up">
          <p className="text-blue-400 keep-accent text-sm font-semibold uppercase tracking-wider mb-2">
            Phản hồi từ sinh viên
          </p>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-ns-primary mb-3">
            Họ nói gì sau khi scan CV?
          </h2>
          <p className="text-ns-muted text-sm md:text-[15px] max-w-5xl mx-auto px-2 md:whitespace-nowrap">
            Sinh viên năm 3–4 và người đi thực tập chia sẻ trải nghiệm thật với NextStep AI
          </p>
        </div>

        <div
          className="flex items-center gap-2 md:gap-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            type="button"
            onClick={handlePrev}
            disabled={maxIndex === 0}
            className="hidden md:flex w-10 h-10 shrink-0 rounded-full bg-ns-card border border-ns shadow-card items-center justify-center text-ns-muted hover:text-ns-primary hover:border-blue-500/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trước"
          >
            <ChevronLeft size={20} />
          </button>

          <div ref={viewportRef} className="flex-1 overflow-hidden min-w-0">
            <div
              className="flex feedback-track"
              style={{
                gap: GAP_PX,
                transform: slideStep > 0 ? `translate3d(-${index * slideStep}px, 0, 0)` : undefined,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {TESTIMONIALS.map(item => (
                <FeedbackCard key={item.id} item={item} widthPx={cardWidth || 280} />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={maxIndex === 0}
            className="hidden md:flex w-10 h-10 shrink-0 rounded-full bg-ns-card border border-ns shadow-card items-center justify-center text-ns-muted hover:text-ns-primary hover:border-blue-500/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Sau"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            type="button"
            onClick={handlePrev}
            className="md:hidden w-9 h-9 rounded-full bg-ns-card border border-ns flex items-center justify-center cursor-pointer"
            aria-label="Trước"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === i ? 'keep-accent bg-blue-500 w-6' : 'bg-ns-raised w-2 hover:bg-ns-muted'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="md:hidden w-9 h-9 rounded-full bg-ns-card border border-ns flex items-center justify-center cursor-pointer"
            aria-label="Sau"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
