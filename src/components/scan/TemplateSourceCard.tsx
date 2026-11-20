import { LayoutTemplate, Pencil, Trash2 } from 'lucide-react'
import { getTemplate } from '../../data/cvTemplates'
import { filledSections } from '../../lib/cvStructured'
import type { CvStructured } from '../../types/cvStructured'

export default function TemplateSourceCard({ structured, templateId, onOpen, onClear }: {
  structured: CvStructured | null
  templateId: string | null
  onOpen: () => void
  onClear: () => void
}) {
  if (!structured) {
    return (
      <button type="button" onClick={onOpen}
        className="border-2 border-dashed border-ns hover:border-blue-500/50 rounded-xl p-6 flex-1 min-h-0 flex flex-col items-center justify-center text-center cursor-pointer transition">
        <LayoutTemplate size={32} className="text-blue-400 mb-3" />
        <p className="text-ns-secondary text-sm">Tạo CV từ mẫu có sẵn</p>
        <p className="text-ns-faint text-xs mt-1">Chọn template, điền thông tin. Không bắt buộc điền đủ.</p>
        <span className="btn-primary text-sm mt-4">Mở trình tạo CV</span>
      </button>
    )
  }
  const { filled, total } = filledSections(structured)
  const p = structured.personal
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      <div className="p-4 bg-ns-page rounded-xl border border-ns">
        <div className="flex items-start gap-3">
          <LayoutTemplate size={20} className="text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-ns-primary text-sm font-medium truncate">{p.fullName || 'CV chưa có tên'}</p>
            <p className="text-ns-faint text-xs mt-0.5 truncate">{p.title || 'Chưa có chức danh'}</p>
            <p className="text-ns-faint text-xs mt-2">
              Mẫu: <span className="text-ns-secondary">{getTemplate(templateId).name}</span> · {filled}/{total} mục đã điền
            </p>
          </div>
          <button type="button" onClick={onClear} aria-label="Bỏ CV template" className="text-ns-faint hover:text-red-400 cursor-pointer shrink-0">
            <Trash2 size={16} />
          </button>
        </div>
        {structured.skills.technical.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {structured.skills.technical.slice(0, 8).map(s => (
              <span key={s} className="text-[11px] bg-blue-600/10 text-blue-500 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
      </div>
      <button type="button" onClick={onOpen}
        className="border border-ns rounded-xl py-2 text-sm text-ns-secondary hover:bg-ns-raised flex items-center justify-center gap-2 cursor-pointer">
        <Pencil size={14} /> Chỉnh sửa CV
      </button>
    </div>
  )
}
