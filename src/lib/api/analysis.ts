import { apiRequest } from './client';
import type { CVAnalysisResult, ScanConfig, DocumentInput } from '../../types';

export interface AnalysisListItem {
  id: string | null;
  userId: string;
  scanId: string;
  title: string;
  role: string;
  company: string;
  overallScore: number | null;
  analyzedAt: string | null;
  cvInput: DocumentInput;
  jdInput: DocumentInput;
  config: ScanConfig;
}

export interface AnalysisDetailResponse extends AnalysisListItem {
  result: CVAnalysisResult;
}

export async function listAnalyses(): Promise<{ items: AnalysisListItem[] }> {
  return apiRequest<{ items: AnalysisListItem[] }>('/analysis');
}

export async function getAnalysis(id: string): Promise<AnalysisDetailResponse> {
  return apiRequest<AnalysisDetailResponse>(`/analysis/${id}`);
}
