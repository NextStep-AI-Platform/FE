import type { CVAnalysisResult } from './index'

export const REPORT_V2_SCHEMA_VERSION = '2.0' as const

export type RequirementStatus = 'matched' | 'partial' | 'not_evidenced' | 'unknown'
export type RequirementPriority = 'required' | 'preferred' | 'unknown'

export interface CanonicalScanConfigV2 {
  company: string
  industry: string | null
  role: string | null
  minExperienceMonths: number | null
}

export interface InputSnapshotV2 {
  cvHash: string
  jdHash: string
  config: CanonicalScanConfigV2
  consent: {
    analysisConsent: boolean
    evaluationConsent: boolean
    policyVersion: string | null
  }
  provider: {
    status: 'configured' | 'not_configured'
    provider: string | null
    model: string | null
  }
}

export interface ReportEvidenceV2 {
  id: string
  sourceDocument: 'cv' | 'jd'
  section: string | null
  quote: string | null
  page: number | null
  startOffset: number | null
  endOffset: number | null
}

export interface RequirementMatchV2 {
  id: string
  category: string
  priority: RequirementPriority
  status: RequirementStatus
  jdEvidenceIds: string[]
  cvEvidenceIds: string[]
  rationale: string | null
  confidence: number | null
}

export interface CVAnalysisReportV2 {
  schemaVersion: typeof REPORT_V2_SCHEMA_VERSION
  reportId: string
  jobId: string
  inputSnapshot: InputSnapshotV2
  requirements: RequirementMatchV2[]
  evidence: ReportEvidenceV2[]
  cvProfile: {
    skills: string[]
    employmentEvidenceIds: string[]
    projectEvidenceIds: string[]
    educationEvidenceIds: string[]
    uncertainties: string[]
  }
  scores: {
    overall: number | null
    ats: number | null
    keyword: number | null
    experience: number | null
    presentation: number | null
  }
  atsAssessment: {
    status: 'complete' | 'partial' | 'unavailable'
    contentScore: number | null
    layoutScore: number | null
    limitations: string[]
  }
  sectionSuggestions: Array<{
    sectionId: string
    originalEvidenceIds: string[]
    proposedRewrite: string | null
    rationale: string | null
    requirementIds: string[]
    needsUserConfirmation: boolean
  }>
  quality: { status: 'complete' | 'partial' | 'failed'; limitations: string[]; warnings: string[] }
  versions: {
    contractVersion: string
    parserVersion: string | null
    rubricVersion: string | null
    promptVersion: string | null
  }
  usage: { available: boolean; inputTokens: number | null; outputTokens: number | null; totalTokens: number | null } | null
}

export type CompatibleAnalysisReport = CVAnalysisResult | CVAnalysisReportV2

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCanonicalMonths(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0)
}

/** Runtime adapter for API responses during the V1-to-V2 migration. */
export function parseCompatibleAnalysisReport(value: unknown): CompatibleAnalysisReport {
  if (!isObject(value)) throw new Error('Analysis report must be an object')

  if ('schemaVersion' in value) {
    if (value.schemaVersion !== REPORT_V2_SCHEMA_VERSION) {
      throw new Error(`Unsupported analysis schemaVersion: ${String(value.schemaVersion)}`)
    }
    const inputSnapshot = value.inputSnapshot
    if (!isObject(inputSnapshot) || !isObject(inputSnapshot.config)) {
      throw new Error('V2 analysis report requires inputSnapshot.config')
    }
    if (!isCanonicalMonths(inputSnapshot.config.minExperienceMonths)) {
      throw new Error('V2 minExperienceMonths must be a non-negative integer or null')
    }
    if (typeof value.reportId !== 'string' || typeof value.jobId !== 'string') {
      throw new Error('V2 analysis report requires reportId and jobId')
    }
    return value as unknown as CVAnalysisReportV2
  }

  if (!isObject(value.scores)) {
    throw new Error('Legacy V1 analysis report requires scores')
  }
  return value as unknown as CVAnalysisResult
}

export function isAnalysisReportV2(
  report: CompatibleAnalysisReport,
): report is CVAnalysisReportV2 {
  return 'schemaVersion' in report && report.schemaVersion === REPORT_V2_SCHEMA_VERSION
}
