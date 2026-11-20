import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import TemplateGallery from './TemplateGallery'
import CvForm from './CvForm'
import CvRenderer from './CvRenderer'
import { approxLength, compactCv, emptyCv, filledSections, isCvEmpty, normalizeCv } from '../../lib/cvStructured'
import { DEFAULT_TEMPLATE_ID } from '../../data/cvTemplates'
import type { CvStructured } from '../../types/cvStructured'

const DRAFT_KEY = 'ns-cv-builder-draft'

interface Draft { cv: CvStructured; templateId: string }

function loadDraft(): Draft | null {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (!raw?.cv) return null
    return { cv: normalizeCv(raw.cv), templateId: typeof raw.templateId === 'string' ? raw.templateId : DEFAULT_TEMPLATE_ID }
  } catch {
    return null
  }
}

/** Popup: pick a template, then fill an optional form with live preview. */
export default function CvBuilderModal({ open, initial, initialTemplateId, onClose, onUse }: {
  open: boolean
  initial?: CvStructured | null
  initialTemplateId?: string | null
  onClose: () => void
  onUse: (cv: CvStructured, templateId: string) => void
}) {
  if (!open) return null
  return createPortal(
    <Inner initial={initial} initialTemplateId={initialTemplateId} onClose={onClose} onUse={onUse} />,
    document.body,
  )
}

function Inner({ initial, initialTemplateId, onClose, onUse }: {
  initial?: CvStructured | null
  initialTemplateId?: string | null
  onClose: () => void
  onUse: (cv: CvStructured, templateId: string) => void
}) {
  const [draft] = useState(loadDraft)
  const [step, setStep] = useState<'gallery' | 'form'>(initial ? 'form' : 'gallery')
  const [templateId, setTemplateId] = useState(initialTemplateId ?? draft?.templateId ?? DEFAULT_TEMPLATE_ID)
  const [cv, setCv] = useState<CvStructured>(() => initial ?? draft?.cv ?? emptyCv())
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form')

  useEffect(() => {
    const t = window.setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ cv, templateId })) } catch { /* storage unavailable */ }
    }, 500)
    return () => window.clearTimeout(t)
  }, [cv, templateId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const { filled, total } = filledSections(cv)
  const empty = isCvEmpty(cv)
  const thin = !empty && approxLength(cv) < 300

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      role="dialog" aria-modal="true" aria-label="Tạo CV từ template"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-ns-card border border-ns rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-xl">
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-ns">
          <div className="min-w-0">
            <h2 className="font-heading font-semibold text-ns-primary">Tạo CV từ template</h2>
            <p className="text-ns-faint text-xs">Không bắt buộc điền đủ, mục trống sẽ được ẩn · {filled}/{total} mục</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="p-2 rounded-lg hover:bg-ns-raised cursor-pointer text-ns-muted">
            <X size={18} />
          </button>
        </header>

        {step === 'gallery' ? (
          <TemplateGallery value={templateId} onChange={setTemplateId} onNext={() => setStep('form')} />
        ) : (
          <>
            <div className="lg:hidden flex gap-2 p-2 border-b border-ns">
              {(['form', 'preview'] as const).map(k => (
                <button key={k} type="button" onClick={() => setMobileTab(k)}
                  className={`flex-1 py-1.5 rounded-lg text-sm cursor-pointer ${mobileTab === k ? 'bg-blue-600 text-white' : 'text-ns-muted'}`}>
                  {k === 'form' ? 'Điền thông tin' : 'Xem trước'}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 grid lg:grid-cols-2">
              <div className={`overflow-y-auto p-5 ${mobileTab === 'preview' ? 'hidden lg:block' : ''}`}>
                <CvForm value={cv} onChange={setCv} />
              </div>
              <div className={`overflow-y-auto p-5 bg-ns-page ${mobileTab === 'form' ? 'hidden lg:block' : ''}`}>
                {empty
                  ? <p className="text-ns-faint text-sm text-center mt-10">Bản xem trước sẽ hiện khi bạn bắt đầu điền.</p>
                  : <CvRenderer cv={cv} templateId={templateId} />}
              </div>
            </div>
          </>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-ns">
          <div className="text-xs">
            {step === 'form' && thin && <span className="text-amber-500">CV khá ngắn, kết quả phân tích có thể chưa chính xác.</span>}
            {step === 'form' && empty && <span className="text-ns-faint">Điền ít nhất một thông tin để dùng CV.</span>}
          </div>
          <div className="flex gap-2">
            {step === 'form' && (
              <button type="button" onClick={() => setStep('gallery')}
                className="border border-ns px-4 py-2 rounded-xl text-sm text-ns-secondary cursor-pointer hover:bg-ns-raised">
                Đổi template
              </button>
            )}
            {step === 'form' && (
              <button type="button" disabled={empty} onClick={() => onUse(compactCv(cv), templateId)}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Dùng CV này
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
