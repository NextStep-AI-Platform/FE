import { useState } from 'react'
import { ChevronDown, Home, RotateCcw, X } from 'lucide-react'
import type { InterviewSessionRecord } from '../../types'
import { formatTimer } from '../../lib/utils'

interface Props {
  session: InterviewSessionRecord
  onClose: () => void
  onContinue: () => void
  onHome: () => void
  /** absolute = blur vùng trang phỏng vấn; fixed = toàn viewport (legacy) */
  overlay?: 'absolute' | 'fixed'
}

export default function InterviewResultModal({ session, onClose, onContinue, onHome, overlay = 'absolute' }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIdx(prev => (prev === i ? null : i))

  return (
    <div
      className={`${overlay === 'fixed' ? 'fixed' : 'absolute'} inset-0 z-50 flex items-center justify-center p-4 bg-ns-page/70 backdrop-blur-md`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-result-title"
    >
      <div className="bg-ns-card border border-ns rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-ns flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-[6px] border-blue-500 score-ring-light flex items-center justify-center bg-ns-page flex-shrink-0">
              <span className="font-heading font-bold keep-accent text-blue-400 text-3xl">{session.overallScore}</span>
            </div>
            <div>
              <h2 id="interview-result-title" className="font-heading font-bold text-ns-primary text-xl">
                Kết quả phỏng vấn
              </h2>
              <p className="text-ns-muted text-sm mt-1">
                {session.role} · {formatTimer(session.durationSeconds)}
              </p>
              <p className="text-ns-faint text-xs mt-0.5">
                {session.questions.length} câu hỏi · {session.questions.length} câu trả lời
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ns-muted hover:text-ns-primary p-2 rounded-lg hover:bg-ns-raised transition cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          <h3 className="font-semibold text-ns-primary text-sm mb-3">Feedback từng câu hỏi</h3>
          {session.questions.map((q, i) => {
            const open = openIdx === i
            const scoreColor =
              q.score >= 80 ? 'keep-accent text-green-400' : q.score >= 60 ? 'keep-accent text-amber-400' : 'keep-accent text-red-400'
            return (
              <div key={i} className="bg-ns-page border border-ns rounded-xl overflow-hidden scan-history-row">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-ns-raised/50 transition"
                  aria-expanded={open}
                >
                  <span className="text-ns-faint text-xs font-medium w-6 flex-shrink-0">{i + 1}.</span>
                  <p className="text-ns-secondary text-sm font-medium flex-1 line-clamp-1">{q.question}</p>
                  <span className={`text-sm font-bold flex-shrink-0 ${scoreColor}`}>{q.score}/100</span>
                  <ChevronDown
                    size={16}
                    className={`text-ns-muted flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-4 pt-1 border-t border-ns space-y-3 animate-fade-in">
                    <div>
                      <p className="text-ns-faint text-xs font-semibold uppercase tracking-wide mb-1">Câu hỏi</p>
                      <p className="text-ns-secondary text-sm leading-relaxed">{q.question}</p>
                    </div>
                    <div>
                      <p className="text-ns-faint text-xs font-semibold uppercase tracking-wide mb-1">Câu trả lời của bạn</p>
                      <p className="text-ns-primary text-sm leading-relaxed bg-ns-card border border-ns rounded-lg p-3">{q.answer}</p>
                    </div>
                    <div>
                      <p className="text-ns-faint text-xs font-semibold uppercase tracking-wide mb-1">Feedback</p>
                      <p className="text-ns-muted text-sm leading-relaxed">{q.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-ns flex-shrink-0">
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 border border-ns text-ns-secondary py-3 rounded-xl hover:bg-ns-raised transition cursor-pointer"
          >
            <RotateCcw size={16} /> Tiếp tục phỏng vấn
          </button>
          <button
            type="button"
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition cursor-pointer"
          >
            <Home size={16} /> Trang chủ
          </button>
        </div>
      </div>
    </div>
  )
}
