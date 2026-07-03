import type { CVAnalysisResult, DocumentInput, ScanConfig } from '../types'
import { generateCvJdMockResult, resolveCvJdPreset } from './cvJdPresets'

/** @deprecated Use generateCvJdMockResult — kept for imports */
export function generateMockResult(
  scanId: string,
  config: ScanConfig,
  cvInput: DocumentInput,
  jdInput: DocumentInput,
): CVAnalysisResult {
  return generateCvJdMockResult(scanId, config, cvInput, jdInput)
}

export { resolveCvJdPreset, generateCvJdMockResult }
