import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Building2, CheckCircle, Download, Info, Lock,
  XCircle, AlertCircle, ChevronRight, ExternalLink, RefreshCw,
} from 'lucide-react'
import { METRIC_TOOLTIPS } from '../constants'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import {
  formatDateTime, formatScanDisplayTitle, getMatchColor, getScoreBarColor,
  getScoreLabel,
} from '../lib/utils'
import { FormattedText } from '../components/FormattedText'
import { USE_API } from '../lib/config'
import { getAnalysis, listAnalyses } from '../lib/api/analysis'
import type { AnalysisListItem } from '../lib/api/analysis'
import { ApiError } from '../lib/api/client'
import type { DocumentInput, ScanRecord } from '../types'

type Tab = 'overview' | 'ats' | 'compatibility' | 'improve' | 'jobs' | 'courses'

function MetricTooltip({ label, tooltipKey }: { label: string; tooltipKey: string }) {
  return (
    <span className="inline-flex items-center gap-1 group relative">
      <span>{label}</span>
      <Info size={14} className="text-ns-faint hover:text-blue-400 cursor-help" />
      <span className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block w-56 bg-ns-raised border border-ns rounded-lg px-3 py-2 text-xs text-ns-secondary shadow-lg">
        {METRIC_TOOLTIPS[tooltipKey]}
      </span>
    </span>
  )
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const map = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-slate-500/10 text-ns-muted border-ns',
  }
  const label = { high: 'Ưu tiên cao', medium: 'Trung bình', low: 'Thấp' }
  return <span className={`text-xs border px-2 py-0.5 rounded-full ${map[priority]}`}>{label[priority]}</span>
}

function DocumentPreviewButton({
  label,
  doc,
  onPreview,
}: {
  label: string
  doc: DocumentInput
  onPreview: () => void
}) {
  const summary =
    doc.mode === 'file'
      ? doc.fileName ??
        (doc.textContent
          ? doc.textContent.slice(0, 120) + (doc.textContent.length > 120 ? '...' : '')
          : 'Tài liệu đã tải lên')
      : doc.textContent
        ? doc.textContent.slice(0, 120) + (doc.textContent.length > 120 ? '...' : '')
        : 'Chưa có nội dung'

  return (
    <div className="bg-ns-page border border-ns rounded-xl p-4 flex flex-col h-[140px] min-w-0 overflow-hidden">
      <p className="text-ns-muted text-xs font-semibold uppercase mb-2 shrink-0">{label}</p>
      <p className="text-ns-secondary text-sm flex-1 min-h-0 line-clamp-3 break-all leading-snug" title={summary}>
        {summary}
      </p>
      <button
        onClick={onPreview}
        className="mt-3 text-blue-400 text-sm hover:text-blue-300 cursor-pointer text-left"
      >
        Xem nội dung →
      </button>
    </div>
  )
}

export default function AnalysisDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { scans, isPremium } = useApp()
  const localScan = USE_API ? undefined : scans.find(scan => scan.id === id)
  const [remoteScan, setRemoteScan] = useState<ScanRecord | null>(null)
  const [remoteHistory, setRemoteHistory] = useState<AnalysisListItem[]>([])
  const [loading, setLoading] = useState(USE_API)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [preview, setPreview] = useState<{ title: string; doc: DocumentInput } | null>(null)
  const [docxConfirm, setDocxConfirm] = useState<DocumentInput | null>(null)

  useEffect(() => {
    setActiveTab('overview')
    setPreview(null)
    setDocxConfirm(null)

    if (!USE_API) {
      setLoading(false)
      return
    }
    if (!id) {
      setLoadError('Không tìm thấy kết quả phân tích.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setRemoteScan(null)

    Promise.all([
      getAnalysis(id),
      listAnalyses().catch(error => {
        console.error('Unable to load related analysis history', error)
        return { items: [] }
      }),
    ])
      .then(([detail, history]) => {
        if (cancelled) return
        setRemoteScan(detail)
        setRemoteHistory(history.items)
      })
      .catch(error => {
        console.error('Unable to load analysis detail', error)
        if (cancelled) return
        setLoadError(
          error instanceof ApiError && error.status === 404
            ? 'Không tìm thấy kết quả phân tích.'
            : 'Không thể tải kết quả phân tích. Vui lòng thử lại.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  const scan = USE_API ? remoteScan : localScan

  const premium = isPremium()

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-5" aria-label="Đang tải kết quả phân tích">
        <div className="h-5 w-44 bg-ns-raised rounded animate-pulse" />
        <div className="h-24 bg-ns-card border border-ns rounded-lg animate-pulse" />
        <div className="h-52 bg-ns-card border border-ns rounded-lg animate-pulse" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-ns-card border border-red-500/20 rounded-lg p-10 text-center">
          <AlertCircle size={34} className="text-red-400 mx-auto mb-3" />
          <p className="text-ns-primary font-medium mb-2">Không hiển thị được kết quả</p>
          <p className="text-ns-muted text-sm mb-5">{loadError}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setReloadKey(value => value + 1)}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <RefreshCw size={15} /> Thử lại
            </button>
            <Link to="/analysis" className="text-blue-400 text-sm hover:text-blue-300">
              Quay lại lịch sử
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <p className="text-ns-primary font-medium mb-4">Không tìm thấy kết quả phân tích</p>
        <Link to="/analysis" className="text-blue-400 hover:text-blue-300">← Quay lại danh sách</Link>
      </div>
    )
  }

  const result = scan.result
  const scoreInfo = getScoreLabel(result.scores.overall)
  const matchingScans = (USE_API ? remoteHistory : scans)
    .filter(item => item.id !== scan.id && item.overallScore >= 70)
    .sort((left, right) => {
      if (right.overallScore !== left.overallScore) {
        return right.overallScore - left.overallScore
      }
      return new Date(right.analyzedAt).getTime() - new Date(left.analyzedAt).getTime()
    })

  const openPreview = (title: string, doc: DocumentInput) => {
    if (doc.textContent?.trim()) {
      setPreview({ title, doc })
      return
    }
    if (doc.mode === 'file' && doc.fileName?.endsWith('.docx')) {
      setDocxConfirm(doc)
      return
    }
    if (doc.mode === 'file' && doc.mimeType === 'application/pdf') {
      toast.info('Xem trước PDF', 'Tính năng xem PDF trực tiếp sẽ sớm ra mắt')
      setPreview({ title, doc: { ...doc, textContent: `[Xem trước mock PDF: ${doc.fileName}]\n\nNội dung CV/JD sẽ hiển thị tại đây khi tích hợp backend.` } })
      return
    }
    setPreview({ title, doc })
  }

  const tabs: { key: Tab; label: string; locked?: boolean }[] = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'ats', label: 'Kiểm tra ATS' },
    { key: 'compatibility', label: 'Sự tương thích' },
    { key: 'improve', label: 'Cải thiện' },
    { key: 'jobs', label: 'Công việc phù hợp', locked: !premium },
    { key: 'courses', label: 'Khoá học', locked: !premium },
  ]

  const severityLabel = (s: string) =>
    s === 'high' ? 'Nghiêm trọng' : s === 'medium' ? 'Trung bình' : 'Nhẹ'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-page-in">
      <button
        onClick={() => navigate('/analysis')}
        className="flex items-center gap-2 text-ns-muted hover:text-ns-primary text-sm cursor-pointer"
      >
        <ArrowLeft size={16} /> Danh sách phân tích
      </button>

      <div className="bg-ns-card border border-ns rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-5 shadow-card">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="keep-accent text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-ns-primary font-semibold truncate">{formatScanDisplayTitle(scan.title)}</p>
            <p className="text-ns-faint text-xs">{result.analyzedRole} · {scan.company} · {result.experienceLevel} · {formatDateTime(scan.analyzedAt)}</p>
          </div>
        </div>
        <button
          onClick={() => toast.info('Xuất báo cáo', 'Tính năng sắp ra mắt')}
          className="flex items-center gap-2 border border-ns text-ns-secondary text-sm px-4 py-2 rounded-xl hover:bg-ns-raised transition cursor-pointer"
        >
          <Download size={14} /> Xuất báo cáo
        </button>
      </div>

      <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-shrink-0 text-center">
            <div className="w-36 h-36 rounded-full border-8 border-blue-500/80 flex items-center justify-center bg-ns-page mx-auto shadow-inner">
              <div>
                <span className={`font-heading font-bold text-5xl keep-accent ${scoreInfo.color}`}>{result.scores.overall}</span>
                <span className="text-ns-faint text-base">/100</span>
              </div>
            </div>
            <div className={`mt-3 inline-block px-4 py-1 rounded-full text-sm font-semibold ${scoreInfo.bg} ${scoreInfo.color}`}>
              {scoreInfo.label}
            </div>
          </div>
          <div className="flex-1 w-full grid sm:grid-cols-2 gap-4">
            {[
              { key: 'ats', label: 'Khả năng ATS', value: result.scores.ats },
              { key: 'keyword', label: 'Độ khớp từ khóa', value: result.scores.keyword },
              { key: 'experience', label: 'Phù hợp kinh nghiệm', value: result.scores.experience },
              { key: 'presentation', label: 'Trình bày CV', value: result.scores.presentation },
            ].map(({ key, label, value }) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ns-muted">
                    <MetricTooltip label={label} tooltipKey={key} />
                  </span>
                  <span className="text-ns-primary font-medium">{value}%</span>
                </div>
                <div className="h-2 bg-ns-raised rounded-full">
                  <div className={`h-full ${getScoreBarColor(value)} rounded-full`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-ns-card border border-ns rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === t.key ? 'bg-blue-600 text-white' : 'text-ns-muted hover:text-ns-primary hover:bg-ns-raised'
            }`}
          >
            {t.label}
            {t.locked && <Lock size={11} className="text-yellow-400" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Khả năng ATS', value: result.scores.ats, tile: 'metric-tile-ats' },
              { label: 'Độ khớp từ khóa', value: result.scores.keyword, tile: 'metric-tile-kw' },
              { label: 'Phù hợp kinh nghiệm', value: result.scores.experience, tile: 'metric-tile-exp' },
              { label: 'Trình bày CV', value: result.scores.presentation, tile: 'metric-tile-pres' },
            ].map(({ label, value, tile }) => {
              const info = getScoreLabel(value)
              return (
                <div key={label} className={`metric-tile bg-ns-card border border-ns rounded-2xl p-4 text-center shadow-card ${tile}`}>
                  <p className="text-ns-muted text-xs mb-2 font-medium">{label}</p>
                  <span className={`font-heading font-bold text-2xl keep-accent ${info.color}`}>{value}</span>
                  <span className="text-ns-faint text-sm">/100</span>
                  <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${info.bg} ${info.color}`}>{info.label}</div>
                </div>
              )
            })}
          </div>
          <div className="grid md:grid-cols-2 gap-4 min-w-0">
            <DocumentPreviewButton label="Nội dung CV" doc={scan.cvInput} onPreview={() => openPreview('Nội dung CV', scan.cvInput)} />
            <DocumentPreviewButton label="Nội dung JD" doc={scan.jdInput} onPreview={() => openPreview('Nội dung JD', scan.jdInput)} />
          </div>
          {(result.strengths.length > 0 || result.weaknesses.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              <section className="bg-ns-card border border-green-500/20 rounded-2xl p-5 shadow-card">
                <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} /> Điểm mạnh
                </h3>
                {result.strengths.length > 0 ? (
                  <ul className="space-y-2 text-sm text-ns-secondary">
                    {result.strengths.map((strength, index) => (
                      <li key={`${strength}-${index}`} className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <FormattedText text={strength} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ns-faint text-sm">Chưa có nhận xét.</p>
                )}
              </section>
              <section className="bg-ns-card border border-amber-500/20 rounded-2xl p-5 shadow-card">
                <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} /> Điểm cần cải thiện
                </h3>
                {result.weaknesses.length > 0 ? (
                  <ul className="space-y-2 text-sm text-ns-secondary">
                    {result.weaknesses.map((weakness, index) => (
                      <li key={`${weakness}-${index}`} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        <FormattedText text={weakness} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ns-faint text-sm">Chưa có nhận xét.</p>
                )}
              </section>
            </div>
          )}
          {result.computedExperience && (
            <div className="bg-ns-card border border-ns rounded-2xl p-5 shadow-card">
              <h3 className="font-semibold text-ns-primary mb-3">Kinh nghiệm tự tính từ CV</h3>
              <p className="text-blue-400 font-semibold text-lg mb-1">{result.computedExperience.label}</p>
              {result.computedExperience.relevantMonths != null && (
                <p className="text-ns-muted text-xs mb-4">
                  KN liên quan JD: <span className="text-purple-400 font-medium">{result.computedExperience.relevantLabel}</span>
                  {result.computedExperience.relevantNote && (
                    <span className="block mt-1 text-ns-faint">{result.computedExperience.relevantNote}</span>
                  )}
                </p>
              )}
              <div className="space-y-2">
                {result.computedExperience.timeline.map(entry => (
                  <div key={`${entry.company}-${entry.from}`} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-ns-page rounded-xl text-sm">
                    <div className="min-w-0">
                      <p className="text-ns-primary font-medium truncate">{entry.company}</p>
                      {entry.role && <p className="text-ns-faint text-xs truncate">{entry.role}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-ns-muted">{entry.from} → {entry.to}</p>
                      <p className="text-blue-400 font-medium">{entry.months} tháng</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ats' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card space-y-4 section-panel">
            <div className="text-center pb-4 border-b border-ns-sub">
              <p className="text-ns-muted text-sm mb-2">Điểm ATS</p>
              <span className="font-heading font-bold keep-accent text-blue-400 text-6xl">{result.scores.ats}</span>
              <span className="text-ns-faint">/100</span>
              <p className="text-ns-muted text-xs mt-3">Mức CV vượt qua hệ thống lọc tự động</p>
            </div>
          </div>
          <div className="bg-ns-card border border-ns rounded-2xl p-6 space-y-3 shadow-card">
            <h3 className="font-heading font-semibold text-ns-primary mb-2">Chi tiết kiểm tra ATS</h3>
            {result.atsIssues.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                <p className="text-ns-secondary text-sm">Không phát hiện vấn đề ATS đáng chú ý.</p>
              </div>
            ) : (
              result.atsIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-ns-page rounded-xl">
                  <AlertCircle size={16} className={`flex-shrink-0 mt-0.5 ${
                    issue.severity === 'high' ? 'text-red-400' : issue.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs border border-ns px-2 py-0.5 rounded-full text-ns-muted">{severityLabel(issue.severity)}</span>
                    </div>
                    <p className="text-ns-secondary text-sm">{issue.issue}</p>
                    <p className="text-ns-faint text-xs mt-1">Gợi ý: {issue.fix}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'compatibility' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <span className="keep-accent bg-blue-600/15 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-sm font-semibold">
              Điểm từ khóa: {result.scores.keyword}/100
            </span>
            <span className="keep-accent bg-purple-600/15 text-purple-400 border border-purple-500/20 px-4 py-2 rounded-xl text-sm font-semibold">
              Điểm kinh nghiệm: {result.scores.experience}/100
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-ns-card border border-green-500/20 rounded-2xl p-6 shadow-card">
              <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
                <CheckCircle size={16} /> Đã có ({result.keywords.matched.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.keywords.matched.map(k => (
                  <span key={k} className="keyword-pill-match bg-green-600/10 border border-green-500/20 text-green-400 text-sm px-3 py-1 rounded-full">{k}</span>
                ))}
              </div>
            </div>
            <div className="bg-ns-card border border-red-500/20 rounded-2xl p-6 shadow-card">
              <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
                <XCircle size={16} /> Còn thiếu ({result.keywords.missing.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.keywords.missing.map(k => (
                  <span key={k} className="keyword-pill-miss bg-red-600/10 border border-red-500/20 text-red-400 text-sm px-3 py-1 rounded-full">{k}</span>
                ))}
              </div>
            </div>
          </div>
          {result.suggestedKeywords.length > 0 && (
            <div className="bg-ns-card border border-blue-500/20 rounded-2xl p-6 shadow-card">
              <h3 className="font-semibold text-ns-primary mb-3">Từ khóa nên bổ sung</h3>
              <div className="flex flex-wrap gap-2">
                {result.suggestedKeywords.map(keyword => (
                  <span
                    key={keyword}
                    className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-3 py-1 rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-ns-primary mb-2">Nhận xét về kinh nghiệm</h3>
            {result.computedExperience && (
              <p className="text-ns-muted text-xs mb-3">
                Tổng tự tính: <span className="keep-accent text-blue-400 font-medium">{result.computedExperience.label}</span>
                {result.computedExperience.relevantMonths != null && (
                  <> · KN liên quan JD: <span className="keep-accent text-purple-400 font-medium">{result.computedExperience.relevantLabel}</span></>
                )}
              </p>
            )}
            {result.jdMinExperienceLabel && (
              <p className="text-ns-muted text-xs mb-3">
                Yêu cầu JD tối thiểu: <span className="text-ns-secondary font-medium">{result.jdMinExperienceLabel}</span>
              </p>
            )}
            <p className="text-ns-secondary text-sm leading-relaxed">
              <FormattedText text={result.experienceComment} />
            </p>
          </div>
        </div>
      )}

      {activeTab === 'improve' && (
        <div className="space-y-3">
          {result.improvements.length === 0 ? (
            <div className="bg-ns-card border border-ns rounded-2xl p-8 text-center">
              <p className="text-ns-muted text-sm">Chưa có đề xuất cải thiện.</p>
            </div>
          ) : (
            result.improvements.map((item, i) => (
              <div key={i} className="bg-ns-card border border-ns rounded-2xl p-5 shadow-card">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-ns-primary font-medium">{item.title}</p>
                  <PriorityBadge priority={item.priority} />
                </div>
                <p className="text-ns-muted text-sm">{item.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {(activeTab === 'jobs' || activeTab === 'courses') && !premium && (
        <div className="bg-ns-card border border-blue-500/20 rounded-2xl p-10 text-center shadow-card">
          <Lock size={28} className="text-blue-400 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-ns-primary text-xl mb-2">Tính năng Premium</h3>
          <p className="text-ns-muted text-sm mb-6">
            Nâng cấp Premium để xem {activeTab === 'jobs' ? 'công việc phù hợp' : 'khoá học đề xuất'}
          </p>
          <button onClick={() => navigate('/pricing')} className="btn-primary text-sm">
            Xem gói Premium <ChevronRight size={16} className="inline ml-1" />
          </button>
        </div>
      )}

      {activeTab === 'jobs' && premium && (
        <div className="space-y-6">
          {result.companies && result.companies.length > 0 && (
            <section>
              <h3 className="font-semibold text-ns-primary mb-3">Doanh nghiệp AI đề xuất</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {result.companies.map(company => (
                  <div key={company.name} className="bg-ns-card border border-ns rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-ns-primary font-medium truncate">{company.name}</p>
                        <p className="text-ns-faint text-xs mt-1">
                          {[company.industry, company.size].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className={`font-bold ${getMatchColor(company.match)}`}>
                        {company.match}%
                      </span>
                    </div>
                    {company.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {company.requirements.slice(0, 4).map(requirement => (
                          <span key={requirement} className="text-xs bg-ns-page border border-ns px-2 py-1 rounded-lg text-ns-muted">
                            {requirement}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="font-semibold text-ns-primary mb-3">Kết quả phù hợp khác</h3>
            <div className="space-y-3">
              {matchingScans.length === 0 ? (
                <p className="text-ns-muted text-sm">Chưa có kết quả nào đạt từ 70 điểm trở lên.</p>
              ) : matchingScans.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/analysis/${s.id}`)}
                className="w-full bg-ns-card border border-ns rounded-xl p-5 flex items-center gap-4 hover:border-blue-500/30 transition text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-ns-primary font-medium">{formatScanDisplayTitle(s.title)}</p>
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">Phù hợp với bạn</span>
                  </div>
                  <p className="text-ns-faint text-xs mt-1">{s.role} · {s.company}</p>
                </div>
                <span className={`font-bold ${getMatchColor(s.overallScore)}`}>{s.overallScore}/100</span>
              </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'courses' && premium && (
        <div className="space-y-3">
          {!result.courses || result.courses.length === 0 ? (
            <div className="bg-ns-card border border-ns rounded-2xl p-8 text-center">
              <p className="text-ns-muted text-sm">Chưa có khóa học phù hợp được đề xuất.</p>
            </div>
          ) : result.courses.map(c => (
            <div key={c.title} className="bg-ns-card border border-ns rounded-xl p-5 flex items-start gap-4 shadow-card">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={18} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-ns-primary font-medium">{c.title}</p>
                  <span className="group relative">
                    <Info size={14} className="text-ns-faint hover:text-blue-400 cursor-help" />
                    <span className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block w-64 bg-ns-raised border border-ns rounded-lg px-3 py-2 text-xs text-ns-secondary shadow-lg">
                      {c.reason}
                    </span>
                  </span>
                </div>
                <p className="text-ns-faint text-xs mt-1">{c.platform} · {c.skill} · ⭐ {c.rating}</p>
              </div>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 border border-blue-500/30 text-blue-400 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500/10 cursor-pointer flex-shrink-0"
              >
                Xem khoá học <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl">
            <h3 className="font-heading font-semibold text-ns-primary text-lg mb-4">{preview.title}</h3>
            <div className="flex-1 overflow-y-auto bg-ns-page border border-ns rounded-xl p-4 text-sm text-ns-secondary whitespace-pre-wrap">
              {preview.doc.textContent || preview.doc.fileName || 'Không có nội dung'}
            </div>
            <button
              onClick={() => setPreview(null)}
              className="mt-4 btn-primary text-sm self-end"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {docxConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-heading font-semibold text-ns-primary text-lg mb-2">Tải file DOCX</h3>
            <p className="text-ns-muted text-sm mb-6">
              File DOCX cần tải về để xem. Bạn có muốn tải {docxConfirm.fileName} không?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDocxConfirm(null)} className="border border-ns text-ns-secondary px-4 py-2 rounded-xl cursor-pointer">
                Hủy
              </button>
              <button
                onClick={() => {
                  toast.success('Đã bắt đầu tải file (demo)')
                  setDocxConfirm(null)
                }}
                className="btn-primary text-sm"
              >
                Tải xuống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
