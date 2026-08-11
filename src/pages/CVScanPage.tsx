import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, ChevronDown, Loader2, Lock, History, Check, Circle } from 'lucide-react'
import { INDUSTRIES, ROLES_BY_INDUSTRY } from '../constants'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { generateMockResult } from '../data/mockAnalysis'
import { buildScanTitle, formatDateTime, formatFileSize } from '../lib/utils'
import { USE_API } from '../lib/config'
import { createScan, runScan, pollScanUntilDone } from '../lib/api/scans'
import { validateScanDocuments } from '../lib/cvJdMatch'
import { ANALYSIS_PROGRESS_STEPS, getAnalysisStepStatus } from '../lib/analysisProgress'
import type { CVFileRecord, DocumentInput, ExperienceUnit, ScanConfig, ScanRecord } from '../types'

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
  allowTextMode = true,
  allowFileMode = true,
  textDisabledHint = 'Phát triển sau',
}: {
  title: string
  subtitle: string
  state: PanelState
  onChange: (s: PanelState) => void
  allowTextMode?: boolean
  allowFileMode?: boolean
  textDisabledHint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const effectiveMode =
    state.mode === 'file' && !allowFileMode
      ? 'text'
      : state.mode === 'text' && !allowTextMode
        ? 'file'
        : state.mode

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const lowerName = file.name.toLowerCase()
    const ok = file.type === 'application/pdf' || lowerName.endsWith('.pdf') || lowerName.endsWith('.docx')
    if (!ok) return
    onChange({ ...state, mode: 'file', file, text: '', selectedFileId: undefined })
  }

  return (
    <div className="bg-ns-card border border-ns rounded-2xl p-5 flex flex-col h-full min-h-0 overflow-hidden shadow-card animate-slide-up">
      <h3 className="font-heading font-semibold text-ns-primary mb-1 shrink-0">{title}</h3>
      <p className="text-ns-faint text-xs mb-4 shrink-0">{subtitle}</p>

      <div className="flex bg-ns-page border border-ns rounded-lg p-1 mb-4 shrink-0">
        {(['file', 'text'] as InputMode[]).map(m => {
          const isTextTab = m === 'text'
          const disabled = (isTextTab && !allowTextMode) || (!isTextTab && !allowFileMode)
          const disabledHint = isTextTab
            ? textDisabledHint
            : 'Phase 1b chi ho tro noi dung text'
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              title={disabled ? disabledHint : undefined}
              onClick={() => {
                if (disabled) return
                onChange({ ...state, mode: m })
              }}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition relative group ${
                disabled
                  ? 'text-ns-faint/50 cursor-not-allowed opacity-60'
                  : effectiveMode === m
                    ? 'bg-blue-600 text-white cursor-pointer'
                    : 'text-ns-muted hover:text-ns-primary cursor-pointer'
              }`}
            >
              {m === 'file' ? 'Tải file' : 'Dán nội dung'}
              {disabled && (
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-10 hidden group-hover:block whitespace-nowrap rounded-md bg-ns-raised border border-ns px-2 py-1 text-[10px] text-ns-secondary shadow-lg">
                  {disabledHint}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {effectiveMode === 'file' ? (
        state.file ? (
          <div className="flex items-start gap-3 p-4 bg-ns-page rounded-xl border border-ns flex-1 min-h-0 overflow-hidden">
            <FileText size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-ns-primary text-sm truncate" title={state.file.name}>
                {state.file.name}
              </p>
              <p className="text-ns-faint text-xs mt-1">{formatFileSize(state.file.size)}</p>
            </div>
            <button type="button" onClick={() => onChange({ ...state, file: null })} className="text-ns-faint hover:text-red-400 cursor-pointer shrink-0">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center flex-1 min-h-0 flex flex-col items-center justify-center cursor-pointer transition ${
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
            <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </div>
        )
      ) : (
        <textarea
          value={state.text}
          onChange={e => onChange({ ...state, mode: 'text', text: e.target.value, file: null })}
          placeholder="Dán nội dung vào đây..."
          className="input-field flex-1 min-h-0 resize-none text-sm overflow-y-auto"
        />
      )}
    </div>
  )
}

function AnalysisProgressPanel({ progress }: { progress: number }) {
  const steps = ANALYSIS_PROGRESS_STEPS
  return (
    <div className="bg-ns-card border border-ns rounded-2xl p-5 shadow-card h-full min-h-0 flex flex-col overflow-hidden animate-fade-in">
      <h3 className="font-heading font-semibold text-ns-primary text-sm mb-1 shrink-0">Tiến hành phân tích</h3>
      <p className="text-ns-faint text-xs mb-4 shrink-0">AI đang xử lý CV của bạn...</p>

      <div className="mb-4 shrink-0">
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

      <ol className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
        {steps.map((label, index) => {
          const status = getAnalysisStepStatus(index, progress, steps.length)
          return (
            <li
              key={label}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all duration-300 ${
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
  jdMinExpUnit, setJdMinExpUnit, jdMinExpValue, setJdMinExpValue,
  canStart, onAnalyze,
}: {
  company: string; setCompany: (v: string) => void
  industry: string; setIndustry: (v: string) => void
  industryOther: string; setIndustryOther: (v: string) => void
  role: string; setRole: (v: string) => void
  roleOther: string; setRoleOther: (v: string) => void
  roles: string[]
  jdMinExpUnit: ExperienceUnit; setJdMinExpUnit: (v: ExperienceUnit) => void
  jdMinExpValue: string; setJdMinExpValue: (v: string) => void
  canStart: boolean
  onAnalyze: () => void
}) {
  const handleMinExpInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    setJdMinExpValue(digits.replace(/^0+(?=\d)/, ''))
  }

  return (
    <div className="bg-ns-card border border-ns rounded-2xl p-5 shadow-card h-full min-h-0 flex flex-col overflow-hidden animate-slide-up">
      <h3 className="font-heading font-semibold text-ns-primary text-sm shrink-0 mb-4">Cấu hình phân tích</h3>
      <div className="flex-1 min-h-0 flex flex-col justify-center gap-3.5">
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
          <label className="text-ns-secondary text-xs font-medium block mb-1.5">Vị trí ứng tuyển *</label>
          {!industry ? (
            <input
              value={roleOther}
              onChange={e => setRoleOther(e.target.value)}
              className="input-field text-sm py-2"
              placeholder="VD: Data Engineer, Business Analyst..."
            />
          ) : (
            <>
              <div className="relative">
                <select value={role} onChange={e => setRole(e.target.value)} className="input-field appearance-none pr-9 cursor-pointer text-sm py-2">
                  <option value="">-- Chọn vị trí --</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  <option value="__other__">Khác...</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-faint pointer-events-none" />
              </div>
              {role === '__other__' && (
                <input value={roleOther} onChange={e => setRoleOther(e.target.value)} className="input-field mt-2 text-sm py-2" placeholder="Nhập vị trí cụ thể" />
              )}
            </>
          )}
        </div>
        <div>
          <label className="text-ns-secondary text-xs font-medium block mb-1.5">
            Thời gian kinh nghiệm làm việc tối thiểu
            <span className="text-ns-faint font-normal"> (tùy chọn)</span>
          </label>
          <div className="flex gap-2">
            <div className="relative w-[88px] shrink-0">
              <select
                value={jdMinExpUnit}
                onChange={e => setJdMinExpUnit(e.target.value as ExperienceUnit)}
                className="input-field appearance-none pr-7 cursor-pointer text-sm py-2"
              >
                <option value="month">Tháng</option>
                <option value="year">Năm</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ns-faint pointer-events-none" />
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jdMinExpValue}
              onChange={e => handleMinExpInput(e.target.value)}
              className="input-field flex-1 text-sm py-2"
              placeholder={jdMinExpUnit === 'year' ? 'VD: 3' : 'VD: 6'}
            />
          </div>
        </div>
      </div>
      <button type="button" onClick={onAnalyze} disabled={!canStart} className="w-full btn-primary py-2.5 text-sm shrink-0 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
        Bắt đầu phân tích
      </button>
    </div>
  )
}

export default function CVScanPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    user,
    cvFiles,
    addScan,
    addCVFile,
    canScan,
    scansRemaining,
    plan,
    refreshSession,
  } = useApp()

  const [cv, setCv] = useState<PanelState>({ mode: USE_API ? 'text' : 'file', file: null, text: '' })
  const [jd, setJd] = useState<PanelState>({ mode: USE_API ? 'text' : 'file', file: null, text: '' })
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [industryOther, setIndustryOther] = useState('')
  const [role, setRole] = useState('')
  const [roleOther, setRoleOther] = useState('')
  const [jdMinExpUnit, setJdMinExpUnit] = useState<ExperienceUnit>('month')
  const [jdMinExpValue, setJdMinExpValue] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const pollController = useRef<AbortController | null>(null)

  useEffect(() => () => pollController.current?.abort(), [])

  const quotaBlocked = plan.type === 'free' && !canScan()
  const roles = industry && industry !== '__other__' ? (ROLES_BY_INDUSTRY[industry] ?? []) : []
  const finalIndustry = industry === '__other__' ? industryOther : industry
  const resolvedRole = !industry
    ? roleOther.trim()
    : role === '__other__'
      ? roleOther.trim()
      : role.trim()
  const hasCv = !!(cv.file || cv.text.trim())
  const hasJd = !!(jd.file || jd.text.trim())
  const canStart = hasCv && hasJd && company.trim().length > 0 && resolvedRole.length > 0

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

  const handleAnalyze = async () => {
    if (!hasCv) { toast.error('Thiếu CV', 'Vui lòng tải file hoặc dán nội dung CV'); return }
    if (!hasJd) { toast.error('Thiếu JD', 'Vui lòng tải file hoặc dán nội dung JD'); return }
    if (!company.trim()) { toast.error('Thiếu tên công ty', 'Vui lòng nhập tên công ty để đặt tên kết quả'); return }
    if (!resolvedRole) { toast.error('Thiếu vị trí', 'Vui lòng chọn hoặc nhập vị trí ứng tuyển — tên này sẽ ghi vào kết quả quét CV'); return }
    if (!canScan()) {
      toast.warning('Hết lượt scan miễn phí', 'Nâng cấp Premium để phân tích CV không giới hạn')
      return
    }

    const cvInput = buildDocInput(cv)
    const jdInput = buildDocInput(jd)
    if (USE_API) {
      const cvLength = cvInput.textContent?.trim().length ?? 0
      const jdLength = jdInput.textContent?.trim().length ?? 0
      if (cvLength > 100_000 || jdLength > 100_000) {
        toast.error('Nội dung quá dài', 'CV và JD phải ngắn hơn 100.000 ký tự')
        return
      }
      if ((cv.file?.size ?? 0) > 5 * 1024 * 1024 || (jd.file?.size ?? 0) > 5 * 1024 * 1024) {
        toast.error('File quá lớn', 'Mỗi file PDF/DOCX phải nhỏ hơn hoặc bằng 5 MB')
        return
      }
    } else {
      const docCheck = validateScanDocuments(cvInput, jdInput)
      if (!docCheck.ok) {
        toast.error(docCheck.errorTitle ?? 'Tài liệu không hợp lệ', docCheck.errorMessage ?? '')
        return
      }
    }

    if (cv.file && user) {
      addCVFile({
        id: `cvf_${Date.now()}`, userId: user.id, fileName: cv.file.name,
        fileSize: cv.file.size, mimeType: cv.file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      })
    }

    setAnalyzing(true)
    setProgress(0)
    
    const config: ScanConfig = {
      company: company.trim(),
      industry: finalIndustry || undefined,
      role: resolvedRole,
      ...(jdMinExpValue
        ? {
            jdMinExperience: Number(jdMinExpValue),
            jdMinExperienceUnit: jdMinExpUnit,
          }
        : {}),
    }

    if (USE_API) {
      try {
        pollController.current?.abort()
        pollController.current = new AbortController()
        const scan = await createScan({
          cv: cvInput,
          jd: jdInput,
          config,
          cvFile: cv.file ?? undefined,
          jdFile: jd.file ?? undefined,
        })
        await runScan(scan.id)
        await refreshSession().catch(() => undefined)
        const analysisId = await pollScanUntilDone(scan.id, (data) => {
          setProgress(data.progressPercent)
        }, { signal: pollController.current.signal })
        setAnalyzing(false)
        toast.success('Phân tích hoàn tất', 'Coverage Score đã được tạo bởi AI')
        navigate(`/analysis/${analysisId}`)
      } catch (e: any) {
        setAnalyzing(false)
        toast.error('Lỗi khi phân tích bằng AI', e.message || 'Không thể kết nối API')
      }
      return
    }

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
      const scanId = `scan_${Date.now()}`
      const result = generateMockResult(scanId, config, cvInput, jdInput)
      const record: ScanRecord = {
        id: scanId, userId: user!.id, title: buildScanTitle(resolvedRole, company.trim()),
        role: resolvedRole, company: company.trim(), overallScore: result.scores.overall,
        analyzedAt: new Date().toISOString(), cvInput, jdInput, config, result,
      }
      addScan(record)
      setAnalyzing(false)
      toast.success('Phân tích hoàn tất', 'Coverage Score mock đã được tạo')
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

        <div className="flex flex-col lg:flex-row lg:gap-6 mt-6 lg:h-[580px]">
          <div className="lg:flex-[2] grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 h-[580px] lg:h-full">
            <div className="h-full min-h-0 flex flex-col">
              <DualInputPanel
                title="CV của bạn"
                subtitle="Bắt buộc - tải PDF/DOCX hoặc dán nội dung CV"
                state={cv}
                onChange={setCv}
                allowTextMode={USE_API}
                textDisabledHint="Phát triển sau"
              />
            </div>
            <div className="h-full min-h-0 flex flex-col">
              <DualInputPanel
                title="Mô tả công việc (JD)"
                subtitle="Bắt buộc - tải PDF/DOCX hoặc dán nội dung JD"
                state={jd}
                onChange={setJd}
              />
            </div>
          </div>
          <div className="lg:flex-[1] h-[580px] lg:h-full min-h-0 flex flex-col mt-6 lg:mt-0">
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
                jdMinExpUnit={jdMinExpUnit}
                setJdMinExpUnit={setJdMinExpUnit}
                jdMinExpValue={jdMinExpValue}
                setJdMinExpValue={setJdMinExpValue}
                canStart={canStart}
                onAnalyze={handleAnalyze}
              />
            )}
          </div>
        </div>

        {!USE_API && cvFiles.length > 0 && (
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
