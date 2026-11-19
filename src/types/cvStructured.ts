// Contract shared with BE/AI (docs/implementation/00-README.md §2). Every field is optional on the wire.
export interface CvPersonal { fullName: string; title: string; email: string; phone: string; location: string; links: string[] }
export interface CvExperience { company: string; role: string; start: string; end: string; current: boolean; bullets: string[] }
export interface CvProject { name: string; role: string; tech: string[]; bullets: string[] }
export interface CvEducation { school: string; degree: string; major: string; start: string; end: string; gpa: string }
export interface CvSkills { technical: string[]; soft: string[]; languages: string[] }
export interface CvCertification { name: string; issuer: string; year: string }
export interface CvAward { title: string; year: string; description: string }

export interface CvStructured {
  personal: CvPersonal
  summary: string
  experience: CvExperience[]
  projects: CvProject[]
  education: CvEducation[]
  skills: CvSkills
  certifications: CvCertification[]
  awards: CvAward[]
}

export type CvChangeType = 'keyword' | 'rephrase' | 'add_info' | 'reorder'

export interface CvChange {
  id: string
  path: string
  before: string | string[] | null
  after: string | string[]
  type: CvChangeType
  addedKeywords: string[]
  rationale: string
  needsUserConfirmation: boolean
}

export type DecisionState = 'accepted' | 'rejected' | 'edited'
export interface CvDecision { state: DecisionState; value?: string | string[] | null }

export interface CvRevisionResponse {
  status: 'unavailable' | 'pending' | 'completed' | 'failed'
  templateId: string | null
  originalStructured: CvStructured | null
  changes: CvChange[]
  decisions: Record<string, CvDecision>
  targetKeywords: string[]
  limitations: string[]
  errorMessage: string | null
}
