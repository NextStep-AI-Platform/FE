import { Check, ExternalLink, MapPin } from 'lucide-react'
import type { JdSuggestion } from '../../lib/api/jdSuggestions'

export default function JdSuggestionCard({ item, selected, onSelect, onViewDetail }: {
  item: JdSuggestion
  selected: boolean
  onSelect: () => void
  onViewDetail: () => void
}) {
  const badge = item.matchPercent >= 75
    ? 'bg-green-500/15 text-green-500'
    : item.matchPercent >= 50 ? 'bg-amber-500/15 text-amber-500' : 'bg-ns-raised text-ns-muted'
  return (
    <div className={`rounded-xl border p-3.5 transition ${selected ? 'border-blue-500 bg-blue-600/5' : 'border-ns bg-ns-page'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-ns-primary text-sm font-medium leading-snug">{item.title}</p>
          <p className="text-ns-muted text-xs mt-0.5 truncate">{item.company}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge}`} title="Mức độ liên quan với CV">
          {item.matchPercent}%
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-ns-faint">
        {item.location && <span className="inline-flex items-center gap-0.5"><MapPin size={11} />{item.location}</span>}
        {item.level && <span>· {item.level}</span>}
        {item.skills.slice(0, 6).map(s => (
          <span key={s} className="bg-ns-raised text-ns-secondary px-1.5 py-0.5 rounded">{s}</span>
        ))}
      </div>
      {item.why.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {item.why.map(w => (
            <li key={w} className="text-[11px] text-ns-muted flex gap-1"><Check size={12} className="text-green-500 shrink-0 mt-px" />{w}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-ns">
        <div className="text-[10px] text-ns-faint flex items-center gap-2 min-w-0">
          {item.attribution && <span className="truncate">{item.attribution}</span>}
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-blue-500 hover:underline shrink-0">
            Tin gốc <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={onViewDetail} className="text-xs px-2.5 py-1 rounded-lg border border-ns text-ns-secondary hover:bg-ns-raised cursor-pointer">
            Xem JD
          </button>
          <button type="button" onClick={onSelect}
            className={`text-xs px-2.5 py-1 rounded-lg cursor-pointer ${selected ? 'bg-blue-600 text-white' : 'bg-blue-600/10 text-blue-500 hover:bg-blue-600/20'}`}>
            {selected ? 'Đã chọn ✓' : 'Chọn JD này'}
          </button>
        </div>
      </div>
    </div>
  )
}
