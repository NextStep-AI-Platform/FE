import type { JdSuggestion } from '../lib/api/jdSuggestions'

const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString()

export const MOCK_JD_SUGGESTIONS: JdSuggestion[] = [
  {
    postingId: 'mock-jd-1', title: 'Backend Developer (Python/FastAPI)', company: 'Công ty Demo Tech',
    location: 'Hồ Chí Minh', level: 'Junior', skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'REST API'],
    source: 'demo', sourceUrl: 'https://example.com/jobs/1', attribution: 'Dữ liệu mẫu',
    matchPercent: 82, why: ['Chức danh gần với hồ sơ: backend, developer', 'Chung 3 kỹ năng: docker, fastapi, python'],
    excerpt: 'Phát triển và bảo trì REST API bằng Python/FastAPI, làm việc với PostgreSQL và Docker trong môi trường Agile.',
    postedAt: inDays(-3), expiresAt: inDays(20),
  },
  {
    postingId: 'mock-jd-2', title: 'Software Engineer - Data Platform', company: 'Demo Fintech',
    location: 'Hà Nội', level: 'Middle', skills: ['Python', 'SQL', 'Airflow', 'AWS'],
    source: 'demo', sourceUrl: 'https://example.com/jobs/2', attribution: 'Dữ liệu mẫu',
    matchPercent: 64, why: ['Chung 2 kỹ năng: python, sql'],
    excerpt: 'Xây dựng pipeline dữ liệu, tối ưu truy vấn SQL và vận hành hệ thống trên AWS.',
    postedAt: inDays(-6), expiresAt: inDays(14),
  },
  {
    postingId: 'mock-jd-3', title: 'Fullstack Developer (React/Node.js)', company: 'Demo Commerce',
    location: 'Đà Nẵng', level: null, skills: ['React', 'Node.js', 'TypeScript', 'Docker'],
    source: 'demo', sourceUrl: 'https://example.com/jobs/3', attribution: 'Dữ liệu mẫu',
    matchPercent: 41, why: ['Chung 1 kỹ năng: docker'],
    excerpt: 'Phát triển tính năng end-to-end cho nền tảng thương mại điện tử.',
    postedAt: null, expiresAt: inDays(30),
  },
]

export function mockJdText(item: JdSuggestion): string {
  return [
    `Vị trí: ${item.title}`,
    `Công ty: ${item.company}`,
    item.location ? `Địa điểm: ${item.location}` : '',
    item.level ? `Cấp bậc: ${item.level}` : '',
    `Kỹ năng: ${item.skills.join(', ')}`,
    '',
    'MÔ TẢ CÔNG VIỆC',
    item.excerpt,
    '',
    'YÊU CẦU',
    `- Có kinh nghiệm với ${item.skills.slice(0, 3).join(', ')}`,
    '- Kỹ năng làm việc nhóm và giao tiếp tốt',
  ].filter(line => line !== null).join('\n')
}
