import { useState, type ReactNode } from 'react'
import { AlertTriangle, Check, Pencil, X } from 'lucide-react'
import { describePath, hasPlaceholder } from '../../lib/cvStructured'
import type { CvChange, CvDecision, CvStructured } from '../../types/cvStructured'

const TYPE_LABEL: Record<CvChange['type'], string> = {
  keyword: 'Thêm từ khóa',
  rephrase: 'Diễn đạt lại',
  add_info: 'Cần bổ sung',
  reorder: 'Sắp xếp lại',
}

const toLines = (v: string | string[] | null | undefined) => (Array.isArray(v) ? v : v ? [v] : [])

function Highlighted({ text, keywords }: { text: string; keywords: string[] }) {
  const parts: ReactNode[] = []
  const placeholder = /\[Bổ sung[^\]]*\]/gi
  let last = 0
  for (const m of text.matchAll(placeholder)) {
    parts.push(withKeywords(text.slice(last, m.index), keywords, parts.length))
    parts.push(<mark key={`p${m.index}`} className="bg-orange-400/30 text-inherit rounded px-0.5">{m[0]}</mark>)
    last = (m.index ?? 0) + m[0].length
  }
  parts.push(withKeywords(text.slice(last), keywords, parts.length))
  return <>{parts}</>
}

function withKeywords(text: string, keywords: string[], keyBase: number): ReactNode {
  const kws = keywords.filter(Boolean)
  if (!kws.length || !text) return text
  const escaped = kws.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  return text.split(re).map((part, i) =>
    kws.some(k => k.toLowerCase() === part.toLowerCase())
      ? <mark key={`${keyBase}-${i}`} className="bg-green-400/30 text-inherit rounded px-0.5">{part}</mark>
      : part,
  )
}

export default function ChangeItem({ change, decision, cv, onDecide }: {
  change: CvChange
  decision?: CvDecision
  cv: CvStructured | null
  onDecide: (d: CvDecision) => void
}) {
  const isList = Array.isArray(change.after)
  const [editing, setEditing] = useState(false)
  const current = decision?.state === 'edited' ? decision.value ?? change.after : change.after
  const [draft, setDraft] = useState(() => (Array.isArray(current) ? current.join('\n') : current ?? ''))
  const state = decision?.state
  const shownAfter = toLines(current)
  const unresolved = state && state !== 'rejected' && hasPlaceholder(current)

  const save = () => {
    const value = isList ? draft.split('\n').map(s => s.trim()).filter(Boolean) : draft.trim()
    onDecide({ state: 'edited', value })
    setEditing(false)
  }

  return (
    <div className={`bg-ns-card border rounded-xl p-4 ${
      state === 'rejected' ? 'border-ns opacity-60' : state ? 'border-green-500/40' : 'border-ns'
    }`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-500">{TYPE_LABEL[change.type]}</span>
        <span className="text-ns-secondary text-xs font-medium">{describePath(change.path, cv)}</span>
        {change.needsUserConfirmation && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">Cần bạn xác nhận</span>
        )}
        {state && (
          <span className="ml-auto text-[11px] text-ns-faint">
            {state === 'accepted' ? 'Đã chấp nhận' : state === 'edited' ? 'Đã sửa' : 'Đã bỏ qua'}
          </span>
        )}
      </div>

      {change.needsUserConfirmation && (
        <p className="text-[11px] text-amber-600 mb-2">AI không tìm thấy bằng chứng trong CV gốc. Chỉ chấp nhận nếu đúng với bạn.</p>
      )}

      {toLines(change.before).length > 0 && (
        <div className="text-xs bg-red-500/5 border border-red-500/15 rounded-lg p-2 mb-1.5">
          <p className="text-[10px] uppercase font-semibold text-red-400 mb-0.5">Trước</p>
          {toLines(change.before).map((l, i) => <p key={i} className="text-ns-muted line-through decoration-red-400/50">{isList ? `• ${l}` : l}</p>)}
        </div>
      )}

      {editing ? (
        <div className="mb-2">
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={Math.min(8, Math.max(3, draft.split('\n').length + 1))}
            className="input-field text-xs resize-y" />
          {isList && <p className="text-[10px] text-ns-faint mt-1">Mỗi dòng một ý.</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={save} className="btn-primary text-xs px-3 py-1.5">Lưu</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg border border-ns text-ns-secondary cursor-pointer">Hủy</button>
          </div>
        </div>
      ) : (
        <div className="text-xs bg-green-500/5 border border-green-500/15 rounded-lg p-2 mb-2">
          <p className="text-[10px] uppercase font-semibold text-green-500 mb-0.5">Sau</p>
          {shownAfter.map((l, i) => (
            <p key={i} className="text-ns-secondary">{isList ? '• ' : ''}<Highlighted text={l} keywords={change.addedKeywords} /></p>
          ))}
        </div>
      )}

      {change.rationale && <p className="text-[11px] italic text-ns-faint mb-2">{change.rationale}</p>}
      {unresolved && (
        <p className="text-[11px] text-orange-500 flex items-center gap-1 mb-2">
          <AlertTriangle size={12} /> Hãy sửa nội dung trong ngoặc trước khi tải về.
        </p>
      )}

      {!editing && (
        <div className="flex gap-1.5">
          <ActionBtn active={state === 'accepted'} onClick={() => onDecide({ state: 'accepted' })} tone="green"><Check size={12} /> Chấp nhận</ActionBtn>
          <ActionBtn active={state === 'rejected'} onClick={() => onDecide({ state: 'rejected' })} tone="gray"><X size={12} /> Bỏ qua</ActionBtn>
          <ActionBtn active={state === 'edited'} onClick={() => setEditing(true)} tone="blue"><Pencil size={12} /> Sửa</ActionBtn>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ active, onClick, tone, children }: {
  active: boolean; onClick: () => void; tone: 'green' | 'gray' | 'blue'; children: ReactNode
}) {
  const activeCls = { green: 'bg-green-600 text-white border-green-600', gray: 'bg-ns-raised text-ns-primary border-ns', blue: 'bg-blue-600 text-white border-blue-600' }[tone]
  return (
    <button type="button" onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 cursor-pointer ${active ? activeCls : 'border-ns text-ns-secondary hover:bg-ns-raised'}`}>
      {children}
    </button>
  )
}
