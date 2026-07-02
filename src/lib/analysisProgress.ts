export const ANALYSIS_PROGRESS_STEPS = [
  'Trích xuất nội dung CV & JD',
  'Kiểm tra cấu trúc ATS',
  'Đối chiếu từ khóa nghề nghiệp',
  'Đánh giá kinh nghiệm & kỹ năng',
  'Tổng hợp Coverage Score',
] as const

export function getAnalysisStepStatus(
  index: number,
  progress: number,
  totalSteps: number,
): 'pending' | 'active' | 'done' {
  const slice = 100 / totalSteps
  const doneAt = (index + 1) * slice
  const startAt = index * slice
  if (progress >= doneAt) return 'done'
  if (progress >= startAt || (index === 0 && progress === 0)) return 'active'
  return 'pending'
}
