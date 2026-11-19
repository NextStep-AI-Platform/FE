import type { CvChange, CvDecision, CvStructured } from '../types/cvStructured'

export const emptyCv = (): CvStructured => ({
  personal: { fullName: '', title: '', email: '', phone: '', location: '', links: [] },
  summary: '',
  experience: [],
  projects: [],
  education: [],
  skills: { technical: [], soft: [], languages: [] },
  certifications: [],
  awards: [],
})

/** Fill missing fields so partial data from BE/localStorage is safe to render. */
export function normalizeCv(raw: unknown): CvStructured {
  const base = emptyCv()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<CvStructured>
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
  const strs = (v: unknown): string[] => arr<unknown>(v).filter((x): x is string => typeof x === 'string')
  return {
    personal: { ...base.personal, ...(r.personal ?? {}), links: strs(r.personal?.links) },
    summary: typeof r.summary === 'string' ? r.summary : '',
    experience: arr<Partial<CvStructured['experience'][number]>>(r.experience).map(e => ({
      company: '', role: '', start: '', end: '', current: false, ...e, bullets: strs(e?.bullets),
    })),
    projects: arr<Partial<CvStructured['projects'][number]>>(r.projects).map(p => ({
      name: '', role: '', ...p, tech: strs(p?.tech), bullets: strs(p?.bullets),
    })),
    education: arr<Partial<CvStructured['education'][number]>>(r.education).map(e => ({
      school: '', degree: '', major: '', start: '', end: '', gpa: '', ...e,
    })),
    skills: {
      technical: strs(r.skills?.technical), soft: strs(r.skills?.soft), languages: strs(r.skills?.languages),
    },
    certifications: arr<Partial<CvStructured['certifications'][number]>>(r.certifications).map(c => ({ name: '', issuer: '', year: '', ...c })),
    awards: arr<Partial<CvStructured['awards'][number]>>(r.awards).map(a => ({ title: '', year: '', description: '', ...a })),
  }
}

const hasText = (v: unknown): boolean =>
  typeof v === 'string' ? v.trim().length > 0
    : Array.isArray(v) ? v.some(hasText)
      : v && typeof v === 'object' ? Object.values(v).some(hasText)
        : false

/** Count filled sections for the "x/8 mục" badge. */
export function filledSections(cv: CvStructured): { filled: number; total: number } {
  const parts = [cv.personal, cv.summary, cv.experience, cv.projects, cv.education, cv.skills, cv.certifications, cv.awards]
  return { filled: parts.filter(hasText).length, total: parts.length }
}

export const isCvEmpty = (cv: CvStructured) => !hasText(cv)

/** Rough visible-text length, used for a soft "CV khá ngắn" warning only. */
export function approxLength(cv: CvStructured): number {
  let n = 0
  const walkText = (v: unknown) => {
    if (typeof v === 'string') n += v.trim().length
    else if (Array.isArray(v)) v.forEach(walkText)
    else if (v && typeof v === 'object') Object.values(v).forEach(walkText)
  }
  walkText(cv)
  return n
}

/** Drop blank lines/items before sending to BE. */
export function compactCv(cv: CvStructured): CvStructured {
  const clean = (xs: string[]) => xs.map(s => s.trim()).filter(Boolean)
  return {
    ...cv,
    personal: { ...cv.personal, links: clean(cv.personal.links) },
    experience: cv.experience.map(e => ({ ...e, bullets: clean(e.bullets) })).filter(hasText),
    projects: cv.projects.map(p => ({ ...p, tech: clean(p.tech), bullets: clean(p.bullets) })).filter(hasText),
    education: cv.education.filter(hasText),
    skills: { technical: clean(cv.skills.technical), soft: clean(cv.skills.soft), languages: clean(cv.skills.languages) },
    certifications: cv.certifications.filter(hasText),
    awards: cv.awards.filter(hasText),
  }
}

// ---- path + applyChanges (mirrors cv_paths.py) ----
const TOKEN = /^([a-zA-Z]+)(?:\[(\d+)\])?$/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = any

function walk(doc: AnyDoc, path: string): [AnyDoc, string | number] {
  const parts = path.split('.')
  let node = doc
  for (let i = 0; i < parts.length; i++) {
    const m = TOKEN.exec(parts[i])
    if (!m || node == null) throw new Error(`Bad path ${path}`)
    const [, key, idx] = m
    const last = i === parts.length - 1
    if (last && idx === undefined) return [node, key]
    node = node[key]
    if (idx !== undefined) {
      if (!Array.isArray(node) || Number(idx) >= node.length) throw new Error(`Bad path ${path}`)
      if (last) return [node, Number(idx)]
      node = node[Number(idx)]
    }
  }
  throw new Error(`Bad path ${path}`)
}

export const getPath = (doc: AnyDoc, path: string): unknown => {
  const [p, k] = walk(doc, path)
  return p[k]
}

export const setPath = (doc: AnyDoc, path: string, value: unknown) => {
  const [p, k] = walk(doc, path)
  p[k] = value
}

/** Improved CV = original + accepted/edited changes. */
export function applyChanges(original: CvStructured, changes: CvChange[], decisions: Record<string, CvDecision>): CvStructured {
  const doc = structuredClone(original)
  for (const ch of changes) {
    const d = decisions[ch.id]
    if (!d || d.state === 'rejected') continue
    try {
      setPath(doc, ch.path, d.state === 'edited' ? d.value ?? ch.after : ch.after)
    } catch {
      /* ignore stale paths */
    }
  }
  return doc
}

/** Default: accept safe changes; leave ones needing confirmation undecided. */
export const defaultDecisions = (changes: CvChange[]): Record<string, CvDecision> =>
  Object.fromEntries(changes.filter(c => !c.needsUserConfirmation).map(c => [c.id, { state: 'accepted' as const }]))

export const hasPlaceholder = (v: string | string[] | null | undefined) =>
  (Array.isArray(v) ? v.join('\n') : v ?? '').toLowerCase().includes('[bổ sung')

/** Keyword coverage of a CV (no LLM), for the before/after indicator. */
export function keywordCoverage(cv: CvStructured, keywords: string[]) {
  const text = JSON.stringify(cv).toLowerCase()
  const unique = Array.from(new Set(keywords.map(k => k.trim().toLowerCase()).filter(Boolean)))
  const hit = unique.filter(k => text.includes(k)).length
  return { hit, total: unique.length }
}

/** Human label for a change path, e.g. "Kinh nghiệm #1 · Mô tả". */
export function describePath(path: string, cv?: CvStructured | null): string {
  const exp = /^experience\[(\d+)\]\.bullets$/.exec(path)
  if (exp) {
    const e = cv?.experience[Number(exp[1])]
    return `Kinh nghiệm · ${[e?.role, e?.company].filter(Boolean).join(' – ') || `#${Number(exp[1]) + 1}`}`
  }
  const proj = /^projects\[(\d+)\]\.(bullets|tech)$/.exec(path)
  if (proj) {
    const name = cv?.projects[Number(proj[1])]?.name || `#${Number(proj[1]) + 1}`
    return `Dự án · ${name}${proj[2] === 'tech' ? ' (công nghệ)' : ''}`
  }
  return ({
    summary: 'Tóm tắt',
    'personal.title': 'Chức danh',
    'skills.technical': 'Kỹ năng chuyên môn',
    'skills.soft': 'Kỹ năng mềm',
    'skills.languages': 'Ngoại ngữ',
  } as Record<string, string>)[path] ?? path
}
