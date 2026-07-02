import type { CourseRecommendation, ScanRecord } from '../types'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const SCORE_THRESHOLD = 70

export function isWithinLast30Days(iso: string, now = Date.now()): boolean {
  return now - new Date(iso).getTime() <= THIRTY_DAYS_MS
}

export interface DashboardScanMatch {
  scanId: string
  title: string
  company: string
  role: string
  score: number
  analyzedAt: string
  topCompanyName?: string
  topCompanyMatch?: number
}

export function getQualifyingScans(scans: ScanRecord[]): DashboardScanMatch[] {
  return scans
    .filter(s => s.overallScore >= SCORE_THRESHOLD && isWithinLast30Days(s.analyzedAt))
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
    .map(s => ({
      scanId: s.id,
      title: s.title,
      company: s.company,
      role: s.role,
      score: s.overallScore,
      analyzedAt: s.analyzedAt,
      topCompanyName: s.result.companies?.[0]?.name,
      topCompanyMatch: s.result.companies?.[0]?.match,
    }))
}

export interface AggregatedCourse extends CourseRecommendation {
  count: number
}

export function aggregateCourses(scans: ScanRecord[]): AggregatedCourse[] {
  const recent = scans.filter(s => isWithinLast30Days(s.analyzedAt))
  const map = new Map<string, AggregatedCourse>()

  for (const scan of recent) {
    for (const course of scan.result.courses ?? []) {
      const key = course.url || course.title
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
      } else {
        map.set(key, { ...course, count: 1 })
      }
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'vi'))
}

export function getRecentScansForStats(scans: ScanRecord[]): ScanRecord[] {
  return scans.filter(s => isWithinLast30Days(s.analyzedAt))
}
