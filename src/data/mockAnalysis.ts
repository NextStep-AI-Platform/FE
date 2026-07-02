import type { CVAnalysisResult, DocumentInput, ScanConfig } from '../types'
import { formatExperienceRange } from '../lib/utils'

const DEFAULT_RESULT: Omit<CVAnalysisResult, 'id' | 'cvName' | 'analyzedRole' | 'analyzedIndustry' | 'experienceLevel' | 'analyzedAt'> = {
  scores: { overall: 72, ats: 68, keyword: 75, experience: 74, presentation: 70 },
  strengths: [
    'Có kinh nghiệm thực tế với React.js và TypeScript',
    'Dự án được mô tả rõ ràng với kết quả cụ thể',
    'Học vấn và chứng chỉ liên quan đến vị trí ứng tuyển',
  ],
  weaknesses: [
    'Thiếu từ khóa quan trọng so với JD',
    'Phần kỹ năng chưa được cấu trúc rõ cho ATS',
    'Mô tả kinh nghiệm cần thêm số liệu định lượng',
  ],
  atsIssues: [
    { issue: 'Không tìm thấy phần "Kỹ năng" riêng biệt', severity: 'high', fix: 'Tạo section Technical Skills riêng để ATS dễ đọc' },
    { issue: 'Sử dụng bảng/table trong CV', severity: 'medium', fix: 'Thay bảng bằng bullet points' },
    { issue: 'Thiếu từ khóa "React.js" xuất hiện đủ lần', severity: 'medium', fix: 'Đề cập React.js trong phần kinh nghiệm làm việc' },
    { issue: 'Font và định dạng ngày tháng phù hợp ATS', severity: 'low', fix: 'Giữ format hiện tại' },
  ],
  suggestedKeywords: ['React.js', 'Next.js', 'REST API', 'Unit Testing', 'CI/CD'],
  keywords: {
    matched: ['JavaScript', 'TypeScript', 'HTML/CSS', 'Git', 'Agile'],
    missing: ['React.js', 'Next.js', 'REST API', 'Unit Testing'],
  },
  improvements: [
    { priority: 'high', title: 'Thêm phần "Technical Skills"', description: 'Tạo section riêng liệt kê kỹ năng kỹ thuật để ATS dễ đọc hơn' },
    { priority: 'high', title: 'Bổ sung từ khóa "React.js"', description: 'Từ khóa này xuất hiện trong phần lớn JD Frontend Developer' },
    { priority: 'medium', title: 'Định lượng thành tích', description: 'Thay mô tả chung bằng số liệu cụ thể (%, thời gian, quy mô)' },
    { priority: 'low', title: 'Tóm tắt nghề nghiệp', description: 'Thêm 2-3 câu summary ở đầu CV' },
  ],
  experienceComment:
    'Kinh nghiệm của bạn tương đối phù hợp với JD: đã có nền tảng frontend và làm việc theo team. Tuy nhiên, cần làm nổi bật thêm dự án có impact đo lường được và bổ sung stack được nhắc trong JD để tăng Coverage Score.',
  companies: [
    { name: 'FPT Software', match: 88, logo: 'FS', industry: 'Công nghệ', size: '15.000+ nhân viên', requirements: ['React.js', 'TypeScript', '2+ years'] },
    { name: 'VNG Corporation', match: 82, logo: 'VN', industry: 'Công nghệ', size: '3.000+ nhân viên', requirements: ['ReactJS', 'JavaScript', 'REST API'] },
  ],
  courses: [
    {
      title: 'React - The Complete Guide 2024',
      platform: 'Udemy',
      skill: 'React.js',
      rating: 4.8,
      students: '700.000+',
      price: '299.000đ',
      url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
      reason: 'Bạn còn thiếu từ khóa và kinh nghiệm thực hành React.js trong CV so với JD',
    },
    {
      title: 'TypeScript: The Complete Developer Guide',
      platform: 'Udemy',
      skill: 'TypeScript',
      rating: 4.9,
      students: '120.000+',
      price: '249.000đ',
      url: 'https://www.udemy.com/course/typescript-the-complete-developers-guide/',
      reason: 'JD yêu cầu TypeScript nâng cao nhưng CV chưa thể hiện đủ depth',
    },
  ],
  isPremiumContent: true,
}

function getCvName(cv: DocumentInput): string {
  if (cv.mode === 'file' && cv.fileName) return cv.fileName
  return 'CV_da_dan_noi_dung.txt'
}

export function generateMockResult(
  scanId: string,
  config: ScanConfig,
  cvInput: DocumentInput,
  jdInput: DocumentInput,
): CVAnalysisResult {
  const role = config.role || 'Frontend Developer'
  const industry = config.industry || 'Công nghệ thông tin'
  const experienceLevel =
    config.experienceFrom !== undefined && config.experienceTo !== undefined
      ? formatExperienceRange(config.experienceFrom, config.experienceTo)
      : 'Chưa khai báo'

  const now = new Date()
  const analyzedAt = now.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return {
    id: scanId,
    cvName: getCvName(cvInput),
    analyzedRole: role,
    analyzedIndustry: industry,
    experienceLevel,
    analyzedAt,
    ...DEFAULT_RESULT,
  }
}
