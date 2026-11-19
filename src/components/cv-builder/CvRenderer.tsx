import type { ReactNode } from 'react'
import type { CvStructured } from '../../types/cvStructured'
import { getTemplate, type CvSectionKey } from '../../data/cvTemplates'

/** Renders a CvStructured as a white "paper" (used in builder preview, improved CV tab and print). */
export default function CvRenderer({ cv, templateId, highlightPaths, className = '' }: {
  cv: CvStructured
  templateId?: string | null
  highlightPaths?: Set<string>
  className?: string
}) {
  const t = getTemplate(templateId)
  const hl = (path: string) => (highlightPaths?.has(path) ? 'cv-hl bg-amber-200/60 rounded' : '')

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="mb-4 break-inside-avoid">
      <h3 className={`text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 ${t.accent}`}>{title}</h3>
      {children}
    </section>
  )
  const Bullets = ({ items, path }: { items: string[]; path: string }) =>
    items.some(b => b.trim()) ? (
      <ul className={`list-disc pl-5 ${hl(path)}`}>
        {items.filter(b => b.trim()).map((b, j) => <li key={j}>{b}</li>)}
      </ul>
    ) : null
  const period = (start: string, end: string, current = false) =>
    [start, current ? 'Hiện tại' : end].filter(Boolean).join(' – ')

  const render: Record<CvSectionKey, () => ReactNode> = {
    summary: () => cv.summary.trim() && (
      <Section title="Tóm tắt"><p className={`whitespace-pre-line ${hl('summary')}`}>{cv.summary}</p></Section>
    ),
    experience: () => cv.experience.length > 0 && (
      <Section title="Kinh nghiệm">
        {cv.experience.map((e, i) => (
          <div key={i} className="mb-2">
            <div className="flex justify-between gap-2 font-semibold">
              <span>{[e.role, e.company].filter(Boolean).join(' – ')}</span>
              <span className="text-slate-500 font-normal text-xs shrink-0">{period(e.start, e.end, e.current)}</span>
            </div>
            <Bullets items={e.bullets} path={`experience[${i}].bullets`} />
          </div>
        ))}
      </Section>
    ),
    projects: () => cv.projects.length > 0 && (
      <Section title="Dự án">
        {cv.projects.map((p, i) => (
          <div key={i} className="mb-2">
            <div className="font-semibold">{[p.name, p.role].filter(Boolean).join(' – ')}</div>
            {p.tech.length > 0 && (
              <p className={`text-xs text-slate-600 ${hl(`projects[${i}].tech`)}`}>Công nghệ: {p.tech.join(', ')}</p>
            )}
            <Bullets items={p.bullets} path={`projects[${i}].bullets`} />
          </div>
        ))}
      </Section>
    ),
    education: () => cv.education.length > 0 && (
      <Section title="Học vấn">
        {cv.education.map((e, i) => (
          <div key={i} className="mb-1.5">
            <div className="flex justify-between gap-2">
              <span className="font-semibold">{e.school}</span>
              <span className="text-slate-500 text-xs shrink-0">{period(e.start, e.end)}</span>
            </div>
            <p className="text-slate-600">{[e.degree, e.major, e.gpa && `GPA ${e.gpa}`].filter(Boolean).join(' · ')}</p>
          </div>
        ))}
      </Section>
    ),
    skills: () => {
      const s = cv.skills
      if (!s.technical.length && !s.soft.length && !s.languages.length) return null
      return (
        <Section title="Kỹ năng">
          {s.technical.length > 0 && <p className={hl('skills.technical')}><b>Chuyên môn:</b> {s.technical.join(', ')}</p>}
          {s.soft.length > 0 && <p className={hl('skills.soft')}><b>Kỹ năng mềm:</b> {s.soft.join(', ')}</p>}
          {s.languages.length > 0 && <p className={hl('skills.languages')}><b>Ngoại ngữ:</b> {s.languages.join(', ')}</p>}
        </Section>
      )
    },
    certifications: () => cv.certifications.length > 0 && (
      <Section title="Chứng chỉ">
        <ul className="list-disc pl-5">
          {cv.certifications.map((c, i) => <li key={i}>{[c.name, c.issuer, c.year].filter(Boolean).join(' – ')}</li>)}
        </ul>
      </Section>
    ),
    awards: () => cv.awards.length > 0 && (
      <Section title="Giải thưởng / Hoạt động">
        <ul className="list-disc pl-5">
          {cv.awards.map((a, i) => <li key={i}>{[a.title, a.year, a.description].filter(Boolean).join(' – ')}</li>)}
        </ul>
      </Section>
    ),
  }

  const p = cv.personal
  const contact = [p.email, p.phone, p.location, ...p.links].filter(Boolean).join(' · ')
  const header = (
    <header className="mb-4">
      {p.fullName && <h1 className={`text-2xl font-bold ${t.accent}`}>{p.fullName}</h1>}
      {p.title && <p className={`text-slate-600 ${hl('personal.title')}`}>{p.title}</p>}
      {contact && <p className="text-xs text-slate-500">{contact}</p>}
    </header>
  )

  const side: CvSectionKey[] = ['skills', 'education', 'certifications']
  return (
    <article className={`cv-print bg-white text-slate-800 text-[13px] leading-relaxed p-8 shadow-sm rounded-lg ${className}`}>
      {header}
      {t.layout === 'two-column' ? (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6">
          <div>{side.map(key => <div key={key}>{render[key]()}</div>)}</div>
          <div>{t.sectionOrder.filter(k => !side.includes(k)).map(key => <div key={key}>{render[key]()}</div>)}</div>
        </div>
      ) : (
        t.sectionOrder.map(key => <div key={key}>{render[key]()}</div>)
      )}
    </article>
  )
}
