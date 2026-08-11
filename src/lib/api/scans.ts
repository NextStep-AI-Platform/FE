import { apiRequest } from './client';
import type { ScanConfig, DocumentInput } from '../../types';

export interface ScanStatus {
  id: string;
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed';
  progressPercent: number;
  currentStep: number;
  steps: { label: string; status: string }[];
  analysisId?: string;
  errorMessage?: string;
}

export async function createScan(payload: {
  cv: DocumentInput;
  jd: DocumentInput;
  config: ScanConfig;
}): Promise<{ id: string; status: string }> {
  if (payload.cv.mode !== 'text' || !payload.cv.textContent?.trim()) {
    throw new Error('Phase 1b only supports CV text input');
  }
  if (payload.jd.mode !== 'text' || !payload.jd.textContent?.trim()) {
    throw new Error('Phase 1b only supports job description text input');
  }

  const formData = new FormData();
  formData.append('cv_text', payload.cv.textContent.trim());
  formData.append('jd_text', payload.jd.textContent.trim());
  formData.append('config_company', payload.config.company || '');
  formData.append('config_role', payload.config.role || '');
  formData.append('config_industry', payload.config.industry || '');
  if (payload.config.jdMinExperience !== undefined) {
    formData.append('config_experience_from', String(payload.config.jdMinExperience));
  }

  return apiRequest<{ id: string; status: string }>('/scans', {
    method: 'POST',
    body: formData,
  });
}

export async function runScan(id: string): Promise<{ id: string; status: string }> {
  return apiRequest<{ id: string; status: string }>(`/scans/${id}/run`, {
    method: 'POST',
  });
}

export async function getScanStatus(
  id: string,
  signal?: AbortSignal,
): Promise<ScanStatus> {
  return apiRequest<ScanStatus>(`/scans/${id}`, { signal });
}

function waitForNextPoll(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Scan polling cancelled', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

export async function pollScanUntilDone(
  id: string,
  onProgress: (data: ScanStatus) => void,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {},
): Promise<string> {
  const intervalMs = options.intervalMs ?? 2500;
  const timeoutMs = options.timeoutMs ?? 180_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (options.signal?.aborted) {
      throw new DOMException('Scan polling cancelled', 'AbortError');
    }

    const data = await getScanStatus(id, options.signal);
    onProgress(data);
    if (data.status === 'completed' && data.analysisId) {
      return data.analysisId;
    }
    if (data.status === 'failed') {
      throw new Error(data.errorMessage || 'Scan failed');
    }
    await waitForNextPoll(intervalMs, options.signal);
  }

  throw new Error('CV analysis timed out after 180 seconds');
}
