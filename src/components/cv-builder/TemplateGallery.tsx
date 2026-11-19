import { Check } from 'lucide-react'
import { CV_TEMPLATES, SAMPLE_CV } from '../../data/cvTemplates'
import CvRenderer from './CvRenderer'

export default function TemplateGallery({ value, onChange, onNext }: {
  value: string
  onChange: (id: string) => void
  onNext: () => void
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-5">
      <p className="text-ns-muted text-sm mb-4">Chọn một mẫu CV. Bạn có thể đổi mẫu bất cứ lúc nào.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CV_TEMPLATES.map(t => {
          const active = t.id === value
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              onDoubleClick={() => { onChange(t.id); onNext() }}
              className={`text-left rounded-xl border-2 overflow-hidden transition cursor-pointer ${
                active ? 'border-blue-500 shadow-lg' : 'border-ns hover:border-blue-500/40'
              }`}
            >
              <div className="h-56 overflow-hidden bg-slate-100 relative">
                <div className="absolute top-0 left-0 w-[285%] origin-top-left scale-[0.35] pointer-events-none">
                  <CvRenderer cv={SAMPLE_CV} templateId={t.id} className="!shadow-none !rounded-none" />
                </div>
                {active && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check size={14} />
                  </span>
                )}
              </div>
              <div className="p-3 bg-ns-card">
                <p className="text-ns-primary text-sm font-medium">{t.name}</p>
                <p className="text-ns-faint text-xs mt-0.5">{t.description}</p>
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex justify-end mt-6">
        <button type="button" onClick={onNext} className="btn-primary text-sm px-6">Tiếp tục</button>
      </div>
    </div>
  )
}
