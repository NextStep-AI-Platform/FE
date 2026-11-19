import { useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import type {
  CvAward, CvCertification, CvEducation, CvExperience, CvProject, CvStructured,
} from '../../types/cvStructured'

type ListKey = 'experience' | 'projects' | 'education' | 'certifications' | 'awards'

const NEW_ITEM: { [K in ListKey]: () => CvStructured[K][number] } = {
  experience: (): CvExperience => ({ company: '', role: '', start: '', end: '', current: false, bullets: [] }),
  projects: (): CvProject => ({ name: '', role: '', tech: [], bullets: [] }),
  education: (): CvEducation => ({ school: '', degree: '', major: '', start: '', end: '', gpa: '' }),
  certifications: (): CvCertification => ({ name: '', issuer: '', year: '' }),
  awards: (): CvAward => ({ title: '', year: '', description: '' }),
}

const filled = (v: unknown): boolean =>
  typeof v === 'string' ? !!v.trim() : Array.isArray(v) ? v.some(filled) : v && typeof v === 'object' ? Object.values(v).some(filled) : false

/** CV form — nothing is required; empty sections are simply hidden in the CV. */
export default function CvForm({ value, onChange }: { value: CvStructured; onChange: (cv: CvStructured) => void }) {
  const update = <K extends keyof CvStructured>(key: K, v: CvStructured[K]) => onChange({ ...value, [key]: v })
  const updateItem = <K extends ListKey>(key: K, i: number, patch: Partial<CvStructured[K][number]>) =>
    update(key, value[key].map((it, j) => (j === i ? { ...it, ...patch } : it)) as CvStructured[K])
  const addItem = <K extends ListKey>(key: K) => update(key, [...value[key], NEW_ITEM[key]()] as CvStructured[K])
  const removeItem = <K extends ListKey>(key: K, i: number) =>
    update(key, value[key].filter((_, j) => j !== i) as CvStructured[K])
  const moveItem = <K extends ListKey>(key: K, i: number, dir: -1 | 1) => {
    const list = [...value[key]]
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    update(key, list as CvStructured[K])
  }
  const p = value.personal
  const setPersonal = (patch: Partial<CvStructured['personal']>) => update('personal', { ...p, ...patch })

  const itemControls = (key: ListKey, i: number) => (
    <div className="flex gap-1 shrink-0">
      <IconBtn label="Lên" onClick={() => moveItem(key, i, -1)}><ArrowUp size={14} /></IconBtn>
      <IconBtn label="Xuống" onClick={() => moveItem(key, i, 1)}><ArrowDown size={14} /></IconBtn>
      <IconBtn label="Xóa" onClick={() => removeItem(key, i)} danger><Trash2 size={14} /></IconBtn>
    </div>
  )

  return (
    <div className="space-y-3">
      <Accordion title="Thông tin cá nhân" done={filled(p)} defaultOpen>
        <Grid>
          <Field label="Họ và tên" value={p.fullName} onChange={v => setPersonal({ fullName: v })} />
          <Field label="Chức danh" value={p.title} onChange={v => setPersonal({ title: v })} placeholder="VD: Backend Developer" />
          <Field label="Email" value={p.email} onChange={v => setPersonal({ email: v })} />
          <Field label="Số điện thoại" value={p.phone} onChange={v => setPersonal({ phone: v })} />
          <Field label="Địa điểm" value={p.location} onChange={v => setPersonal({ location: v })} />
        </Grid>
        <ChipInput label="Liên kết (LinkedIn, GitHub...)" value={p.links} onChange={v => setPersonal({ links: v })} />
      </Accordion>

      <Accordion title="Tóm tắt" done={filled(value.summary)}>
        <TextArea label="Giới thiệu ngắn" value={value.summary} onChange={v => update('summary', v)} rows={4} />
      </Accordion>

      <Accordion title="Kinh nghiệm làm việc" done={filled(value.experience)} count={value.experience.length}>
        {value.experience.map((e, i) => (
          <Item key={i} title={e.role || e.company || `Kinh nghiệm ${i + 1}`} controls={itemControls('experience', i)}>
            <Grid>
              <Field label="Công ty" value={e.company} onChange={v => updateItem('experience', i, { company: v })} />
              <Field label="Vị trí" value={e.role} onChange={v => updateItem('experience', i, { role: v })} />
              <Field label="Bắt đầu" value={e.start} onChange={v => updateItem('experience', i, { start: v })} placeholder="VD: 03/2023" />
              <Field label="Kết thúc" value={e.current ? '' : e.end} disabled={e.current}
                onChange={v => updateItem('experience', i, { end: v })} placeholder={e.current ? 'Hiện tại' : 'VD: 12/2024'} />
            </Grid>
            <label className="flex items-center gap-2 text-xs text-ns-secondary mb-2 cursor-pointer">
              <input type="checkbox" checked={e.current} onChange={ev => updateItem('experience', i, { current: ev.target.checked })} />
              Đang làm việc tại đây
            </label>
            <BulletsArea value={e.bullets} onChange={v => updateItem('experience', i, { bullets: v })} />
          </Item>
        ))}
        <AddBtn onClick={() => addItem('experience')}>Thêm kinh nghiệm</AddBtn>
      </Accordion>

      <Accordion title="Dự án" done={filled(value.projects)} count={value.projects.length}>
        {value.projects.map((pr, i) => (
          <Item key={i} title={pr.name || `Dự án ${i + 1}`} controls={itemControls('projects', i)}>
            <Grid>
              <Field label="Tên dự án" value={pr.name} onChange={v => updateItem('projects', i, { name: v })} />
              <Field label="Vai trò" value={pr.role} onChange={v => updateItem('projects', i, { role: v })} />
            </Grid>
            <ChipInput label="Công nghệ" value={pr.tech} onChange={v => updateItem('projects', i, { tech: v })} />
            <BulletsArea value={pr.bullets} onChange={v => updateItem('projects', i, { bullets: v })} />
          </Item>
        ))}
        <AddBtn onClick={() => addItem('projects')}>Thêm dự án</AddBtn>
      </Accordion>

      <Accordion title="Học vấn" done={filled(value.education)} count={value.education.length}>
        {value.education.map((ed, i) => (
          <Item key={i} title={ed.school || `Học vấn ${i + 1}`} controls={itemControls('education', i)}>
            <Grid>
              <Field label="Trường" value={ed.school} onChange={v => updateItem('education', i, { school: v })} />
              <Field label="Bằng cấp" value={ed.degree} onChange={v => updateItem('education', i, { degree: v })} placeholder="VD: Cử nhân" />
              <Field label="Chuyên ngành" value={ed.major} onChange={v => updateItem('education', i, { major: v })} />
              <Field label="GPA" value={ed.gpa} onChange={v => updateItem('education', i, { gpa: v })} />
              <Field label="Bắt đầu" value={ed.start} onChange={v => updateItem('education', i, { start: v })} />
              <Field label="Kết thúc" value={ed.end} onChange={v => updateItem('education', i, { end: v })} />
            </Grid>
          </Item>
        ))}
        <AddBtn onClick={() => addItem('education')}>Thêm học vấn</AddBtn>
      </Accordion>

      <Accordion title="Kỹ năng" done={filled(value.skills)}>
        <ChipInput label="Chuyên môn" value={value.skills.technical} onChange={v => update('skills', { ...value.skills, technical: v })} />
        <ChipInput label="Kỹ năng mềm" value={value.skills.soft} onChange={v => update('skills', { ...value.skills, soft: v })} />
        <ChipInput label="Ngoại ngữ" value={value.skills.languages} onChange={v => update('skills', { ...value.skills, languages: v })} />
      </Accordion>

      <Accordion title="Chứng chỉ" done={filled(value.certifications)} count={value.certifications.length}>
        {value.certifications.map((c, i) => (
          <Item key={i} title={c.name || `Chứng chỉ ${i + 1}`} controls={itemControls('certifications', i)}>
            <Grid>
              <Field label="Tên chứng chỉ" value={c.name} onChange={v => updateItem('certifications', i, { name: v })} />
              <Field label="Đơn vị cấp" value={c.issuer} onChange={v => updateItem('certifications', i, { issuer: v })} />
              <Field label="Năm" value={c.year} onChange={v => updateItem('certifications', i, { year: v })} />
            </Grid>
          </Item>
        ))}
        <AddBtn onClick={() => addItem('certifications')}>Thêm chứng chỉ</AddBtn>
      </Accordion>

      <Accordion title="Giải thưởng / Hoạt động" done={filled(value.awards)} count={value.awards.length}>
        {value.awards.map((a, i) => (
          <Item key={i} title={a.title || `Mục ${i + 1}`} controls={itemControls('awards', i)}>
            <Grid>
              <Field label="Tên" value={a.title} onChange={v => updateItem('awards', i, { title: v })} />
              <Field label="Năm" value={a.year} onChange={v => updateItem('awards', i, { year: v })} />
            </Grid>
            <TextArea label="Mô tả" value={a.description} onChange={v => updateItem('awards', i, { description: v })} rows={2} />
          </Item>
        ))}
        <AddBtn onClick={() => addItem('awards')}>Thêm mục</AddBtn>
      </Accordion>
    </div>
  )
}

function Accordion({ title, done, count, defaultOpen = false, children }: {
  title: string; done: boolean; count?: number; defaultOpen?: boolean; children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-ns rounded-xl bg-ns-card">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 cursor-pointer">
        <span className="text-ns-primary text-sm font-medium">
          {title}{count ? <span className="text-ns-faint font-normal"> ({count})</span> : null}
        </span>
        <span className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${done ? 'bg-green-500/15 text-green-500' : 'bg-ns-raised text-ns-faint'}`}>
            {done ? 'Đã điền' : 'Trống'}
          </span>
          <ChevronDown size={16} className={`text-ns-faint transition ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function Item({ title, controls, children }: { title: string; controls: ReactNode; children: ReactNode }) {
  return (
    <div className="border border-ns rounded-lg p-3 bg-ns-page">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-ns-secondary text-xs font-medium truncate">{title}</p>
        {controls}
      </div>
      {children}
    </div>
  )
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">{children}</div>

function Field({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  return (
    <label className="block">
      <span className="text-ns-secondary text-xs block mb-1">{label}</span>
      <input value={value} disabled={disabled} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="input-field text-sm py-1.5 disabled:opacity-50" />
    </label>
  )
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-ns-secondary text-xs block mb-1">{label}</span>
      <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)} className="input-field text-sm resize-y" />
    </label>
  )
}

/** One bullet per line. Blank lines are only removed on submit (compactCv), so Enter keeps working. */
function BulletsArea({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <label className="block">
      <span className="text-ns-secondary text-xs block mb-1">Mô tả công việc (mỗi dòng một ý)</span>
      <textarea value={value.join('\n')} rows={4} onChange={e => onChange(e.target.value.split('\n'))}
        className="input-field text-sm resize-y" placeholder={'VD: Xây dựng REST API cho hệ thống đặt hàng\nTối ưu truy vấn giúp giảm thời gian phản hồi'} />
    </label>
  )
}

function ChipInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const commit = () => {
    const parts = draft.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length) onChange(Array.from(new Set([...value, ...parts])))
    setDraft('')
  }
  return (
    <div>
      <span className="text-ns-secondary text-xs block mb-1">{label}</span>
      <div className="input-field flex flex-wrap gap-1.5 py-1.5 min-h-[38px]">
        {value.map((chip, i) => (
          <span key={`${chip}-${i}`} className="inline-flex items-center gap-1 bg-blue-600/15 text-blue-500 text-xs px-2 py-0.5 rounded-full">
            {chip}
            <button type="button" aria-label={`Xóa ${chip}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="cursor-pointer">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={commit}
          placeholder={value.length ? '' : 'Gõ rồi Enter'}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
        />
      </div>
    </div>
  )
}

function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className={`p-1 rounded-md text-ns-faint cursor-pointer hover:bg-ns-raised ${danger ? 'hover:text-red-400' : 'hover:text-ns-primary'}`}>
      {children}
    </button>
  )
}

function AddBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full border border-dashed border-ns rounded-lg py-2 text-xs text-ns-muted hover:text-blue-500 hover:border-blue-500/50 flex items-center justify-center gap-1 cursor-pointer">
      <Plus size={14} /> {children}
    </button>
  )
}
