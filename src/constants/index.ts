export const INDUSTRIES = [
  'Công nghệ thông tin',
  'Tài chính - Ngân hàng',
  'Marketing & Truyền thông',
  'Kế toán - Kiểm toán',
  'Bán hàng',
  'Nhân sự - HR',
  'Thiết kế',
  'Y tế - Dược phẩm',
  'Giáo dục',
  'Logistics - Vận tải',
  'Luật',
  'Bất động sản',
] as const

export const ROLES_BY_INDUSTRY: Record<string, string[]> = {
  'Công nghệ thông tin': [
    'Frontend Developer', 'Backend Developer', 'Fullstack Developer',
    'Mobile Developer', 'DevOps Engineer', 'Data Engineer',
    'Data Analyst', 'QA/Tester', 'Product Manager', 'UX/UI Designer', 'Business Analyst',
  ],
  'Tài chính - Ngân hàng': [
    'Chuyên viên phân tích tài chính', 'Tư vấn đầu tư',
    'Kiểm toán viên', 'Chuyên viên rủi ro', 'Relationship Manager',
  ],
  'Marketing & Truyền thông': [
    'Digital Marketing', 'Content Marketing', 'SEO Specialist',
    'Social Media Manager', 'Brand Manager', 'Performance Marketing',
  ],
  'Kế toán - Kiểm toán': [
    'Kế toán tổng hợp', 'Kế toán thuế', 'Kiểm toán nội bộ', 'Kế toán trưởng',
  ],
  'Nhân sự - HR': [
    'HR Generalist', 'Tuyển dụng (Recruiter)', 'C&B Specialist', 'L&D Specialist', 'HRBP',
  ],
  'Thiết kế': [
    'UX/UI Designer', 'Graphic Designer', 'Motion Designer', 'Product Designer',
  ],
  'Bán hàng': [
    'Sales Executive', 'Key Account Manager', 'Sales Manager', 'Business Development',
  ],
}

export const EXPERIENCE_LEVELS = [
  { value: 'intern', label: 'Chưa có kinh nghiệm (Intern/Fresher)' },
  { value: 'under1', label: 'Dưới 1 năm' },
  { value: '1-3', label: '1-3 năm' },
  { value: '3-5', label: '3-5 năm' },
  { value: '5+', label: 'Trên 5 năm' },
]

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  CV_SCAN: '/cv-scan',
  ANALYSIS: '/analysis',
  ANALYSIS_DETAIL: (id: string) => `/analysis/${id}`,
  MOCK_INTERVIEW: '/mock-interview',
  PRICING: '/pricing',
  PROFILE: '/profile',
} as const

export const VIP_INTERVIEW_TOTAL = 5

export const PLAN_LIMITS = {
  free: { scansPerMonth: 3, hasCompanyMatch: false, hasCourses: false, hasInterview: false },
  premium: { scansPerMonth: 15, hasCompanyMatch: true, hasCourses: true, hasInterview: false },
  vip: { scansPerMonth: 15, hasCompanyMatch: true, hasCourses: true, hasInterview: true },
} as const

export const METRIC_TOOLTIPS: Record<string, string> = {
  overall: 'Coverage Score tổng hợp: keyword (30%) + kinh nghiệm (30%) + ATS (25%) + trình bày (15%).',
  ats: 'Điểm ATS tổng hợp: keyword hard skills (38%) + kinh nghiệm/recency (32%) + format parse (22%) + cấu trúc CV (8%). ATS ưu tiên required terms & YOE trước soft skill.',
  keyword: 'Mức CV chứa các từ khóa quan trọng so với JD và ngành nghề mục tiêu.',
  experience: 'Mức kinh nghiệm mô tả trong CV phù hợp với yêu cầu vị trí.',
  presentation: 'Chất lượng trình bày CV: cấu trúc, format và mức độ chuyên nghiệp.',
}

export const NOTIFICATION_SETTING_LABELS: Record<string, string> = {
  monthlyScan: 'Nhắc nhở scan CV hàng tháng',
  featureUpdates: 'Cập nhật tính năng mới',
  careerNews: 'Tin tức nghề nghiệp',
}

export const MOCK_QUESTIONS: Record<string, string[]> = {
  default: [
    'Hãy giới thiệu bản thân bạn và lý do bạn ứng tuyển vào vị trí này?',
    'Điểm mạnh lớn nhất của bạn là gì? Cho ví dụ cụ thể.',
    'Kể về một tình huống khó khăn bạn đã xử lý. Bạn giải quyết như thế nào?',
    'Bạn thấy bản thân ở đâu sau 3-5 năm nữa?',
    'Tại sao chúng tôi nên chọn bạn cho vị trí này?',
  ],
  'Frontend Developer': [
    'Hãy giới thiệu bản thân và lý do bạn muốn trở thành Frontend Developer?',
    'Bạn có thể giải thích sự khác biệt giữa React State và Props không?',
    'Kể về dự án frontend phức tạp nhất bạn đã làm. Thách thức và cách giải quyết?',
    'Bạn xử lý performance optimization trong React như thế nào?',
    'Nếu được nhận vào, kế hoạch 3 tháng đầu của bạn là gì?',
  ],
  'Backend Developer': [
    'Giới thiệu về kinh nghiệm backend của bạn và stack bạn thành thạo?',
    'Bạn thiết kế REST API như thế nào để đảm bảo scalability?',
    'Kể về cách bạn xử lý database optimization trong một project thực tế?',
    'Bạn đảm bảo security cho API của mình như thế nào?',
    'Nếu hệ thống bị down lúc 3 giờ sáng, quy trình xử lý của bạn là gì?',
  ],
}
