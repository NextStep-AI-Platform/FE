import type {
  ATSIssue,
  CompanyMatch,
  ComputedExperience,
  CourseRecommendation,
  CVAnalysisResult,
  CVScore,
  DocumentInput,
  ImprovementItem,
  KeywordAnalysis,
  ScanConfig,
} from '../types'
import { computeCvPresetExperience, enrichExperienceForJd } from './cvExperienceProfiles'
import {
  buildJdMinComparisonNote,
  formatMinExperienceLabel,
} from '../lib/cvExperience'
import { computeAtsScore } from '../lib/atsScoring'
import { computeCoverageScore } from '../lib/coverageScoring'
import {
  detectCvPreset,
  detectJdPreset,
  pairKey,
  type CvJdPairKey,
  type CvPresetId,
  type JdPresetId,
} from '../lib/cvJdMatch'

/** Chỉ lưu 3 điểm nền — ATS & overall tính tự động */
type PairScoreInputs = Pick<CVScore, 'keyword' | 'experience' | 'presentation'>

type PairPresetBody = {
  scores: PairScoreInputs
  strengths: string[]
  weaknesses: string[]
  atsIssues: ATSIssue[]
  suggestedKeywords: string[]
  keywords: KeywordAnalysis
  improvements: ImprovementItem[]
  experienceComment: string
  companies: CompanyMatch[]
  courses: CourseRecommendation[]
}

function getCvName(cv: DocumentInput): string {
  if (cv.mode === 'file' && cv.fileName) return cv.fileName
  return 'CV_da_dan_noi_dung.txt'
}

function roleLabel(config: ScanConfig): string {
  return config.role || 'Vị trí ứng tuyển'
}

function industryLabel(config: ScanConfig): string {
  return config.industry || 'Chưa khai báo ngành'
}

function buildResult(
  scanId: string,
  config: ScanConfig,
  cvInput: DocumentInput,
  jdInput: DocumentInput,
  body: PairPresetBody,
  computedExperience?: ComputedExperience,
  jdId?: JdPresetId | null,
): CVAnalysisResult {
  const now = new Date()
  const jdMinExperienceLabel =
    config.jdMinExperience !== undefined && config.jdMinExperienceUnit
      ? formatMinExperienceLabel(config.jdMinExperience, config.jdMinExperienceUnit)
      : undefined

  let experienceComment = body.experienceComment
  if (config.jdMinExperience !== undefined && config.jdMinExperienceUnit) {
    const preferRelevant = jdId === 'big_data_de' || jdId === 'belending_ba'
    experienceComment += ` ${buildJdMinComparisonNote(
      computedExperience,
      config.jdMinExperience,
      config.jdMinExperienceUnit,
      {
        preferRelevant,
        domainHint: computedExperience?.relevantNote
          ? jdId === 'big_data_de' ? 'Big Data/Cloud DE' : 'analytics/BA'
          : undefined,
      },
    )}`
  }

  const atsBreakdown = computeAtsScore(
    {
      keyword: body.scores.keyword,
      experience: body.scores.experience,
      presentation: body.scores.presentation,
    },
    body.atsIssues,
    { config, computedExperience, jdId },
  )

  const coverageBreakdown = computeCoverageScore(
    {
      keyword: body.scores.keyword,
      experience: body.scores.experience,
      presentation: body.scores.presentation,
      ats: atsBreakdown.finalScore,
    },
    { config, computedExperience, jdId },
  )

  return {
    id: scanId,
    cvName: getCvName(cvInput),
    analyzedRole: roleLabel(config),
    analyzedIndustry: industryLabel(config),
    experienceLevel: computedExperience?.label ?? 'Chưa xác định',
    computedExperience,
    jdMinExperienceLabel,
    analyzedAt: now.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    ...body,
    scores: {
      keyword: body.scores.keyword,
      experience: body.scores.experience,
      presentation: body.scores.presentation,
      ats: atsBreakdown.finalScore,
      overall: coverageBreakdown.finalScore,
    },
    atsBreakdown,
    coverageBreakdown,
    experienceComment,
    isPremiumContent: body.companies.length > 0 || body.courses.length > 0,
  }
}

/** Ma trận preset — 2 happy · 2 partial · 2 reject nổi bật + các ô còn lại */
const PAIR_PRESETS: Record<CvJdPairKey, PairPresetBody> = {
  /* ── HAPPY 1: Huynh × Whitestar ── */
  'gia_khanh:whitestar_livestream': {
    scores: { keyword: 94, experience: 93, presentation: 87 },
    strengths: [
      'Kinh nghiệm trực tiếp vận hành livestream tại Whitestar Beauty — trùng employer JD',
      'Thành thạo OBS Studio, setup thiết bị trước/sau live, theo dõi KPI phiên',
      'Đã làm trợ live, viết kịch bản và quản lý host tại Likapz',
      'Freelance livestream operation — linh hoạt ca và xử lý sự cố khi lên sóng',
    ],
    weaknesses: [
      'CV chưa liệt kê rõ Seller Center / TikTok Shop (nên bổ sung nếu đã dùng)',
      'Phần học vấn chỉ THPT — có thể thêm chứng chỉ ngắn về livestream/e-commerce',
    ],
    atsIssues: [
      { issue: 'Thiếu section “Kỹ năng” tách biệt với mục tiêu nghề nghiệp', severity: 'low', fix: 'Gom OBS, KPI tracking, setup thiết bị vào block Skills' },
      { issue: 'Timeline làm việc rõ — hệ thống tính tổng 9 tháng livestream', severity: 'low', fix: 'Whitestar 6 tháng + Likapz 3 tháng; có thể ghi tổng ở đầu CV để ATS scan nhanh hơn' },
    ],
    suggestedKeywords: ['OBS Studio', 'Livestream', 'Seller Center', 'KPI phiên live', 'Setup thiết bị'],
    keywords: {
      matched: ['OBS Studio', 'Livestream', 'Setup', 'Trợ live', 'KPI', 'Kịch bản live', 'Whitestar Beauty'],
      missing: ['Seller Center', 'Tiếng Trung'],
    },
    improvements: [
      { priority: 'low', title: 'Ghi rõ Seller Center / nền tảng', description: 'JD nhắc Seller Center — liệt kê nếu bạn đã thao tác trên TikTok Shop / Shopee Live.' },
      { priority: 'low', title: 'Tiếng Trung (điểm cộng)', description: 'JD ưu tiên biết tiếng Trung — thêm level nếu có.' },
    ],
    experienceComment:
      'Hồ sơ rất sát JD Whitestar: OBS, vận hành live, KPI và **đã làm tại chính công ty tuyển dụng**. Tổng kinh nghiệm (tự tính): **9 tháng** — Whitestar Beauty 6 tháng (07/2025–01/2026) + Likapz 3 tháng (02/2026–05/2026).',
    companies: [
      { name: 'Whitestar Beauty', match: 95, logo: 'WB', industry: 'Mỹ phẩm / Livestream', size: 'SME', requirements: ['OBS', 'Livestream', 'KPI'] },
      { name: 'Hasaki', match: 84, logo: 'HK', industry: 'Retail / Live commerce', size: '1000+', requirements: ['Livestream', 'E-commerce'] },
    ],
    courses: [
      {
        title: 'TikTok Shop & Livestream Operations',
        platform: 'Udemy',
        skill: 'Live commerce',
        rating: 4.6,
        students: '12.000+',
        price: '399.000đ',
        url: 'https://www.udemy.com/courses/search/?q=tiktok+shop+livestream',
        reason: 'Bổ sung Seller Center / live commerce nền tảng nếu chưa ghi trong CV',
      },
    ],
  },

  /* ── PARTIAL: Đăng × Big Data DE (~61 — stack có trên CV, thiếu YOE production & KN DE thực chiến) ── */
  'hai_dang:big_data_de': {
    scores: { keyword: 70, experience: 46, presentation: 74 },
    strengths: [
      'CV liệt kê PySpark, Databricks, Delta Lake — keyword khớp JD trên giấy tờ',
      'Project Lease Control Tower & SCGC HR Agent có pipeline thật (SQL, ETL, FastAPI)',
      'Sinh viên cuối khóa CNTT — nền tảng kỹ thuật tốt để grow vào DE junior',
    ],
    weaknesses: [
      'JD Big Data Cloud Engineer thường yêu cầu 2–3+ năm production — ứng viên mới ~10 tháng KN liên quan DE/cloud',
      'Tổng timeline project 16 tháng nhưng gồm AI Business Summary & Auto-Evaluator — không phải data lake/cloud enterprise',
      'Thiếu kinh nghiệm vận hành cluster lớn, Terraform/Kafka, on-call production',
      'Đang là sinh viên — chưa có full-time DE role tại doanh nghiệp',
    ],
    atsIssues: [
      { issue: 'Job title & project mix — Data/AI student, chưa phải Cloud Data Engineer 2+ năm', severity: 'high', fix: 'Target internship/junior DE; ghi rõ phần PySpark/Databricks trong 2 project cuối' },
      { issue: 'KN liên quan DE/cloud (tự tính): ~10 tháng — dưới ngưỡng JD senior', severity: 'high', fix: 'Thêm 1–2 năm production hoặc apply junior/fresher DE' },
      { issue: 'Thiếu Terraform, Kafka trong CV', severity: 'medium', fix: 'Bổ sung nếu JD bắt buộc streaming/IaC' },
    ],
    suggestedKeywords: ['PySpark', 'Databricks', 'AWS', 'ETL', 'Data Lake', 'Production pipeline'],
    keywords: {
      matched: ['Python', 'SQL', 'PySpark', 'Databricks', 'ETL', 'PostgreSQL', 'FastAPI', 'Delta Lake'],
      missing: ['Terraform', 'Kafka', '2+ years production', 'Enterprise cloud ops', 'On-call'],
    },
    improvements: [
      { priority: 'high', title: 'Apply đúng level', description: 'JD này hướng mid DE — nên ưu tiên internship/junior data engineer hoặc tích lũy thêm 12–18 tháng production.' },
      { priority: 'high', title: 'Tách KN DE khỏi project AI generative', description: 'Highlight Lease Control Tower + SCGC (PySpark, lakehouse) — giảm weight AI summary/evaluator khi apply DE.' },
      { priority: 'medium', title: 'Chứng chỉ AWS/Databricks', description: 'Formalize cloud credential nếu muốn cạnh tranh JD enterprise.' },
    ],
    experienceComment:
      'Keyword và project kỹ thuật khá tốt nhưng **chưa đủ** cho JD Big Data Cloud Engineer mid-level: tổng làm việc/project **16 tháng** (union timeline), trong đó KN **liên quan DE/cloud** chỉ **~10 tháng** (SCGC + Lease Control Tower). 2 năm làm việc chung ≠ 2 năm vận hành data lake production — phù hợp intern/junior DE hơn.',
    companies: [],
    courses: [
      {
        title: 'AWS Certified Data Engineer – Associate',
        platform: 'Coursera',
        skill: 'AWS Data',
        rating: 4.7,
        students: '80.000+',
        price: 'Miễn phí audit',
        url: 'https://www.coursera.org/courses?query=aws%20data%20engineer',
        reason: 'Bù gap credential & cloud production cho JD enterprise',
      },
    ],
  },

  /* ── HAPPY 2: Khánh My × BD Specialist ── */
  'khanh_my:bd_specialist': {
    scores: { keyword: 78, experience: 70, presentation: 84 },
    strengths: [
      'Định hướng Business Development / Sales rõ trong CV và mục tiêu nghề nghiệp',
      'Kinh nghiệm customer service, sales simulation, fundraising volunteer',
      'Kỹ năng CRM, communication, market research, lead qualification',
      'Tiếng Anh + tiếng Trung (HSK 3) — hỗ trợ làm việc quốc tế',
    ],
    weaknesses: [
      'JD yêu cầu hunter sales B2B ngành F&B flavour — CV chưa có connection industry cụ thể',
      'Chưa có track record doanh số / pipeline B2B manufacturing',
      'Sinh viên năm 3 — thiếu years of experience so với sales specialist senior',
    ],
    atsIssues: [
      { issue: 'Thiếu số liệu doanh số / conversion', severity: 'high', fix: 'Thêm % đạt target, số lead qualified từ simulation/volunteer' },
      { issue: 'Chưa có từ khóa "Food & Beverage" / "B2B sales"', severity: 'medium', fix: 'Liên hệ project fundraising với FMCG nếu có' },
    ],
    suggestedKeywords: ['B2B Sales', 'Business Development', 'Pipeline', 'F&B', 'Account management'],
    keywords: {
      matched: ['Sales', 'Customer relationship', 'Communication', 'Market research', 'Lead qualification', 'English'],
      missing: ['Food & Beverage', 'Flavour industry', 'B2B manufacturing', 'Hunter sales', 'Revenue growth'],
    },
    improvements: [
      { priority: 'high', title: 'Quantify sales outcomes', description: 'Ghi rõ doanh thu volunteer / simulation: X triệu, Y khách hàng.' },
      { priority: 'medium', title: 'Network F&B', description: 'Tham gia event ngành thực phẩm, ghi vào CV nếu có contact.' },
      { priority: 'medium', title: 'Portfolio pitch', description: 'JD cần presentation — thêm 1 slide deck sample link.' },
    ],
    experienceComment:
      'Phù hợp hướng BD junior: soft skills và sales foundation tốt. Tổng kinh nghiệm (tự tính): **6 tháng** — Prime Real Estate 3 tháng + Henmet Charity 3 tháng. Thiếu track record B2B F&B nhưng **đủ tiêu chí happy** cho intern/junior BD.',
    companies: [
      { name: 'Essential Flavours (VN)', match: 78, logo: 'EF', industry: 'F&B / Flavour', size: 'SME', requirements: ['Sales', 'F&B network'] },
      { name: 'Masan Consumer', match: 72, logo: 'MC', industry: 'FMCG', size: '5000+', requirements: ['BD', 'Distribution'] },
    ],
    courses: [
      {
        title: 'B2B Sales Masterclass',
        platform: 'Udemy',
        skill: 'B2B Sales',
        rating: 4.5,
        students: '45.000+',
        price: '299.000đ',
        url: 'https://www.udemy.com/courses/search/?q=b2b+sales',
        reason: 'JD hunter B2B — củng cố pipeline & negotiation',
      },
    ],
  },

  /* ── PARTIAL: Đăng × BeLending BA (điều chỉnh ~63 — kỹ thuật có, domain BA/fintech thiếu) ── */
  'hai_dang:belending_ba': {
    scores: { keyword: 68, experience: 54, presentation: 76 },
    strengths: [
      'Python, SQL, R — công cụ phân tích JD yêu cầu',
      'Kinh nghiệm báo cáo, data quality, pipeline metrics (Lease Control Tower)',
      'Tư duy structured problem-solving qua multi-agent workflows',
    ],
    weaknesses: [
      'JD BA Lending cần 3+ năm fintech/banking — ứng viên là sinh viên, chưa có tenure BA',
      'Thiếu domain: lending funnel, disbursement, approval rate, credit score, portfolio',
      'CV orient Data Engineering / AI, không phải business stakeholder management',
      'Không có kinh nghiệm reconciliation với đối tác cho vay / campaign lending',
    ],
    atsIssues: [
      { issue: 'CV không chứa từ khóa lending/fintech', severity: 'high', fix: 'Nếu có coursework finance — thêm section Projects liên quan credit/risk' },
      { issue: 'Job title “Data Engineer” lệch “Business Analyst”', severity: 'medium', fix: 'Thêm headline phụ: Analytics & BI orientation' },
      { issue: 'Thiếu Excel/BI dashboard examples cho business users', severity: 'medium', fix: 'Mô tả dashboard Streamlit/BI cho stakeholder' },
    ],
    suggestedKeywords: ['Lending funnel', 'Fintech', 'Credit score', 'Excel', 'BI dashboard', 'Stakeholder'],
    keywords: {
      matched: ['Python', 'SQL', 'Data analysis', 'Excel', 'Problem-solving'],
      missing: ['Consumer lending', 'Fintech', 'Disbursement', 'Approval rate', 'Portfolio metrics', 'Business Analyst', '3+ years'],
    },
    improvements: [
      { priority: 'high', title: 'Bridge sang BA narrative', description: 'Reframe 1–2 project theo góc business insight, không chỉ engineering.' },
      { priority: 'high', title: 'Học lending basics', description: 'Hoàn thành khóa intro fintech/lending metrics trước khi apply Be.' },
      { priority: 'medium', title: 'Case study funnel', description: 'Làm mini case: application→approval→disbursement với dataset public.' },
    ],
    experienceComment:
      'Overlap kỹ thuật (SQL/Python) nhưng **chưa đủ** cho BA Lending senior: tổng project **16 tháng**, KN analytics liên quan **~8 tháng** (SCGC) — thiếu domain cho vay tiêu dùng và tenure BA 3+ năm. Phù hợp **internship analytics** hơn full BA Lending.',
    companies: [
      { name: 'Be Group (Analytics Intern track)', match: 64, logo: 'BE', industry: 'Fintech / Mobility', size: '1000+', requirements: ['SQL', 'Python', 'Analytics'] },
    ],
    courses: [
      {
        title: 'Introduction to Consumer Lending & Credit Risk',
        platform: 'Coursera',
        skill: 'Fintech',
        rating: 4.4,
        students: '30.000+',
        price: 'Miễn phí audit',
        url: 'https://www.coursera.org/courses?query=consumer%20lending',
        reason: 'Bù gap domain lending trước khi ứng tuyển BA vertical',
      },
      {
        title: 'Business Analysis & Process Management',
        platform: 'Udemy',
        skill: 'Business Analysis',
        rating: 4.6,
        students: '200.000+',
        price: '349.000đ',
        url: 'https://www.udemy.com/courses/search/?q=business+analysis',
        reason: 'Chuyển narrative từ Data Engineer sang BA',
      },
    ],
  },

  /* ── REJECT 1: Huynh × Cybersecurity ── */
  'gia_khanh:cybersecurity': {
    scores: { keyword: 16, experience: 18, presentation: 50 },
    strengths: [
      'Kỹ năng làm việc nhóm và xử lý tình huống phát sinh khi live',
    ],
    weaknesses: [
      'Không có nền tảng ANTT, pentest, OWASP, NIST',
      'Không có kinh nghiệm security assessment / source code review',
      'Không có chứng chỉ CEH, ECSA, SANS',
      'Hồ sơ hoàn toàn livestream operation — lệch ngành CNTT bảo mật',
    ],
    atsIssues: [
      { issue: 'Zero security tooling keywords (Burp, Nessus, Nmap…)', severity: 'high', fix: 'Không phù hợp apply — cần profile ATTT riêng' },
      { issue: 'Không có bằng CNTT/ATTT', severity: 'high', fix: 'JD yêu cầu chuyên ngành ATTT/CNTT' },
    ],
    suggestedKeywords: ['OWASP', 'Pentest', 'NIST', 'Burp Suite', 'CEH'],
    keywords: {
      matched: [],
      missing: ['OWASP', 'NIST', 'Pentest', 'Application security', 'Network security', 'CEH', 'Java/.NET security review'],
    },
    improvements: [
      { priority: 'high', title: 'Không nên ứng tuyển vị trí này', description: 'Chọn JD livestream/e-commerce operations phù hợp hơn.' },
    ],
    experienceComment:
      'CV **không có overlap** chuyên môn với JD an ninh mạng (0/8 keyword security). Coverage Score thấp phản ánh đúng thực tế — nên tập trung ngành livestream/e-commerce.',
    companies: [],
    courses: [],
  },

  /* ── REJECT 2: Khánh My × Big Data DE ── */
  'khanh_my:big_data_de': {
    scores: { keyword: 16, experience: 14, presentation: 56 },
    strengths: [
      'Kỹ năng mềm: communication, teamwork, market research',
      'Thành thạo Microsoft Office',
    ],
    weaknesses: [
      'Không có Python/SQL/PySpark/Data pipeline',
      'Không có project kỹ thuật hay cloud',
      'Hồ sơ International Business — không phải Data Engineering',
    ],
    atsIssues: [
      { issue: 'ATS không parse được technical stack bắt buộc', severity: 'high', fix: 'Cần CV IT — profile hiện tại không phù hợp' },
      { issue: 'Thiếu hoàn toàn từ khóa Big Data / Cloud', severity: 'high', fix: 'Không khớp JD Data Engineer' },
    ],
    suggestedKeywords: ['Python', 'SQL', 'PySpark', 'AWS', 'ETL'],
    keywords: {
      matched: ['Excel'],
      missing: ['Python', 'SQL', 'PySpark', 'Databricks', 'AWS', 'ETL', 'Data pipeline', 'Cloud'],
    },
    improvements: [
      { priority: 'high', title: 'Chọn JD Business/Sales', description: 'Profile phù hợp BD, CS, market research hơn Data Engineer.' },
    ],
    experienceComment:
      '**Không có matching kỹ thuật** cho Big Data Cloud Engineer — CV International Business, chỉ có Excel. Điểm thấp là kết quả mong đợi khi profile business đi vào JD data nặng.',
    companies: [],
    courses: [],
  },

  /* ── Các ô còn lại (điểm thấp / không demo chính) ── */
  'khanh_my:whitestar_livestream': {
    scores: { keyword: 52, experience: 45, presentation: 78 },
    strengths: ['Giao tiếp tốt', 'Customer service & sales simulation'],
    weaknesses: ['Không OBS/livestream', 'Không setup thiết bị live'],
    atsIssues: [{ issue: 'Thiếu OBS / livestream keywords', severity: 'high', fix: 'Chỉ apply nếu có training livestream' }],
    suggestedKeywords: ['OBS', 'Livestream'],
    keywords: { matched: ['Communication', 'Customer service'], missing: ['OBS Studio', 'Livestream', 'Setup', 'KPI live'] },
    improvements: [{ priority: 'high', title: 'Học OBS cơ bản', description: 'Hoàn thành 1 buổi trợ live thực tế rồi cập nhật CV.' }],
    experienceComment: 'Một số kỹ năng mềm liên quan CS nhưng thiếu toàn bộ nghiệp vụ vận hành live.',
    companies: [],
    courses: [],
  },
  'khanh_my:belending_ba': {
    scores: { keyword: 55, experience: 50, presentation: 80 },
    strengths: ['Business background', 'Market research', 'Excel'],
    weaknesses: ['Thiếu SQL/Python/BI', 'Không fintech lending'],
    atsIssues: [{ issue: 'Thiếu SQL/Python', severity: 'high', fix: 'Học SQL + Excel pivot nâng cao' }],
    suggestedKeywords: ['SQL', 'Fintech', 'Lending'],
    keywords: { matched: ['Excel', 'Market research', 'Business'], missing: ['SQL', 'Python', 'Lending funnel', 'Fintech'] },
    improvements: [{ priority: 'high', title: 'SQL for Analytics', description: 'Khóa SQL cơ bản 4 tuần.' }],
    experienceComment: 'Business student có nền tảng nhưng thiếu công cụ BA lending.',
    companies: [],
    courses: [],
  },
  'khanh_my:cybersecurity': {
    scores: { keyword: 15, experience: 12, presentation: 50 },
    strengths: [],
    weaknesses: ['Không CNTT/ATTT', 'Không security tooling'],
    atsIssues: [{ issue: 'No security keywords', severity: 'high', fix: 'Profile không phù hợp' }],
    suggestedKeywords: ['OWASP', 'CEH'],
    keywords: { matched: [], missing: ['OWASP', 'Pentest', 'Security', 'CEH'] },
    improvements: [{ priority: 'high', title: 'Không phù hợp JD', description: 'Chọn BD/CS thay vì ANTT.' }],
    experienceComment: 'Không matching chuyên môn an ninh mạng.',
    companies: [],
    courses: [],
  },
  'hai_dang:whitestar_livestream': {
    scores: { keyword: 28, experience: 25, presentation: 72 },
    strengths: ['Technical problem-solving'],
    weaknesses: ['Không livestream/OBS', 'Profile data engineer'],
    atsIssues: [{ issue: 'Wrong domain', severity: 'high', fix: 'Apply data roles' }],
    suggestedKeywords: ['OBS', 'Livestream'],
    keywords: { matched: [], missing: ['OBS', 'Livestream', 'Seller Center'] },
    improvements: [{ priority: 'high', title: 'Sai ngành', description: 'Target Big Data / AI engineer JD.' }],
    experienceComment: 'Data Engineer CV không phù hợp vận hành livestream.',
    companies: [],
    courses: [],
  },
  'hai_dang:bd_specialist': {
    scores: { keyword: 32, experience: 30, presentation: 70 },
    strengths: ['Communication qua project POC'],
    weaknesses: ['Không sales B2B F&B', 'Không hunter pipeline'],
    atsIssues: [{ issue: 'No sales keywords', severity: 'high', fix: 'Reframe nếu có sales side project' }],
    suggestedKeywords: ['B2B Sales', 'F&B'],
    keywords: { matched: ['Communication'], missing: ['Sales', 'F&B', 'Flavour', 'Pipeline'] },
    improvements: [{ priority: 'high', title: 'Không phù hợp sales specialist', description: 'Giữ hướng data/AI.' }],
    experienceComment: 'Technical CV không match hunter sales ngành flavour.',
    companies: [],
    courses: [],
  },
  'hai_dang:cybersecurity': {
    scores: { keyword: 42, experience: 40, presentation: 72 },
    strengths: ['Background IT/engineering', 'FastAPI, security-aware coding basics'],
    weaknesses: ['Không pentest/OWASP hands-on', 'Không CEH/cert security'],
    atsIssues: [{ issue: 'Thiếu OWASP/pentest experience', severity: 'high', fix: 'Cần lab security riêng' }],
    suggestedKeywords: ['OWASP', 'Pentest', 'CEH'],
    keywords: { matched: ['Python', 'API'], missing: ['OWASP', 'NIST', 'Burp', 'Nessus', 'CEH', 'Pentest'] },
    improvements: [{ priority: 'high', title: 'Security career pivot cần training', description: 'CEH/OWASP lab trước khi apply.' }],
    experienceComment: 'Cùng ngành IT nhưng thiếu chuyên môn ANTT ứng dụng — không đủ cho JD pentest.',
    companies: [],
    courses: [],
  },
  'gia_khanh:bd_specialist': {
    scores: { keyword: 40, experience: 38, presentation: 65 },
    strengths: ['Giao tiếp live commerce', 'Làm việc target KPI'],
    weaknesses: ['Không B2B F&B flavour', 'Không network manufacturer'],
    atsIssues: [{ issue: 'Thiếu B2B sales track record', severity: 'high', fix: 'Không phù hợp Essential flavour sales' }],
    suggestedKeywords: ['B2B', 'F&B', 'Flavour'],
    keywords: { matched: ['Communication', 'Sales support'], missing: ['F&B', 'Flavour', 'B2B manufacturing', 'English business'] },
    improvements: [{ priority: 'high', title: 'Giữ hướng livestream ops', description: 'JD sales flavour không phù hợp.' }],
    experienceComment: 'Live commerce gần sales hơn nhưng không phải B2B flavour industry.',
    companies: [],
    courses: [],
  },
  'gia_khanh:belending_ba': {
    scores: { keyword: 25, experience: 22, presentation: 60 },
    strengths: ['Theo dõi KPI số liệu live'],
    weaknesses: ['Không SQL/Python/fintech', 'Không BA lending'],
    atsIssues: [{ issue: 'No analytics tools', severity: 'high', fix: 'Wrong profile' }],
    suggestedKeywords: ['SQL', 'Python', 'Lending'],
    keywords: { matched: [], missing: ['SQL', 'Python', 'Lending', 'Fintech', 'Excel advanced'] },
    improvements: [{ priority: 'high', title: 'Không apply BA', description: 'Chọn JD livestream.' }],
    experienceComment: 'Không overlap nghiệp vụ phân tích cho vay.',
    companies: [],
    courses: [],
  },
  'gia_khanh:big_data_de': {
    scores: { keyword: 20, experience: 18, presentation: 58 },
    strengths: [],
    weaknesses: ['Không data engineering stack'],
    atsIssues: [{ issue: 'No PySpark/SQL', severity: 'high', fix: 'Profile ops only' }],
    suggestedKeywords: ['Python', 'PySpark'],
    keywords: { matched: [], missing: ['Python', 'SQL', 'PySpark', 'AWS', 'ETL'] },
    improvements: [{ priority: 'high', title: 'Sai ngành hoàn toàn', description: 'Whitestar JD phù hợp hơn.' }],
    experienceComment: 'Không có matching Big Data.',
    companies: [],
    courses: [],
  },
}

const FALLBACK_LOW: PairPresetBody = {
  scores: { keyword: 28, experience: 25, presentation: 48 },
  strengths: ['Cần bổ sung thông tin để đánh giá chính xác hơn'],
  weaknesses: [
    'Hệ thống chưa nhận diện bộ CV/JD demo',
    'Thử upload file từ folder CV&JD hoặc dán đúng nội dung mẫu',
  ],
  atsIssues: [
    { issue: 'Không khớp preset demo', severity: 'medium', fix: 'Dùng file CV_*.pdf / JD_* từ bộ mẫu dự án' },
  ],
  suggestedKeywords: [],
  keywords: { matched: [], missing: ['Keywords từ JD'] },
  improvements: [
    { priority: 'medium', title: 'Dùng bộ CV&JD mẫu', description: 'Upload hoặc paste nội dung từ folder CV&JD để có kết quả demo chính xác.' },
  ],
  experienceComment: 'Không đủ tín hiệu matching — điểm thấp mặc định. Upload CV/JD từ bộ demo để nhận phân tích chi tiết.',
  companies: [],
  courses: [],
}

export function resolveCvJdPreset(
  cvInput: DocumentInput,
  jdInput: DocumentInput,
): PairPresetBody | null {
  const cv = detectCvPreset(cvInput)
  const jd = detectJdPreset(jdInput)
  if (!cv || !jd) return null
  return PAIR_PRESETS[pairKey(cv, jd)] ?? null
}

export function generateCvJdMockResult(
  scanId: string,
  config: ScanConfig,
  cvInput: DocumentInput,
  jdInput: DocumentInput,
): CVAnalysisResult {
  const cv = detectCvPreset(cvInput)
  const jd = detectJdPreset(jdInput)
  const preset = resolveCvJdPreset(cvInput, jdInput)
  const body = preset ?? FALLBACK_LOW
  let computedExperience = cv ? computeCvPresetExperience(cv) : undefined
  if (cv && jd && computedExperience) {
    computedExperience = enrichExperienceForJd(cv, jd, computedExperience)
  }
  return buildResult(scanId, config, cvInput, jdInput, body, computedExperience, jd)
}

/** For tests / debug */
export function debugDetect(cvInput: DocumentInput, jdInput: DocumentInput) {
  return {
    cv: detectCvPreset(cvInput),
    jd: detectJdPreset(jdInput),
    pair:
      detectCvPreset(cvInput) && detectJdPreset(jdInput)
        ? pairKey(detectCvPreset(cvInput)!, detectJdPreset(jdInput)!)
        : null,
  }
}

export type { CvPresetId, JdPresetId }
