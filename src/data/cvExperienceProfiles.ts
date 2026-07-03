import type { JdPresetId } from '../lib/cvJdMatch'
import type { CvPresetId } from '../lib/cvJdMatch'
import {
  computeExperienceFromPeriods,
  computeRelevantMonthsFromPeriods,
  formatExperienceMonths,
  formatExperienceTimelineSummary,
  type CvWorkPeriod,
} from '../lib/cvExperience'
import type { ComputedExperience } from '../types'

/** Timeline làm việc mock — bám nội dung CV demo trong folder CV&JD */
const CV_WORK_PERIODS: Record<CvPresetId, CvWorkPeriod[]> = {
  gia_khanh: [
    { company: 'Whitestar Beauty', role: 'Livestream Operator', startYear: 2025, startMonth: 7, endYear: 2026, endMonth: 1 },
    { company: 'Likapz', role: 'Trợ live / Kịch bản', startYear: 2026, startMonth: 2, endYear: 2026, endMonth: 5 },
  ],
  hai_dang: [
    { company: 'AI Business Summary', role: 'AI / LLM project', startYear: 2025, startMonth: 2, endYear: 2025, endMonth: 6 },
    { company: 'Auto-Evaluator Framework', role: 'Evaluation pipeline', startYear: 2025, startMonth: 6, endYear: 2025, endMonth: 8 },
    { company: 'SCGC HR Agent', role: 'AI/Data pipeline', startYear: 2025, startMonth: 9, endYear: 2026, endMonth: 5 },
    { company: 'Lease Control Tower', role: 'Data Engineer (PySpark/Databricks)', startYear: 2026, startMonth: 5, isPresent: true },
  ],
  khanh_my: [
    { company: 'Prime Real Estate', role: 'Customer Service intern', startYear: 2025, startMonth: 6, endYear: 2025, endMonth: 9 },
    { company: 'Henmet Charity', role: 'Sales / Fundraising volunteer', startYear: 2026, startMonth: 1, endYear: 2026, endMonth: 4 },
  ],
}

/** KN liên quan domain khi so JD — không phải mọi project đều tính full */
const RELEVANT_PERIODS: Partial<Record<`${CvPresetId}:${JdPresetId}`, string[]>> = {
  'hai_dang:big_data_de': ['SCGC HR Agent', 'Lease Control Tower'],
  'hai_dang:belending_ba': ['SCGC HR Agent'],
}

const RELEVANT_DOMAIN_LABEL: Partial<Record<JdPresetId, string>> = {
  big_data_de: 'Big Data / Cloud Data Engineering',
  belending_ba: 'phân tích nghiệp vụ / analytics',
}

/** Mốc tham chiếu cố định cho demo reproducible (tháng 7/2026) */
const DEMO_REFERENCE_DATE = new Date(2026, 6, 1)

export function computeCvPresetExperience(cvId: CvPresetId): ComputedExperience {
  return computeExperienceFromPeriods(CV_WORK_PERIODS[cvId], DEMO_REFERENCE_DATE)
}

export function enrichExperienceForJd(
  cvId: CvPresetId,
  jdId: JdPresetId,
  base: ComputedExperience,
): ComputedExperience {
  const key = `${cvId}:${jdId}` as `${CvPresetId}:${JdPresetId}`
  const relevantNames = RELEVANT_PERIODS[key]
  if (!relevantNames?.length) return base

  const allPeriods = CV_WORK_PERIODS[cvId]
  const relevantPeriods = allPeriods.filter(p => relevantNames.includes(p.company))
  const relevantMonths = computeRelevantMonthsFromPeriods(relevantPeriods, DEMO_REFERENCE_DATE)
  const domainHint = RELEVANT_DOMAIN_LABEL[jdId]

  return {
    ...base,
    relevantMonths,
    relevantLabel: formatExperienceMonths(relevantMonths),
    relevantNote: domainHint
      ? `Chỉ tính mốc liên quan ${domainHint} — không cộng project AI/LLM chung chung.`
      : undefined,
  }
}

export function getCvWorkPeriods(cvId: CvPresetId): CvWorkPeriod[] {
  return CV_WORK_PERIODS[cvId]
}

export function experienceSummaryForCv(cvId: CvPresetId): string {
  return formatExperienceTimelineSummary(computeCvPresetExperience(cvId))
}
