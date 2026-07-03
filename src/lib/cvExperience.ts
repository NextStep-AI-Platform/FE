import type { ComputedExperience, ExperienceUnit, WorkTimelineEntry } from '../types'

export interface CvWorkPeriod {
  company: string
  role?: string
  startYear: number
  /** 1–12 */
  startMonth: number
  endYear?: number
  endMonth?: number
  /** true → dùng referenceDate làm mốc kết thúc */
  isPresent?: boolean
}

function toAbsMonth(year: number, month: number): number {
  return year * 12 + month
}

/** Số tháng giữa hai mốc (vd: t1→t5 = 4, t5→t7 = 2) */
export function monthsBetween(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): number {
  const delta = toAbsMonth(endYear, endMonth) - toAbsMonth(startYear, startMonth)
  return Math.max(0, delta)
}

function formatMonthYear(year: number, month: number): string {
  return `${String(month).padStart(2, '0')}/${year}`
}

export function formatExperienceMonths(totalMonths: number): string {
  if (totalMonths <= 0) return 'Chưa có kinh nghiệm'
  if (totalMonths < 12) return `${totalMonths} tháng`
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (months === 0) return `${years} năm`
  return `${years} năm ${months} tháng`
}

function resolveEnd(
  p: CvWorkPeriod,
  refYear: number,
  refMonth: number,
): { endYear: number; endMonth: number } {
  if (p.isPresent) return { endYear: refYear, endMonth: refMonth }
  return { endYear: p.endYear ?? refYear, endMonth: p.endMonth ?? refMonth }
}

function mergeIntervals(intervals: [number, number][]): [number, number][] {
  if (intervals.length === 0) return []
  const sorted = [...intervals].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [[sorted[0][0], sorted[0][1]]]
  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i]
    const last = merged[merged.length - 1]
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end)
    } else {
      merged.push([start, end])
    }
  }
  return merged
}

function unionTotalMonths(intervals: [number, number][]): number {
  return mergeIntervals(intervals).reduce((sum, [start, end]) => sum + (end - start), 0)
}

export function computeExperienceFromPeriods(
  periods: CvWorkPeriod[],
  referenceDate: Date = new Date(),
): ComputedExperience {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1

  const timeline: WorkTimelineEntry[] = periods.map(p => {
    const { endYear, endMonth } = resolveEnd(p, refYear, refMonth)
    const months = monthsBetween(p.startYear, p.startMonth, endYear, endMonth)
    return {
      company: p.company,
      role: p.role,
      from: formatMonthYear(p.startYear, p.startMonth),
      to: p.isPresent ? 'Hiện tại' : formatMonthYear(endYear, endMonth),
      months,
    }
  })

  const intervals = periods.map(p => {
    const { endYear, endMonth } = resolveEnd(p, refYear, refMonth)
    return [
      toAbsMonth(p.startYear, p.startMonth),
      toAbsMonth(endYear, endMonth),
    ] as [number, number]
  })

  const totalMonths = unionTotalMonths(intervals)

  return {
    totalMonths,
    label: formatExperienceMonths(totalMonths),
    timeline,
  }
}

export function computeRelevantMonthsFromPeriods(
  periods: CvWorkPeriod[],
  referenceDate: Date = new Date(),
): number {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1
  const intervals = periods.map(p => {
    const { endYear, endMonth } = resolveEnd(p, refYear, refMonth)
    return [
      toAbsMonth(p.startYear, p.startMonth),
      toAbsMonth(endYear, endMonth),
    ] as [number, number]
  })
  return unionTotalMonths(intervals)
}

export function formatExperienceTimelineSummary(computed: ComputedExperience): string {
  if (computed.timeline.length === 0) return computed.label
  const parts = computed.timeline.map(e => `${e.company} ${e.months} tháng`)
  return `${computed.label} (${parts.join(' + ')})`
}

export function minExperienceToMonths(value: number, unit: ExperienceUnit): number {
  return unit === 'year' ? value * 12 : value
}

export function formatMinExperienceLabel(value: number, unit: ExperienceUnit): string {
  if (unit === 'year') return value === 1 ? '1 năm' : `${value} năm`
  return `${value} tháng`
}

export interface JdMinComparisonOptions {
  /** Dùng KN liên quan domain thay vì tổng calendar */
  preferRelevant?: boolean
  domainHint?: string
}

export function compareExperienceToJdMin(
  candidateMonths: number,
  jdMinValue: number,
  jdMinUnit: ExperienceUnit,
): 'meets' | 'below' {
  return candidateMonths >= minExperienceToMonths(jdMinValue, jdMinUnit) ? 'meets' : 'below'
}

export function buildJdMinComparisonNote(
  computed: ComputedExperience | undefined,
  jdMinValue: number,
  jdMinUnit: ExperienceUnit,
  options?: JdMinComparisonOptions,
): string {
  const reqLabel = formatMinExperienceLabel(jdMinValue, jdMinUnit)
  const useRelevant = options?.preferRelevant && computed?.relevantMonths != null
  const candidateMonths = useRelevant
    ? computed!.relevantMonths!
    : computed?.totalMonths ?? 0
  const candidateLabel = useRelevant
    ? computed!.relevantLabel!
    : computed?.label ?? 'Chưa xác định'
  const domainSuffix = useRelevant && options?.domainHint
    ? ` (KN liên quan ${options.domainHint}, khác với tổng thời gian làm việc ${computed?.label ?? '—'})`
    : ''
  const status = compareExperienceToJdMin(candidateMonths, jdMinValue, jdMinUnit)
  if (status === 'meets') {
    return `So với yêu cầu tối thiểu ${reqLabel}: ứng viên có ${candidateLabel}${domainSuffix} — đạt ngưỡng.`
  }
  return `So với yêu cầu tối thiểu ${reqLabel}: ứng viên có ${candidateLabel}${domainSuffix} — chưa đạt.`
}
