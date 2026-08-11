import type {
  CVAnalysisResult,
  DocumentInput,
  DocumentInputMode,
  ScanConfig,
  ScanRecord,
} from '../../types'
import { apiRequest } from './client'

interface RawDocumentInput {
  mode?: DocumentInputMode | null
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
  textContent?: string | null
  fileId?: string | null
}

interface RawScanConfig {
  company?: string | null
  industry?: string | null
  role?: string | null
  experienceFrom?: number | null
  experienceTo?: number | null
}

interface RawAnalysisListItem {
  id: string | null
  userId: string
  scanId: string
  title: string
  role: string
  company: string
  overallScore: number | null
  analyzedAt: string | null
  cvInput: RawDocumentInput
  jdInput: RawDocumentInput
  config: RawScanConfig
}

interface RawAnalysisDetailResponse extends RawAnalysisListItem {
  result: CVAnalysisResult
}

export interface AnalysisListItem {
  id: string
  userId: string
  scanId: string
  title: string
  role: string
  company: string
  overallScore: number
  analyzedAt: string
  cvInput: DocumentInput
  jdInput: DocumentInput
  config: ScanConfig
}

function normalizeDocumentInput(input: RawDocumentInput): DocumentInput {
  return {
    mode: input.mode === 'file' ? 'file' : 'text',
    ...(input.fileName != null ? { fileName: input.fileName } : {}),
    ...(input.fileSize != null ? { fileSize: input.fileSize } : {}),
    ...(input.mimeType != null ? { mimeType: input.mimeType } : {}),
    ...(input.textContent != null ? { textContent: input.textContent } : {}),
    ...(input.fileId != null ? { fileId: input.fileId } : {}),
  }
}

function normalizeConfig(config: RawScanConfig): ScanConfig {
  return {
    company: config.company ?? '',
    ...(config.industry != null ? { industry: config.industry } : {}),
    ...(config.role != null ? { role: config.role } : {}),
    ...(config.experienceFrom != null
      ? { experienceFrom: config.experienceFrom }
      : {}),
    ...(config.experienceTo != null ? { experienceTo: config.experienceTo } : {}),
  }
}

function normalizeListItem(
  item: RawAnalysisListItem,
  result?: CVAnalysisResult,
): AnalysisListItem {
  return {
    id: item.id ?? item.scanId,
    userId: item.userId,
    scanId: item.scanId,
    title: item.title,
    role: item.role,
    company: item.company,
    overallScore: item.overallScore ?? result?.scores.overall ?? 0,
    analyzedAt: item.analyzedAt ?? result?.analyzedAt ?? '',
    cvInput: normalizeDocumentInput(item.cvInput),
    jdInput: normalizeDocumentInput(item.jdInput),
    config: normalizeConfig(item.config),
  }
}

export async function listAnalyses(): Promise<{ items: AnalysisListItem[] }> {
  const response = await apiRequest<{ items: RawAnalysisListItem[] }>('/analysis')
  return { items: response.items.map(item => normalizeListItem(item)) }
}

export async function getAnalysis(id: string): Promise<ScanRecord> {
  const response = await apiRequest<RawAnalysisDetailResponse>(`/analysis/${id}`)
  const item = normalizeListItem(response, response.result)
  return {
    id: item.id,
    userId: item.userId,
    title: item.title,
    role: item.role,
    company: item.company,
    overallScore: item.overallScore,
    analyzedAt: item.analyzedAt,
    cvInput: item.cvInput,
    jdInput: item.jdInput,
    config: item.config,
    result: response.result,
  }
}
