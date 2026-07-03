import type { ATSIssue, ComputedExperience, ScanConfig } from '../types'
import { computeJdMinAtsPenalty } from './atsScoring'
import type { JdPresetId } from './cvJdMatch'

/** Coverage Score (CS) — mức phù hợp tổng thể CV×JD */
export const COVERAGE_WEIGHTS = {
  keyword: 0.3,
  experience: 0.3,
  ats: 0.25,
  presentation: 0.15,
} as const

export interface CoverageScoreInput {
  keyword: number
  experience: number
  presentation: number
  ats: number
}

export interface CoverageScoreBreakdown {
  finalScore: number
  components: {
    keyword: { score: number; weight: number; contribution: number; label: string }
    experience: { score: number; weight: number; contribution: number; label: string }
    ats: { score: number; weight: number; contribution: number; label: string }
    presentation: { score: number; weight: number; contribution: number; label: string }
  }
  penalties: { jdMinPenalty: number }
  summary: string
}

export function computeCoverageScore(
  input: CoverageScoreInput,
  options?: {
    config?: ScanConfig
    computedExperience?: ComputedExperience
    jdId?: JdPresetId | null
  },
): CoverageScoreBreakdown {
  const w = COVERAGE_WEIGHTS
  const keywordContrib = input.keyword * w.keyword
  const experienceContrib = input.experience * w.experience
  const atsContrib = input.ats * w.ats
  const presentationContrib = input.presentation * w.presentation

  const jdMinPenalty = Math.round(
    computeJdMinAtsPenalty(
      options?.config ?? { company: '' },
      options?.computedExperience,
      options?.jdId,
    ) * 0.5,
  )

  const weightedBase =
    keywordContrib + experienceContrib + atsContrib + presentationContrib

  const finalScore = Math.round(
    Math.max(0, Math.min(100, weightedBase - jdMinPenalty)),
  )

  return {
    finalScore,
    components: {
      keyword: {
        score: input.keyword,
        weight: w.keyword,
        contribution: Math.round(keywordContrib * 10) / 10,
        label: 'Độ khớp từ khóa & hard skills',
      },
      experience: {
        score: input.experience,
        weight: w.experience,
        contribution: Math.round(experienceContrib * 10) / 10,
        label: 'Kinh nghiệm & domain fit',
      },
      ats: {
        score: input.ats,
        weight: w.ats,
        contribution: Math.round(atsContrib * 10) / 10,
        label: 'Khả năng vượt ATS',
      },
      presentation: {
        score: input.presentation,
        weight: w.presentation,
        contribution: Math.round(presentationContrib * 10) / 10,
        label: 'Trình bày & cấu trúc CV',
      },
    },
    penalties: { jdMinPenalty },
    summary:
      'Coverage Score = keyword (30%) + kinh nghiệm (30%) + ATS (25%) + trình bày (15%). Phản ánh mức phù hợp thực tế CV với JD.',
  }
}

/** Gợi ý điểm keyword từ danh sách matched/missing (tham chiếu khi soát preset) */
export function estimateKeywordScore(matched: number, missing: number): number {
  const total = matched + missing
  if (total === 0) return 0
  return Math.round((matched / total) * 100)
}
