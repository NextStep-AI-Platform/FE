import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, ChevronDown, Loader2, Lock, History, Check, Circle } from 'lucide-react'
import { INDUSTRIES, ROLES_BY_INDUSTRY } from '../constants'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { generateMockResult } from '../data/mockAnalysis'
import { buildScanTitle, formatDateTime, formatFileSize, validateExperienceRange } from '../lib/utils'
import { ANALYSIS_PROGRESS_STEPS, getAnalysisStepStatus } from '../lib/analysisProgress'
import type { CVFileRecord,DocumentInput, ScanConfig, ScanRecord } from '../types'

type InputMode = 'file' | 'text'

interface PanelState {
  mode: InputMode
  file: File | null
  text: string
  selectedFileId?: string
}

function DualInputPanel({
  title,
  subtitle,
  state,
  onChange,
}: {
  title: string
  subtitle: string
  state: PanelState
  onChange: (s: PanelState) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const ok = file.type === 'application/pdf' || file.name.endsWith('.docx') || file.name.endsWith('.doc')
    if (!ok) return
    onChange({ ...state, mode: 'file', file, text: '', selectedFileId: undefined })
  }

  return (
    <div className="bg-ns-card border border-ns rounded-2xl p-5 flex flex-col h-full min-h-[280px] shadow-card animate-slide-up">
      <h3 className="font-heading font-semibold text-ns-primary mb-1">{title}</h3>
      <p className="text-ns-faint text-xs mb-4">{subtitle}</p>

      <div className="flex bg-ns-page border border-ns rounded-lg p-1 mb-4">
        {(['file', 'text'] as InputMode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => onChange({ ...state, mode: m })}
            className={`flex-1 py-2 rounded-md text-xs font-medium cursor-pointer transition ${
              state.mode === m ? 'bg-blue-600 text-white' : 'text-ns-muted hover:text-ns-primary'
            }`}
          >
            {m === 'file' ? 'Tải file' : 'Dán nội dung' }
          </button>
        ))}
      </div>

      {state.mode === 'file' ? (
        state.file ? (
          <div className="flex items-center gap-3 p-4 bg-ns-page rounded-xl border border-ns flex-1">
            <FileText size={20} className="text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-ns-primary text-sm truncate">{state.file.name}</p>
              <p className="text-ns-faint text-xs">{formatFileSize(state.file.size)}</p>
            </div>
            <button type="button" onClick={() => onChange({ ...state, file: null })} className="text-ns-faint hover:text-red-400 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center flex-1 min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition ${
              dragOver ? 'border-blue-500 bg-blue-500/5 animate-pulse-soft' : 'border-ns hover:border-blue-500/50'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          >
            <Upload size={32} className="text-blue-400 mb-3" />
            <p className="text-ns-secondary text-sm">Kéo thả hoặc chọn file</p>
            <p className="text-ns-faint text-xs mt-1">PDF, DOCX · Tối đa 5MB</p>
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </div>
        )
      ) : (
        <textarea
          value={state.text}
          onChange={e => onChange({ ...state, mode: 'text', text: e.target.value, file: null })}
          placeholder="Dán nội dung vào đây..."
          className="input-field flex-1 min-h-[220px] resize-none text-sm"
        />
      )}
    </div>
  )
}

function AnalysisProgressPanel({ progress }: { progress: number }) {
  const steps = ANALYSIS_PROGRESS_STEPS
  return (
    <div className="bg-ns-card border border-ns rounded-2xl p-5 shadow-card h-full flex flex-col animate-fade-in">
      <h3 className="font-heading font-semibold text-ns-primary text-sm mb-1">Tiến hành phân tích</h3>
      <p className="text-ns-faint text-xs mb-5">AI đang xử lý CV của bạn...</p>

      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-ns-muted">Tiến độ tổng</span>
          <span className="text-blue-400 font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-ns-raised rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="space-y-3 flex-1">
        {steps.map((label, index) => {
          const status = getAnalysisStepStatus(index, progress, steps.length)
          return (
            <li
              key={label}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                status === 'done'
                  ? 'border-green-500/30 bg-green-500/5'
                  : status === 'active'
                    ? 'border-blue-500/40 bg-blue-600/10'
                    : 'border-ns bg-ns-page/50 opacity-60'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {status === 'done' && (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check size={14} className="text-green-400" />
                  </div>
                )}
                {status === 'active' && (
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Loader2 size={14} className="text-blue-400 animate-spin" />
                  </div>
                )}
                {status === 'pending' && (
                  <div className="w-6 h-6 rounded-full bg-ns-raised flex items-center justify-center">
                    <Circle size={10} className="text-ns-faint" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  status === 'done' ? 'text-green-400' : status === 'active' ? 'text-ns-primary' : 'text-ns-muted'
                }`}>
                  Bước {index + 1}: {label}
                </p>
                {status === 'active' && (
                  <p className="text-ns-faint text-xs mt-0.5 animate-pulse-soft">Đang xử lý...</p>
                )}
                {status === 'done' && (
                  <p className="text-green-400/70 text-xs mt-0.5">Hoàn tất</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ConfigPanel({
  company, setCompany, industry, setIndustry, industryOther, setIndustryOther,
  role, setRole, roleOther, setRoleOther, roles,
  expFrom, setExpFrom, expTo, setExpTo,
  hasCv, onAnalyze,
}: {
  company: string; setCompany: (v: string) => void
  industry: string; setIndustry: (v: string) => void
  industryOther: string; setIndustryOther: (v: string) => void
  role: string; setRole: (v: string) => void
  roleOther: string; setRoleOther: (v: string) => void
  roles: string[]
  expFrom: string; setExpFrom: (v: string) => void
  expTo: string; setExpTo: (v: string) => void
  hasCv: boolean
  onAnalyze: () => void
}) {
  return (
    <div className="bg-ns-card border border-ns rounded-2xl p-5 space-y-4 shadow-card h-full flex flex-col animate-slide-up">
      <h3 className="font-heading font-semibold text-ns-primary text-sm">Cấu hình phân tích</h3>
      <div>
        <label className="text-ns-secondary text-xs font-medium block mb-1.5">Tên công ty *</label>
        <input value={company} onChange={e => setCompany(e.target.value)} className="input-field text-sm py-2" placeholder="VD: FPT Software" />
      </div>
      <div>
        <label className="text-ns-secondary text-xs font-medium block mb-1.5">Ngành nghề</label>
        <div className="relative">
          <select value={industry} onChange={e => { setIndustry(e.target.value); setRole('') }} className="input-field appearance-none pr-9 cursor-pointer text-sm py-2">
            <option value="">-- Tùy chọn --</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            <option value="__other__">Khác...</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-faint pointer-events-none" />
        </div>
        {industry === '__other__' && (
          <input value={industryOther} onChange={e => setIndustryOther(e.target.value)} className="input-field mt-2 text-sm py-2" placeholder="Nhập ngành nghề" />
        )}
      </div>
      <div>
        <label className="text-ns-secondary text-xs font-medium block mb-1.5">Vị trí ứng tuyển</label>
        <div className="relative">
          <select value={role} onChange={e => setRole(e.target.value)} className="input-field appearance-none pr-9 cursor-pointer text-sm py-2" disabled={!industry}>
            <option value="">-- Tùy chọn --</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
            <option value="__other__">Khác...</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-faint pointer-events-none" />
        </div>
        {role === '__other__' && (
          <input value={roleOther} onChange={e => setRoleOther(e.target.value)} className="input-field mt-2 text-sm py-2" placeholder="Nhập vị trí" />
        )}
      </div>
      <div>
        <label className="text-ns-secondary text-xs font-medium block mb-1.5">Kinh nghiệm (tùy chọn)</label>
        <div className="flex flex-nowrap items-center justify-center lg:justify-start lg:gap-3">
          <span className="text-ns-muted text-xs">Từ</span>
          <input type="number" min={0} max={50} value={expFrom} onChange={e => setExpFrom(e.target.value)} className="input-field w-16 text-sm py-2 text-center" />
          <span className="text-ns-muted text-xs">năm · Đến</span>
          <input type="number" min={0} max={50} value={expTo} onChange={e => setExpTo(e.target.value)} className="input-field w-16 text-sm py-2 text-center" />
          <span className="text-ns-muted text-xs">năm</span>
        </div>
      </div>
      <button type="button" onClick={onAnalyze} disabled={!hasCv || !company.trim()} className="w-full btn-primary py-2.5 text-sm mt-auto disabled:opacity-50 disabled:cursor-not-allowed">
        Bắt đầu phân tích
      </button>
    </div>
  )
}

export default function CVScanPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, cvFiles, addScan, addCVFile, canScan, scansRemaining, plan } = useApp()

  const [cv, setCv] = useState<PanelState>({ mode: 'file', file: null, text: '' })
  const [jd, setJd] = useState<PanelState>({ mode: 'file', file: null, text: '' })
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [industryOther, setIndustryOther] = useState('')
  const [role, setRole] = useState('')
  const [roleOther, setRoleOther] = useState('')
  const [expFrom, setExpFrom] = useState('')
  const [expTo, setExpTo] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)

  const quotaBlocked = plan.type === 'free' && !canScan()
  const roles = industry && industry !== '__other__' ? (ROLES_BY_INDUSTRY[industry] ?? []) : []
  const finalIndustry = industry === '__other__' ? industryOther : industry
  const finalRole = role === '__other__' ? roleOther : role
  const hasCv = !!(cv.file || cv.text.trim())

  const buildDocInput = (panel: PanelState):DocumentInput => {
    if (panel.file) {
      return { mode: 'file', fileName: panel.file.name, fileSize: panel.file.size, mimeType: panel.file.type || undefined }
    }
    return { mode: 'text', textContent: panel.text }
  }

  const selectHistoryFile = (record: CVFileRecord) => {
    const mockFile = new File([''], record.fileName, { type: record.mimeType })
    Object.defineProperty(mockFile, 'size', { value: record.fileSize })
    setCv({ mode: 'file', file: mockFile, text: '', selectedFileId: record.id })
  }

  const handleAnalyze = () => {
    if (!hasCv) { toast.error('Thiếu CV', 'Vui lòng tải hoặc dán nội dung CV'); return }
    if (!company.trim()) { toast.error('Thiếu tên công ty', 'Vui lòng nhập tên công ty để đặt tên kết quả'); return }
    if (expFrom || expTo) {
      const from = Number(expFrom)
      const to = Number(expTo || expFrom)
      if (!validateExperienceRange(from, to)) {
        toast.error('Kinh nghiệm không hợp lệ', 'Đảm bảo số năm hợp lệ và "Đến" ≥ "Từ"')
        return
      }
    }
    if (!canScan()) return

    if (cv.file && user) {
      addCVFile({
        id: `cvf_${Date.now()}`, userId: user.id, fileName: cv.file.name,
        fileSize: cv.file.size, mimeType: cv.file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      })
    }

    setAnalyzing(true)
    setProgress(0)
    const stepCount = ANALYSIS_PROGRESS_STEPS.length
    const totalMs = 2800
    const stepMs = totalMs / stepCount
    let step = 0
    const stepTimer = window.setInterval(() => {
      step += 1
      setProgress(Math.min((step / stepCount) * 100, 100))
      if (step >= stepCount) window.clearInterval(stepTimer)
    }, stepMs)

    setTimeout(() => {
      window.clearInterval(stepTimer)
      setProgress(100)
      const config: ScanConfig = {
        company: company.trim(), industry: finalIndustry || undefined, role: finalRole || undefined,
        experienceFrom: expFrom ? Number(expFrom) : undefined,
        experienceTo: expTo ? Number(expTo) : expFrom ? Number(expFrom) : undefined,
      }
      const scanId = `scan_${Date.now()}`
      const cvInput = buildDocInput(cv)
      const jdInput = buildDocInput(jd)
      const result = generateMockResult(scanId, config, cvInput, jdInput)
      const record: ScanRecord = {
        id: scanId, userId: user!.id, title: buildScanTitle(finalRole || 'ViTri', company.trim()),
        role: finalRole || 'Chưa khai báo', company: company.trim(), overallScore: result.scores.overall,
        analyzedAt: new Date().toISOString(), cvInput, jdInput, config, result,
      }
      addScan(record)
      setAnalyzing(false)
      toast.success('Phân tích hoàn tất', 'Coverage Score đã được tạo')
      navigate(`/analysis/${scanId}`)
    }, 2800)
  }

  return (
    <div className="relative p-6 max-w-6xl mx-auto space-y-6">
      <div className={quotaBlocked ? 'blur-sm pointer-events-none select-none' : ''}>
        <div className="animate-fade-in">
          <h2 className="font-heading font-bold text-ns-primary text-2xl">Phân tích CV</h2>
          <p className="text-ns-muted text-sm mt-1">
            Tải hoặc dán CV và JD · Còn {scansRemaining()} lượt scan miễn phí tháng này
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-6 lg:items-stretch mt-6">
          <div className="lg:flex-[2] flex flex-col lg:flex-row lg:gap-6 space-y-6 lg:space-y-0">
            <div className="flex-1 min-h-[300px] flex flex-col">
              <DualInputPanel title="CV của bạn" subtitle="PDF hoặc DOCX, hoặc dán nội dung" state={cv} onChange={setCv} />
            </div>
            <div className="flex-1 min-h-[300px] flex flex-col">
              <DualInputPanel title="Mô tả công việc (JD)" subtitle="Tùy chọn — giúp tăng độ chính xác Coverage Score" state={jd} onChange={setJd} />
            </div>
          </div>
          <div className="lg:flex-[1] flex flex-col mt-6 lg:mt-0">
            {analyzing ? (
              <AnalysisProgressPanel progress={progress} />
            ) : (
              <ConfigPanel
                company={company} setCompany={setCompany}
                industry={industry} setIndustry={setIndustry}
                industryOther={industryOther} setIndustryOther={setIndustryOther}
                role={role} setRole={setRole}
                roleOther={roleOther} setRoleOther={setRoleOther}
                roles={roles}
                expFrom={expFrom} setExpFrom={setExpFrom}
                expTo={expTo} setExpTo={setExpTo}
                hasCv={hasCv}
                onAnalyze={handleAnalyze}
              />
            )}
          </div>
        </div>

        {cvFiles.length > 0 && (
          <div className="bg-ns-card border border-ns rounded-2xl p-5 mt-6 shadow-card animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <History size={16} className="text-blue-400" />
              <h3 className="font-medium text-ns-primary text-sm">CV đã tải lên trước đó</h3>
            </div>
            <div className="space-y-2">
              {cvFiles.map(f => (
                <button key={f.id} type="button" onClick={() => selectHistoryFile(f)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition hover:scale-[1.01] ${
                    cv.selectedFileId === f.id ? 'border-blue-500 bg-blue-600/10' : 'border-ns hover:border-blue-500/30 bg-ns-page'
                  }`}>
                  <FileText size={16} className="text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-ns-primary text-sm truncate">{f.fileName}</p>
                    <p className="text-ns-faint text-xs">{formatFileSize(f.fileSize)} · {formatDateTime(f.uploadedAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {quotaBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-ns-card border border-blue-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-blue-400" />
            </div>
            <h3 className="font-heading font-bold text-ns-primary text-xl mb-2">Bạn đã hết lượt scan miễn phí</h3>
            <p className="text-ns-muted text-sm mb-6">Nâng cấp Premium để phân tích CV không giới hạn và nhận insight chuyên sâu</p>
            <div className="flex flex-col lg:flex-row lg:gap-3">
              <button onClick={() => navigate('/pricing')} className="btn-primary w-full">Nâng cấp Premium</button>
              <button onClick={() => navigate('/dashboard')} className="border border-ns text-ns-secondary py-2.5 rounded-xl cursor-pointer hover:bg-ns-raised">Quay lại Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
