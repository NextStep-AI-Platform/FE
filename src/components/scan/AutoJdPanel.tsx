import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, FileSearch, Loader2, RefreshCw, Search, X } from 'lucide-react'
import JdSuggestionCard from './JdSuggestionCard'
import { getJdDetail, type JdDetail, type JdSuggestion, type JdSuggestionsResponse } from '../../lib/api/jdSuggestions'

export type AutoJdState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'results'; data: JdSuggestionsResponse }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }

export default function AutoJdPanel({ hasCv, state, stale, selectedId, onSearch, onSelect, onUseUpload }: {
  hasCv: boolean
  state: AutoJdState
  stale: boolean
  selectedId: string | null
  onSearch: () => void
  onSelect: (item: JdSuggestion) => void
  onUseUpload: () => void
}) {
  const [detail, setDetail] = useState<JdDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const openDetail = async (item: JdSuggestion) => {
    setDetailLoading(true)
    setDetail({ postingId: item.postingId, title: item.title, company: item.company, sourceUrl: item.sourceUrl, jdText: '' })
    try {
      setDetail(await getJdDetail(item.postingId))
    } catch {
      setDetail({ postingId: item.postingId, title: item.title, company: item.company, sourceUrl: item.sourceUrl, jdText: item.excerpt })
    } finally {
      setDetailLoading(false)
    }
  }

  const body = (() => {
    if (!hasCv) {
      return (
        <Center icon={<FileSearch size={32} className="text-blue-400" />}>
          Thêm CV ở cột bên trái trước. Hệ thống sẽ dựa vào CV để tìm JD.
        </Center>
      )
    }
    if (state.kind === 'loading') {
      return (
        <div className="space-y-3">
          <p className="text-ns-muted text-xs flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Đang phân tích CV và tìm tin tuyển dụng phù hợp…</p>
          {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-ns-raised animate-pulse" />)}
        </div>
      )
    }
    if (state.kind === 'error') {
      return (
        <Center icon={<AlertCircle size={32} className="text-red-400" />}>
          <span>{state.message}</span>
          <button type="button" onClick={onSearch} className="btn-primary text-sm mt-3">Thử lại</button>
        </Center>
      )
    }
    if (state.kind === 'empty') {
      return (
        <Center icon={<Search size={32} className="text-ns-faint" />}>
          <span>Chưa tìm thấy JD phù hợp. Thử bỏ bớt bộ lọc công ty/địa điểm, hoặc{' '}
            <button type="button" onClick={onUseUpload} className="text-blue-500 underline cursor-pointer">tải JD của bạn lên</button>.
          </span>
        </Center>
      )
    }
    if (state.kind === 'results') {
      const profile = state.data.profile
      return (
        <div className="space-y-3">
          {stale && (
            <div className="flex items-center justify-between gap-2 text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-lg px-3 py-2">
              <span>CV đã thay đổi.</span>
              <button type="button" onClick={onSearch} className="inline-flex items-center gap-1 font-medium cursor-pointer"><RefreshCw size={12} /> Tìm lại</button>
            </div>
          )}
          {profile && <ProfileBasis profile={profile} />}
          {state.data.items.map(item => (
            <JdSuggestionCard key={item.postingId} item={item} selected={selectedId === item.postingId}
              onSelect={() => onSelect(item)} onViewDetail={() => openDetail(item)} />
          ))}
        </div>
      )
    }
    return (
      <Center icon={<Search size={32} className="text-blue-400" />}>
        <span>Sẵn sàng tìm JD dựa trên CV của bạn. Bạn có thể điền thêm thông tin ở ô bên cạnh (không bắt buộc).</span>
        <button type="button" onClick={onSearch} className="btn-primary text-sm mt-3">Tìm JD phù hợp</button>
      </Center>
    )
  })()

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">{body}</div>
      {detail && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true"
          onMouseDown={e => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="bg-ns-card border border-ns rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="flex items-start justify-between gap-3 px-5 py-3 border-b border-ns">
              <div className="min-w-0">
                <p className="text-ns-primary font-medium">{detail.title}</p>
                <p className="text-ns-faint text-xs">{detail.company}{detail.attribution ? ` · ${detail.attribution}` : ''}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Đóng" className="p-1.5 rounded-lg hover:bg-ns-raised cursor-pointer text-ns-muted"><X size={16} /></button>
            </div>
            <div className="p-5 overflow-y-auto text-sm text-ns-secondary whitespace-pre-line">
              {detailLoading ? <Loader2 size={18} className="animate-spin text-ns-faint" /> : detail.jdText}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function formatMonths(m: number) {
  if (m < 12) return `${m} tháng`
  return m % 12 === 0 ? `${m / 12} năm` : `${(m / 12).toFixed(1)} năm`
}

/** Shows what the search was based on; items marked "từ CV" were filled because the user left them blank. */
function ProfileBasis({ profile }: { profile: NonNullable<JdSuggestionsResponse['profile']> }) {
  const fromCv = new Set(profile.hintsFromCv ?? [])
  const items: { label: string; value: string; cv: boolean }[] = [
    { label: 'Vị trí', value: profile.roles.join(', '), cv: fromCv.has('role') },
    { label: 'Kỹ năng', value: profile.skills.slice(0, 5).join(', '), cv: true },
    { label: 'Kinh nghiệm', value: profile.experienceMonths != null ? formatMonths(profile.experienceMonths) : profile.seniority ?? '', cv: fromCv.has('experience') || profile.experienceMonths == null },
    { label: 'Lĩnh vực', value: (profile.industries ?? []).join(', '), cv: fromCv.has('industry') },
    { label: 'Địa điểm', value: profile.location ?? '', cv: fromCv.has('location') },
  ].filter(i => i.value)
  if (!items.length) return null
  return (
    <div className="text-xs text-ns-faint bg-ns-page border border-ns rounded-lg px-3 py-2">
      <p className="mb-1">Tìm dựa trên:</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map(i => (
          <span key={i.label}>
            {i.label}: <span className="text-ns-secondary">{i.value}</span>
            {i.cv && <span className="ml-1 text-[10px] text-blue-500">(từ CV)</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

function Center({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-ns-muted text-sm px-4">
      <div className="mb-3">{icon}</div>
      {children}
    </div>
  )
}
