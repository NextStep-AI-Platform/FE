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
  password: string
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

export interface ScanConfig {
  company: string
  industry?: string
  role?: string
  experienceFrom?: number
  experienceTo?: number
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

export interface CVAnalysisResult {
  id: string
  cvName: string
  analyzedRole: string
  analyzedIndustry: string
  experienceLevel: string
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
  notifications: AppNotification[]
  hasSeenOnboarding: boolean
}
