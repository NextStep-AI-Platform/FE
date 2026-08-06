import { apiRequest } from './client';
import type { ScanConfig, DocumentInput } from '../../types';

export async function createScan(payload: {
  cv: DocumentInput;
  jd: DocumentInput;
  config: ScanConfig;
}): Promise<{ id: string; status: string }> {
  const formData = new FormData();

  if (payload.cv.mode === 'text' && payload.cv.textContent) {
    formData.append('cv_text', payload.cv.textContent);
  } else if (payload.cv.mode === 'file') {
    // Nếu có cv_file kiểu File, FE cần đẩy vào bằng cách nào đó.
    // Ở đây ta tạm chỉ hỗ trợ text nếu không có đối tượng File thực tế.
    // Nếu app có đối tượng File, ta sẽ phải sửa UI truyền File object vào DocumentInput.
  }

  if (payload.jd.mode === 'text' && payload.jd.textContent) {
    formData.append('jd_text', payload.jd.textContent);
  }

  formData.append('config_company', payload.config.company || '');
  formData.append('config_role', payload.config.role || '');
  formData.append('config_industry', payload.config.industry || '');
  if (payload.config.jdMinExperience !== undefined) {
    formData.append('config_experience_from', String(payload.config.jdMinExperience));
  }

  return apiRequest<{ id: string; status: string }>('/scans', {
    method: 'POST',
    body: formData, // Trình duyệt sẽ tự set Content-Type thành multipart/form-data
  });
}

export async function runScan(id: string): Promise<{ id: string; status: string }> {
  return apiRequest<{ id: string; status: string }>(`/scans/${id}/run`, {
    method: 'POST',
  });
}

export async function getScanStatus(id: string): Promise<{
  id: string;
  status: string;
  progressPercent: number;
  currentStep: number;
  steps: { label: string; status: string }[];
  analysisId?: string;
  errorMessage?: string;
}> {
  return apiRequest(`/scans/${id}`);
}

export function pollScanUntilDone(
  id: string,
  onProgress: (data: Awaited<ReturnType<typeof getScanStatus>>) => void,
  intervalMs = 1000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const data = await getScanStatus(id);
        onProgress(data);
        if (data.status === 'completed' && data.analysisId) {
          resolve(data.analysisId);
        } else if (data.status === 'failed') {
          reject(new Error(data.errorMessage || 'Scan failed'));
        } else {
          setTimeout(tick, intervalMs);
        }
      } catch (e) {
        reject(e);
      }
    };
    tick();
  });
}
