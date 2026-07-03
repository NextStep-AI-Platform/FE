export interface DonutSegment {
  label: string
  value: number
  color: string
}

const SIZE = 160
const STROKE = 22
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

interface Props {
  segments: DonutSegment[]
  centerLabel?: string
  centerSub?: string
}

export default function InterviewDonutChart({ segments, centerLabel, centerSub }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-[160px] h-[160px] rounded-full border-2 border-dashed border-ns bg-ns-raised/50">
        <p className="text-ns-faint text-xs text-center px-4">Chưa có dữ liệu</p>
      </div>
    )
  }

  let offset = 0
  const arcs = segments.map(seg => {
    const pct = seg.value / total
    const dash = pct * C
    const arc = { ...seg, dash, gap: C - dash, offset: -offset * C }
    offset += pct
    return arc
  })

  return (
    <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--ns-border)" strokeWidth={STROKE} />
        {arcs.map(seg => (
          <circle
            key={seg.label}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={seg.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {centerLabel && <span className="font-heading font-bold text-ns-primary text-2xl">{centerLabel}</span>}
        {centerSub && <span className="text-ns-faint text-[10px] mt-0.5">{centerSub}</span>}
      </div>
    </div>
  )
}

export const ROLE_CHART_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#DC2626',
  '#0891B2',
  '#DB2777',
  '#4F46E5',
] as const
