export type ScoreLevel = 'excellent' | 'good' | 'average' | 'poor'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type InterviewMode = 'text' | 'voice'
export type PlanType = 'free' | 'premium' | 'vip'
export type HistoryItemType = 'scan' | 'interview'
export type DocumentInputMode = 'file' | 'text'

export interface User {
  id: string
  name: string
  email: string
  password?: string
  phone?: string
  location?: string
  bio?: string
  avatarUrl?: string
  plan: PlanType
  scansUsed: number
  scansLimit: number
  scansMonthKey: string
  createdAt: string
  targetRole?: string
  targetIndustry?: string
  notificationSettings: Record<string, boolean>
}

export interface PlanInfo {
  type: PlanType
  startedAt: string | null
  expiresAt: string | null
  interviewSessionsLeft: number
}

export interface DocumentInput {
  mode: DocumentInputMode
  fileName?: string
  fileSize?: number
  mimeType?: string
  textContent?: string
  fileId?: string
}

export type ExperienceUnit = 'month' | 'year'

export interface ScanConfig {
  company: string
  industry?: string
  role?: string
  /** @deprecated Dùng jdMinExperience + jdMinExperienceUnit */
  experienceFrom?: number
  /** @deprecated Dùng jdMinExperience + jdMinExperienceUnit */
  experienceTo?: number
  /** Yêu cầu KN tối thiểu do user nhập khi JD thiếu thông tin (tùy chọn) */
  jdMinExperience?: number
  jdMinExperienceUnit?: ExperienceUnit
  /** Canonical API contract: minimum experience in whole months. */
  minExperienceMonths?: number
}

export interface CVScore {
  overall: number
  ats: number
  keyword: number
  experience: number
  presentation: number
}

export interface ATSIssue {
  issue: string
  severity: 'high' | 'medium' | 'low'
  fix: string
}

export interface KeywordAnalysis {
  matched: string[]
  missing: string[]
}

export interface ImprovementItem {
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
}

export interface CompanyMatch {
  name: string
  match: number
  logo: string
  industry: string
  size: string
  requirements: string[]
}

export interface CourseRecommendation {
  title: string
  platform: 'Udemy' | 'Coursera' | 'Pluralsight' | 'edX'
  skill: string
  rating: number
  students: string
  price: string
  url: string
  reason: string
}

export interface WorkTimelineEntry {
  company: string
  role?: string
  from: string
  to: string
  months: number
}

export interface ComputedExperience {
  /** Tổng tháng (union timeline — không cộng trùng) */
  totalMonths: number
  label: string
  timeline: WorkTimelineEntry[]
  /** KN liên quan domain JD (vd: chỉ project DE/cloud) */
  relevantMonths?: number
  relevantLabel?: string
  relevantNote?: string
}

export interface AtsScoreBreakdown {
  finalScore: number
  components: {
    keyword: { score: number; weight: number; contribution: number; label: string }
    experience: { score: number; weight: number; contribution: number; label: string }
    presentation: { score: number; weight: number; contribution: number; label: string }
    structure: { score: number; weight: number; contribution: number; label: string }
  }
  penalties: {
    issuePenalty: number
    jdMinPenalty: number
  }
  summary: string
}

export interface CoverageScoreBreakdown {
  finalScore: number
  components: {
    keyword: { score: number; weight: number; contribution: number; label: string }
    experience: { score: number; weight: number; contribution: number; label: string }
    ats: { score: number; weight: number; contribution: number; label: string }
    presentation: { score: number; weight: number; contribution: number; label: string }
  }
  penalties: { jdMinPenalty: number }
  summary: string
}

export interface CVAnalysisResult {
  id: string
  cvName: string
  analyzedRole: string
  analyzedIndustry: string
  experienceLevel: string
  computedExperience?: ComputedExperience
  /** Nhãn yêu cầu KN tối thiểu từ form (vd: "3 tháng") */
  jdMinExperienceLabel?: string
  /** Chi tiết cách tính điểm ATS (weighted composite) */
  atsBreakdown?: AtsScoreBreakdown
  /** Chi tiết Coverage Score tổng */
  coverageBreakdown?: CoverageScoreBreakdown
  analyzedAt: string
  scores: CVScore
  strengths: string[]
  weaknesses: string[]
  atsIssues: ATSIssue[]
  suggestedKeywords: string[]
  keywords: KeywordAnalysis
  improvements: ImprovementItem[]
  experienceComment: string
  companies?: CompanyMatch[]
  courses?: CourseRecommendation[]
  isPremiumContent: boolean
}

export interface ScanRecord {
  id: string
  userId: string
  title: string
  role: string
  company: string
  overallScore: number
  analyzedAt: string
  cvInput: DocumentInput
  jdInput: DocumentInput
  config: ScanConfig
  result: CVAnalysisResult
}

export interface CVFileRecord {
  id: string
  userId: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  type: 'info' | 'success' | 'promo'
}

export interface InterviewQuestionResult {
  question: string
  answer: string
  score: number
  feedback: string
}

export interface InterviewSessionRecord {
  id: string
  userId: string
  role: string
  industry: string
  mode: InterviewMode
  overallScore: number
  durationSeconds: number
  completedAt: string
  questions: InterviewQuestionResult[]
}

export interface InterviewMessage {
  id: number
  role: 'ai' | 'user'
  content: string
  timestamp: string
  questionNumber?: number
}

export interface QuestionFeedback {
  question: string
  userAnswer?: string
  score: number
  feedback: string
  improvement: string
  sampleAnswer?: string
}

export interface InterviewReport {
  totalQuestions: number
  answeredQuestions: number
  duration: string
  overallScore: number
  categoryScores: {
    communication: number
    technical: number
    problemSolving: number
    attitude: number
  }
  questionFeedback: QuestionFeedback[]
}

export interface HistoryItem {
  id: number
  type: HistoryItemType
  date: string
  score: number
  role: string
  status: 'completed' | 'in_progress' | 'failed'
  cvName?: string
  difficulty?: Difficulty
  duration?: string
}

export interface AppState {
  user: User | null
  isAuthenticated: boolean
  plan: PlanInfo
  scans: ScanRecord[]
  cvFiles: CVFileRecord[]
  interviews: InterviewSessionRecord[]
  notifications: AppNotification[]
  hasSeenOnboarding: boolean
}

export type {
  CVAnalysisReportV2,
  CompatibleAnalysisReport,
  RequirementMatchV2,
  ReportEvidenceV2,
} from './reportV2'
