import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, Loader2, Lock, History, Check, Circle } from 'lucide-react'
import { ROLES_BY_INDUSTRY } from '../constants'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { generateMockResult } from '../data/mockAnalysis'
import { generateMockRevision } from '../data/mockCvRevision'
import { mockJdText } from '../data/mockJdSuggestions'
import { buildScanTitle, formatDateTime, formatFileSize } from '../lib/utils'
import { USE_API } from '../lib/config'
import { ApiError } from '../lib/api/client'
import { createScan, runScan, pollScanUntilDone } from '../lib/api/scans'
import { getJdAvailability, searchJds, type JdSuggestion } from '../lib/api/jdSuggestions'
import { validateScanDocuments } from '../lib/cvJdMatch'
import { isCvEmpty } from '../lib/cvStructured'
import { ANALYSIS_PROGRESS_STEPS, getAnalysisStepStatus } from '../lib/analysisProgress'
import { toMinExperienceMonths } from '../lib/experienceContract'
import CvBuilderModal from '../components/cv-builder/CvBuilderModal'
import SourceSwitch, { type SourceOption } from '../components/scan/SourceSwitch'
import TemplateSourceCard from '../components/scan/TemplateSourceCard'
import ExtraInfoPanel from '../components/scan/ExtraInfoPanel'
import AutoJdPanel, { type AutoJdState } from '../components/scan/AutoJdPanel'
import type { CVFileRecord, DocumentInput, ExperienceUnit, ScanConfig, ScanRecord } from '../types'
import type { CvStructured } from '../types/cvStructured'

type CvMode = 'file' | 'text' | 'template'
type JdMode = 'file' | 'text' | 'auto'

interface CvPanelState {
  mode: CvMode
  file: File | null
  text: string
  structured: CvStructured | null
  templateId: string | null
  selectedFileId?: string
}

interface JdPanelState {
  mode: JdMode
  file: File | null
  text: string
  posting: JdSuggestion | null
}

function SourcePanel({ title, subtitle, switcher, children }: {
  title: string
  subtitle: string
  switcher: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-ns-card border border-ns rounded-2xl p-5 flex flex-col h-full min-h-0 overflow-hidden shadow-card animate-slide-up">
      <h3 className="font-heading font-semibold text-ns-primary mb-1 shrink-0">{title}</h3>
      <p className="text-ns-faint text-xs mb-4 shrink-0">{subtitle}</p>
      {switcher}
      {children}
    </div>
  )
}

function FileOrTextBody({ mode, file, text, onFile, onClearFile, onText }: {
  mode: 'file' | 'text'
  file: File | null
  text: string
  onFile: (file: File) => void
  onClearFile: () => void
  onText: (text: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f: File | undefined) => {
    if (!f) return
    const lowerName = f.name.toLowerCase()
    const ok = f.type === 'application/pdf' || lowerName.endsWith('.pdf') || lowerName.endsWith('.docx')
    if (ok) onFile(f)
  }

  if (mode === 'text') {
    return (
      <textarea
        value={text}
        onChange={e => onText(e.target.value)}
        placeholder="Dán nội dung vào đây..."
        className="input-field flex-1 min-h-0 resize-none text-sm overflow-y-auto"
      />
    )
  }
  if (file) {
    return (
      <div className="flex items-start gap-3 p-4 bg-ns-page rounded-xl border border-ns flex-1 min-h-0 overflow-hidden">
        <FileText size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-ns-primary text-sm truncate" title={file.name}>{file.name}</p>
          <p className="text-ns-faint text-xs mt-1">{formatFileSize(file.size)}</p>
        </div>
        <button type="button" onClick={onClearFile} aria-label="Bỏ file" className="text-ns-faint hover:text-red-400 cursor-pointer shrink-0">
          <X size={16} />
        </button>
      </div>
    )
  }
  return (
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

  const [cv, setCv] = useState<CvPanelState>({ mode: USE_API ? 'text' : 'file', file: null, text: '', structured: null, templateId: null })
  const [jd, setJd] = useState<JdPanelState>({ mode: USE_API ? 'text' : 'file', file: null, text: '', posting: null })
  const [builderOpen, setBuilderOpen] = useState(false)
  const [autoJdEnabled, setAutoJdEnabled] = useState(true)
  const [autoState, setAutoState] = useState<AutoJdState>({ kind: 'idle' })
  const [searchedCvKey, setSearchedCvKey] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [industryOther, setIndustryOther] = useState('')
  const [role, setRole] = useState('')
  const [roleOther, setRoleOther] = useState('')
  const [location, setLocation] = useState('')
  const [jdMinExpUnit, setJdMinExpUnit] = useState<ExperienceUnit>('month')
  const [jdMinExpValue, setJdMinExpValue] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const pollController = useRef<AbortController | null>(null)

  useEffect(() => () => pollController.current?.abort(), [])
  useEffect(() => {
    let alive = true
    getJdAvailability().then(enabled => { if (alive) setAutoJdEnabled(enabled) })
    return () => { alive = false }
  }, [])

  const quotaBlocked = plan.type === 'free' && !canScan()
  const roles = industry && industry !== '__other__' ? (ROLES_BY_INDUSTRY[industry] ?? []) : []
  const finalIndustry = industry === '__other__' ? industryOther : industry
  const resolvedRole = !industry
    ? roleOther.trim()
    : role === '__other__'
      ? roleOther.trim()
      : role.trim()

  const hasCv =
    cv.mode === 'file' ? !!cv.file
      : cv.mode === 'text' ? !!cv.text.trim()
        : !!cv.structured && !isCvEmpty(cv.structured)
  const hasJd =
    jd.mode === 'file' ? !!jd.file
      : jd.mode === 'text' ? !!jd.text.trim()
        : !!jd.posting
  const canStart = hasCv && hasJd
  const isAuto = jd.mode === 'auto'
  const showExtra = isAuto && !analyzing

  // Identity of the current CV, used to flag stale JD suggestions.
  const cvKey = useMemo(() => {
    if (cv.mode === 'file') return cv.file ? `f:${cv.file.name}:${cv.file.size}` : ''
    if (cv.mode === 'text') return `t:${cv.text.length}:${cv.text.slice(0, 64)}`
    return cv.structured ? `s:${JSON.stringify(cv.structured).length}` : ''
  }, [cv])
  const stale = autoState.kind === 'results' && searchedCvKey !== null && searchedCvKey !== cvKey

  const minExperienceMonths = jdMinExpValue ? toMinExperienceMonths(Number(jdMinExpValue), jdMinExpUnit) : undefined

  const handleSearchJd = async () => {
    if (!hasCv) { toast.error('Thiếu CV', 'Thêm CV trước khi tìm JD'); return }
    setAutoState({ kind: 'loading' })
    setJd(s => ({ ...s, posting: null }))
    try {
      const data = await searchJds({
        cvFile: cv.mode === 'file' ? cv.file ?? undefined : undefined,
        cvText: cv.mode === 'text' ? cv.text : undefined,
        cvStructured: cv.mode === 'template' ? cv.structured ?? undefined : undefined,
        company, industry: finalIndustry, role: resolvedRole, location, minExperienceMonths,
      })
      setSearchedCvKey(cvKey)
      if (data.status === 'disabled') {
        setAutoJdEnabled(false)
        setAutoState({ kind: 'idle' })
        setJd(s => ({ ...s, mode: 'file' }))
        toast.warning('Tạm tắt', 'Tính năng tự tìm JD đang tạm tắt. Vui lòng tải JD lên.')
        return
      }
      setAutoState(data.items.length ? { kind: 'results', data } : { kind: 'empty' })
    } catch (e) {
      const message = e instanceof ApiError && e.status === 429
        ? 'Bạn đã tìm quá nhiều lần, vui lòng thử lại sau ít phút.'
        : 'Không thể tìm JD lúc này. Vui lòng thử lại.'
      setAutoState({ kind: 'error', message })
    }
  }

  const buildCvInput = (): DocumentInput => {
    if (cv.mode === 'file' && cv.file) {
      return { mode: 'file', fileName: cv.file.name, fileSize: cv.file.size, mimeType: cv.file.type || undefined }
    }
    if (cv.mode === 'template' && cv.structured) {
      return { mode: 'template', structured: cv.structured, templateId: cv.templateId ?? undefined }
    }
    return { mode: 'text', textContent: cv.text }
  }

  const buildJdInput = (): DocumentInput => {
    if (jd.mode === 'file' && jd.file) {
      return { mode: 'file', fileName: jd.file.name, fileSize: jd.file.size, mimeType: jd.file.type || undefined }
    }
    if (jd.mode === 'auto' && jd.posting) {
      return {
        mode: 'auto',
        sourcePostingId: jd.posting.postingId,
        textContent: USE_API ? jd.posting.excerpt : mockJdText(jd.posting),
      }
    }
    return { mode: 'text', textContent: jd.text }
  }

  const selectHistoryFile = (record: CVFileRecord) => {
    const mockFile = new File([''], record.fileName, { type: record.mimeType })
    Object.defineProperty(mockFile, 'size', { value: record.fileSize })
    setCv(s => ({ ...s, mode: 'file', file: mockFile, text: '', selectedFileId: record.id }))
  }

  const handleAnalyze = async () => {
    if (!hasCv) { toast.error('Thiếu CV', 'Vui lòng tải file, dán nội dung hoặc tạo CV từ template'); return }
    if (!hasJd) {
      toast.error('Thiếu JD', isAuto ? 'Hãy chọn một JD từ kết quả tìm kiếm' : 'Vui lòng tải file hoặc dán nội dung JD')
      return
    }
    if (!canScan()) {
      toast.warning('Hết lượt scan tháng này', 'Bạn có thể tiếp tục khi quota được làm mới. Xem trang gói dịch vụ để biết các lựa chọn hiện có.')
      return
    }

    const cvInput = buildCvInput()
    const jdInput = buildJdInput()
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
    } else if (cvInput.mode !== 'template' && jdInput.mode !== 'auto') {
      const docCheck = validateScanDocuments(cvInput, jdInput)
      if (!docCheck.ok) {
        toast.error(docCheck.errorTitle ?? 'Tài liệu không hợp lệ', docCheck.errorMessage ?? '')
        return
      }
    }

    if (cv.mode === 'file' && cv.file && user) {
      addCVFile({
        id: `cvf_${Date.now()}`, userId: user.id, fileName: cv.file.name,
        fileSize: cv.file.size, mimeType: cv.file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      })
    }

    setAnalyzing(true)
    setProgress(0)

    // Extra info is only used (and sent) in auto-JD mode.
    const config: ScanConfig = isAuto
      ? {
          company: company.trim(),
          industry: finalIndustry || undefined,
          role: resolvedRole || undefined,
          location: location.trim() || undefined,
          ...(minExperienceMonths !== undefined
            ? { jdMinExperience: Number(jdMinExpValue), jdMinExperienceUnit: jdMinExpUnit, minExperienceMonths }
            : {}),
        }
      : { company: '' }
    const displayRole = config.role || jd.posting?.title || 'Phân tích CV'
    const displayCompany = config.company || jd.posting?.company || ''

    if (USE_API) {
      try {
        pollController.current?.abort()
        pollController.current = new AbortController()
        const searchContext = isAuto && autoState.kind === 'results' && autoState.data.profile
          ? { profile: autoState.data.profile, hints: { company: config.company, industry: config.industry, role: config.role, location: config.location } }
          : undefined
        const scan = await createScan({
          cv: cvInput,
          jd: jdInput,
          config,
          cvFile: cv.mode === 'file' ? cv.file ?? undefined : undefined,
          jdFile: jd.mode === 'file' ? jd.file ?? undefined : undefined,
          searchContext,
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
      const mockConfig: ScanConfig = { ...config, role: config.role || jd.posting?.title, company: displayCompany }
      const result = generateMockResult(scanId, mockConfig, cvInput, jdInput)
      const record: ScanRecord = {
        id: scanId, userId: user!.id, title: buildScanTitle(displayRole, displayCompany || 'Unknown'),
        role: displayRole, company: displayCompany, overallScore: result.scores.overall,
        analyzedAt: new Date().toISOString(), cvInput, jdInput, config: mockConfig, result,
        cvRevision: generateMockRevision(cv.mode === 'template' ? cv.structured ?? undefined : undefined, result, cv.templateId ?? undefined),
      }
      addScan(record)
      setAnalyzing(false)
      toast.success('Phân tích hoàn tất', 'Coverage Score mock đã được tạo')
      navigate(`/analysis/${scanId}`)
    }, 2800)
  }

  const cvOptions: SourceOption<CvMode>[] = [
    { value: 'file', label: 'Tải file' },
    { value: 'text', label: 'Dán nội dung', disabled: !USE_API, hint: 'Phát triển sau' },
    { value: 'template', label: 'Dùng template' },
  ]
  const jdOptions: SourceOption<JdMode>[] = [
    { value: 'file', label: 'Tải file' },
    { value: 'text', label: 'Dán nội dung' },
    ...(autoJdEnabled ? [{ value: 'auto' as const, label: 'Web tự tìm' }] : []),
  ]

  const actionHint = !hasCv
    ? 'Thêm CV để bắt đầu'
    : !hasJd
      ? (isAuto ? 'Chọn một JD từ kết quả tìm kiếm' : 'Thêm JD để bắt đầu')
      : 'Sẵn sàng phân tích'

  return (
    <div className="relative p-6 max-w-7xl mx-auto space-y-6">
      <div className={quotaBlocked ? 'blur-sm pointer-events-none select-none' : ''}>
        <div className="animate-fade-in">
          <h2 className="font-heading font-bold text-ns-primary text-2xl">Phân tích CV</h2>
          <p className="text-ns-muted text-sm mt-1">
            Tải, dán hoặc tạo CV từ template · Còn {scansRemaining()} lượt scan tháng này
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-6 mt-6 ${showExtra || analyzing ? 'lg:grid-cols-[1fr_1fr_320px]' : 'lg:grid-cols-2'}`}>
          <div className="h-[580px] min-h-0 flex flex-col">
            <SourcePanel
              title="CV của bạn"
              subtitle="Bắt buộc · tải PDF/DOCX, dán nội dung hoặc tạo từ template"
              switcher={<SourceSwitch value={cv.mode} options={cvOptions} onChange={mode => setCv(s => ({ ...s, mode }))} />}
            >
              {cv.mode === 'template' ? (
                <TemplateSourceCard
                  structured={cv.structured}
                  templateId={cv.templateId}
                  onOpen={() => setBuilderOpen(true)}
                  onClear={() => setCv(s => ({ ...s, structured: null }))}
                />
              ) : (
                <FileOrTextBody
                  mode={cv.mode}
                  file={cv.file}
                  text={cv.text}
                  onFile={file => setCv(s => ({ ...s, file, selectedFileId: undefined }))}
                  onClearFile={() => setCv(s => ({ ...s, file: null, selectedFileId: undefined }))}
                  onText={text => setCv(s => ({ ...s, text }))}
                />
              )}
            </SourcePanel>
          </div>

          <div className="h-[580px] min-h-0 flex flex-col">
            <SourcePanel
              title="Mô tả công việc (JD)"
              subtitle={isAuto ? 'Hệ thống tìm JD phù hợp từ dữ liệu tuyển dụng' : 'Bắt buộc · tải PDF/DOCX hoặc dán nội dung JD'}
              switcher={<SourceSwitch value={jd.mode} options={jdOptions} onChange={mode => setJd(s => ({ ...s, mode }))} />}
            >
              {isAuto ? (
                <AutoJdPanel
                  hasCv={hasCv}
                  state={autoState}
                  stale={stale}
                  selectedId={jd.posting?.postingId ?? null}
                  onSearch={handleSearchJd}
                  onSelect={item => setJd(s => ({ ...s, posting: item }))}
                  onUseUpload={() => setJd(s => ({ ...s, mode: 'file' }))}
                />
              ) : (
                <FileOrTextBody
                  mode={jd.mode === 'text' ? 'text' : 'file'}
                  file={jd.file}
                  text={jd.text}
                  onFile={file => setJd(s => ({ ...s, file }))}
                  onClearFile={() => setJd(s => ({ ...s, file: null }))}
                  onText={text => setJd(s => ({ ...s, text }))}
                />
              )}
            </SourcePanel>
          </div>

          {analyzing ? (
            <div className="h-[580px] min-h-0 flex flex-col"><AnalysisProgressPanel progress={progress} /></div>
          ) : showExtra && (
            <div className="lg:h-[580px] min-h-0 flex flex-col animate-slide-up">
              <ExtraInfoPanel
                company={company} setCompany={setCompany}
                industry={industry} setIndustry={setIndustry}
                industryOther={industryOther} setIndustryOther={setIndustryOther}
                role={role} setRole={setRole}
                roleOther={roleOther} setRoleOther={setRoleOther}
                roles={roles}
                location={location} setLocation={setLocation}
                jdMinExpUnit={jdMinExpUnit} setJdMinExpUnit={setJdMinExpUnit}
                jdMinExpValue={jdMinExpValue} setJdMinExpValue={setJdMinExpValue}
                canSearch={hasCv}
                searching={autoState.kind === 'loading'}
                hasResults={autoState.kind === 'results' || autoState.kind === 'empty'}
                onSearch={handleSearchJd}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-ns-card border border-ns rounded-2xl p-4 shadow-card">
          <p className={`text-sm ${canStart ? 'text-green-500' : 'text-ns-muted'}`}>{actionHint}</p>
          <button type="button" onClick={handleAnalyze} disabled={!canStart || analyzing}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2">
            {analyzing && <Loader2 size={15} className="animate-spin" />}
            Bắt đầu phân tích
          </button>
        </div>

        {!USE_API && cv.mode === 'file' && cvFiles.length > 0 && (
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

      <CvBuilderModal
        open={builderOpen}
        initial={cv.structured}
        initialTemplateId={cv.templateId}
        onClose={() => setBuilderOpen(false)}
        onUse={(structured, templateId) => {
          setCv(s => ({ ...s, mode: 'template', structured, templateId }))
          setBuilderOpen(false)
          toast.success('Đã tạo CV', 'CV từ template đã sẵn sàng để phân tích')
        }}
      />

      {quotaBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-ns-card border border-blue-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-blue-400" />
            </div>
            <h3 className="font-heading font-bold text-ns-primary text-xl mb-2">Bạn đã hết lượt scan tháng này</h3>
            <p className="text-ns-muted text-sm mb-6">Gói {plan.type === 'free' ? 'Free' : plan.type === 'vip' ? 'VIP' : 'Premium'} hiện không còn lượt. Quota sẽ được làm mới vào tháng sau.</p>
            <div className="flex flex-col lg:flex-row lg:gap-3">
              <button onClick={() => navigate('/pricing')} className="btn-primary w-full">Xem các gói</button>
              <button onClick={() => navigate('/dashboard')} className="border border-ns text-ns-secondary py-2.5 rounded-xl cursor-pointer hover:bg-ns-raised">Quay lại Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
