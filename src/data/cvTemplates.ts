import type { CvStructured } from '../types/cvStructured'

export type CvSectionKey = 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'certifications' | 'awards'
export type CvTemplateId = 'ats-classic' | 'modern' | 'fresher' | 'it-pro'

export interface CvTemplateDef {
  id: CvTemplateId // must match ALLOWED_TEMPLATE_IDS in BE
  name: string
  description: string
  sectionOrder: CvSectionKey[]
  accent: string
  layout: 'single' | 'two-column'
}

export const CV_TEMPLATES: CvTemplateDef[] = [
  {
    id: 'ats-classic', name: 'ATS Classic', description: 'Một cột, tối giản, dễ qua hệ thống ATS',
    sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'awards'],
    accent: 'text-slate-900', layout: 'single',
  },
  {
    id: 'modern', name: 'Modern', description: 'Hai cột, nổi bật kỹ năng',
    sectionOrder: ['summary', 'experience', 'projects', 'education', 'certifications', 'awards', 'skills'],
    accent: 'text-blue-700', layout: 'two-column',
  },
  {
    id: 'fresher', name: 'Fresher / Sinh viên', description: 'Đưa học vấn và dự án lên trước',
    sectionOrder: ['summary', 'education', 'projects', 'skills', 'experience', 'awards', 'certifications'],
    accent: 'text-emerald-700', layout: 'single',
  },
  {
    id: 'it-pro', name: 'IT Professional', description: 'Kỹ năng kỹ thuật ở đầu, nhấn mạnh dự án',
    sectionOrder: ['summary', 'skills', 'experience', 'projects', 'certifications', 'education', 'awards'],
    accent: 'text-violet-700', layout: 'single',
  },
]

export const DEFAULT_TEMPLATE_ID: CvTemplateId = 'ats-classic'
export const getTemplate = (id?: string | null) => CV_TEMPLATES.find(t => t.id === id) ?? CV_TEMPLATES[0]

/** Sample data used only for gallery thumbnails. */
export const SAMPLE_CV: CvStructured = {
  personal: { fullName: 'Nguyễn Văn A', title: 'Backend Developer', email: 'a@email.com', phone: '0900 000 000', location: 'TP. Hồ Chí Minh', links: [] },
  summary: 'Lập trình viên backend 2 năm kinh nghiệm với Python và FastAPI.',
  experience: [{ company: 'Công ty ABC', role: 'Backend Developer', start: '01/2023', end: '', current: true, bullets: ['Xây dựng REST API cho hệ thống đặt hàng', 'Tối ưu truy vấn PostgreSQL'] }],
  projects: [{ name: 'NextStep', role: 'Backend', tech: ['FastAPI', 'Docker'], bullets: ['Thiết kế API phân tích CV'] }],
  education: [{ school: 'Đại học Bách Khoa', degree: 'Kỹ sư', major: 'CNTT', start: '2018', end: '2022', gpa: '3.2' }],
  skills: { technical: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'], soft: ['Làm việc nhóm'], languages: ['Tiếng Anh'] },
  certifications: [],
  awards: [],
}
