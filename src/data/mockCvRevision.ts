import { SAMPLE_CV } from './cvTemplates'
import type { CVAnalysisResult } from '../types'
import type { CvRevisionResponse, CvStructured } from '../types/cvStructured'

/** Demo improved-CV proposal for mock mode (USE_API=false). */
export function generateMockRevision(
  structured: CvStructured | undefined,
  result: CVAnalysisResult,
  templateId?: string,
): CvRevisionResponse {
  const original: CvStructured = structured ?? SAMPLE_CV
  const missing = result.keywords?.missing ?? []
  const firstMissing = missing[0] ?? 'Docker'
  const changes: CvRevisionResponse['changes'] = []

  changes.push({
    id: 'c1', path: 'summary', before: original.summary,
    after: `${original.summary || 'Ứng viên định hướng ' + (result.analyzedRole || 'công nghệ')}. Tập trung vào ${result.keywords?.matched?.slice(0, 3).join(', ') || 'các kỹ năng cốt lõi'} theo yêu cầu của vị trí.`.trim(),
    type: 'rephrase', addedKeywords: [], rationale: 'Làm rõ định hướng và đưa kỹ năng khớp JD lên phần tóm tắt.',
    needsUserConfirmation: false,
  })
  if (original.experience.length > 0) {
    const bullets = original.experience[0].bullets
    changes.push({
      id: 'c2', path: 'experience[0].bullets', before: bullets,
      after: bullets.length
        ? bullets.map((b, i) => (i === 0 ? `${b} (áp dụng ${result.keywords?.matched?.[0] ?? 'kỹ năng chuyên môn'})` : b))
        : ['[Bổ sung nếu có: mô tả công việc chính và kết quả đạt được]'],
      type: 'keyword', addedKeywords: [], rationale: 'Gắn kỹ năng JD yêu cầu vào kinh nghiệm thực tế.',
      needsUserConfirmation: bullets.length === 0,
    })
  }
  changes.push({
    id: 'c3', path: 'skills.technical', before: original.skills.technical,
    after: Array.from(new Set([...original.skills.technical, firstMissing])),
    type: 'keyword', addedKeywords: [firstMissing],
    rationale: `JD yêu cầu ${firstMissing} nhưng CV chưa có bằng chứng, chỉ thêm nếu bạn thật sự có kỹ năng này.`,
    needsUserConfirmation: true,
  })
  return {
    status: 'completed',
    templateId: templateId ?? 'ats-classic',
    originalStructured: original,
    changes,
    decisions: {},
    targetKeywords: missing.slice(0, 10),
    limitations: structured ? [] : ['Bản demo dùng CV mẫu vì CV tải lên chưa được tách thành dữ liệu có cấu trúc.'],
    errorMessage: null,
  }
}
