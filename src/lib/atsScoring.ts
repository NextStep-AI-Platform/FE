import type { ATSIssue, ComputedExperience, ExperienceUnit, ScanConfig } from '../types'
import { compareExperienceToJdMin, minExperienceToMonths } from './cvExperience'
import type { JdPresetId } from './cvJdMatch'

/**
 * Trọng số ATS composite (tham chiếu thực tế 2024–2026):
 * - Keyword/hard skills: ưu tiên cao nhất (Taleo/Workday rank theo required terms, hard skill ~2× soft)
 * - Experience: YOE + recency + title alignment
 * - Format/presentation: gate parse (layout, PDF text, section chuẩn)
 * - Structure: penalty từ lỗi cấu trúc ATS (header, date, section lệch)
 */
export const ATS_COMPONENT_WEIGHTS = {
  keyword: 0.38,
  experience: 0.32,
  presentation: 0.22,
  structure: 0.08,
} as const

export interface AtsScoreInput {
  keyword: number
  experience: number
  presentation: number
}

export interface AtsScoreBreakdown {
  finalScore: number
  components: {
    keyword: { score: number; weight: number; contribution: number; label: string }
    experience: { score: number; weight: number; contribution: number; label: string }
    presentation: { score: number; weight: number; contribution: number; label: string }
    structure: { score: number; weight: number; contribution: number; label: string }
  }
  penalties: {
    issuePenalty: number
    jdMinPenalty: number
  }
  summary: string
}

const ISSUE_PENALTY = { high: 10, medium: 5, low: 2 } as const

export function computeStructureScoreFromIssues(issues: ATSIssue[]): number {
  const penalty = issues.reduce(
    (sum, issue) => sum + ISSUE_PENALTY[issue.severity],
    0,
  )
  return Math.max(0, 100 - Math.min(penalty, 45))
}

export function computeJdMinAtsPenalty(
  config: ScanConfig,
  computedExperience: ComputedExperience | undefined,
  jdId?: JdPresetId | null,
): number {
  if (
    config.jdMinExperience === undefined ||
    !config.jdMinExperienceUnit ||
    !computedExperience
  ) {
    return 0
  }

  const preferRelevant = jdId === 'big_data_de' || jdId === 'belending_ba'
  const candidateMonths =
    preferRelevant && computedExperience.relevantMonths != null
      ? computedExperience.relevantMonths
      : computedExperience.totalMonths

  const status = compareExperienceToJdMin(
    candidateMonths,
    config.jdMinExperience,
    config.jdMinExperienceUnit,
  )
  if (status === 'meets') return 0

  const required = minExperienceToMonths(config.jdMinExperience, config.jdMinExperienceUnit)
  const gapRatio = Math.min(1, (required - candidateMonths) / Math.max(required, 1))
  return Math.round(gapRatio * 18)
}

export function computeAtsScore(
  input: AtsScoreInput,
  atsIssues: ATSIssue[],
  options?: {
    config?: ScanConfig
    computedExperience?: ComputedExperience
    jdId?: JdPresetId | null
  },
): AtsScoreBreakdown {
  const structureScore = computeStructureScoreFromIssues(atsIssues)
  const w = ATS_COMPONENT_WEIGHTS

  const keywordContrib = input.keyword * w.keyword
  const experienceContrib = input.experience * w.experience
  const presentationContrib = input.presentation * w.presentation
  const structureContrib = structureScore * w.structure

  const weightedBase =
    keywordContrib + experienceContrib + presentationContrib + structureContrib

  const issuePenalty = Math.round(100 - structureScore)
  const jdMinPenalty = computeJdMinAtsPenalty(
    options?.config ?? { company: '' },
    options?.computedExperience,
    options?.jdId,
  )

  const finalScore = Math.round(
    Math.max(0, Math.min(100, weightedBase - jdMinPenalty)),
  )

  const summary =
    jdMinPenalty > 0
      ? 'Điểm ATS = keyword (38%) + kinh nghiệm (32%) + format (22%) + cấu trúc (8%), trừ penalty yêu cầu KN JD.'
      : 'Điểm ATS = keyword (38%) + kinh nghiệm (32%) + format (22%) + cấu trúc (8%). Keyword & KN required được ưu tiên cao hơn soft skill/format.'

  return {
    finalScore,
    components: {
      keyword: {
        score: input.keyword,
        weight: w.keyword,
        contribution: Math.round(keywordContrib * 10) / 10,
        label: 'Độ khớp từ khóa (hard skills JD)',
      },
      experience: {
        score: input.experience,
        weight: w.experience,
        contribution: Math.round(experienceContrib * 10) / 10,
        label: 'Kinh nghiệm & recency',
      },
      presentation: {
        score: input.presentation,
        weight: w.presentation,
        contribution: Math.round(presentationContrib * 10) / 10,
        label: 'Format / khả năng parse',
      },
      structure: {
        score: structureScore,
        weight: w.structure,
        contribution: Math.round(structureContrib * 10) / 10,
        label: 'Cấu trúc section & ATS issues',
      },
    },
    penalties: { issuePenalty, jdMinPenalty },
    summary,
  }
}
