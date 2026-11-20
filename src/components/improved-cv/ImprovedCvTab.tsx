import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Download, Loader2, Printer, RefreshCw, Sparkles } from 'lucide-react'
import ChangeItem from './ChangeItem'
import CvRenderer from '../cv-builder/CvRenderer'
import { CV_TEMPLATES } from '../../data/cvTemplates'
import { USE_API } from '../../lib/config'
import { downloadCvRevisionDocx, getCvRevision, retryCvRevision, saveCvDecisions } from '../../lib/api/cvRevision'
import { applyChanges, defaultDecisions, hasPlaceholder, keywordCoverage, normalizeCv } from '../../lib/cvStructured'
import { useToast } from '../../contexts/ToastContext'
import type { CVAnalysisResult } from '../../types'
import type { CvDecision, CvRevisionResponse } from '../../types/cvStructured'

const POLL_MS = 3000
const POLL_MAX_MS = 120_000

export default function ImprovedCvTab({ analysisId, result, localRevision }: {
  analysisId: string
  result: CVAnalysisResult
  localRevision?: CvRevisionResponse
}) {
  const toast = useToast()
  const [data, setData] = useState<CvRevisionResponse | null>(USE_API ? null : localRevision ?? { status: 'unavailable' } as CvRevisionResponse)
  const [decisions, setDecisions] = useState<Record<string, CvDecision>>(() =>
    !USE_API && localRevision ? defaultDecisions(localRevision.changes) : {})
  const [templateId, setTemplateId] = useState<string | null>(localRevision?.templateId ?? null)
  const [dirty, setDirty] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!USE_API) return
    const ctrl = new AbortController()
    let timer: number | undefined
    const started = Date.now()
    setTimedOut(false)
    const load = async () => {
      const r = await getCvRevision(analysisId, ctrl.signal).catch(() => null)
      if (!r || ctrl.signal.aborted) return
      const normalized = r.originalStructured ? { ...r, originalStructured: normalizeCv(r.originalStructured) } : r
      setData(normalized)
      setTemplateId(r.templateId)
      if (r.status === 'completed') {
        setDecisions(Object.keys(r.decisions ?? {}).length ? r.decisions : defaultDecisions(r.changes))
      }
      if (r.status === 'pending') {
        if (Date.now() - started < POLL_MAX_MS) timer = window.setTimeout(load, POLL_MS)
        else setTimedOut(true)
      }
    }
    load()
    return () => { ctrl.abort(); window.clearTimeout(timer) }
  }, [analysisId, reloadKey])

  useEffect(() => {
    if (!dirty || !USE_API) return
    const t = window.setTimeout(() => {
      saveCvDecisions(analysisId, decisions, templateId ?? undefined)
        .then(() => setDirty(false))
        .catch(() => toast.error('Chưa lưu được', 'Không thể lưu lựa chọn của bạn, sẽ thử lại khi bạn thay đổi tiếp.'))
    }, 800)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions, templateId, dirty, analysisId])

  const finalCv = useMemo(
    () => (data?.originalStructured ? applyChanges(data.originalStructured, data.changes, decisions) : null),
    [data, decisions],
  )
  const appliedPaths = useMemo(() => new Set(
    Object.entries(decisions)
      .filter(([, d]) => d.state !== 'rejected')
      .map(([cid]) => data?.changes.find(c => c.id === cid)?.path)
      .filter((p): p is string => !!p),
  ), [decisions, data])

  const keywords = useMemo(
    () => [...(result.keywords?.matched ?? []), ...(result.keywords?.missing ?? [])],
    [result],
  )

  if (!data || data.status === 'pending') {
    return (
      <div className="bg-ns-card border border-ns rounded-2xl p-10 text-center shadow-card">
        {timedOut ? (
          <>
            <AlertCircle size={28} className="text-amber-500 mx-auto mb-3" />
            <p className="text-ns-primary font-medium mb-1">AI vẫn đang xử lý</p>
            <p className="text-ns-muted text-sm mb-4">Việc chỉnh sửa CV mất nhiều thời gian hơn dự kiến.</p>
            <button type="button" onClick={() => setReloadKey(k => k + 1)} className="btn-primary text-sm inline-flex items-center gap-2"><RefreshCw size={14} /> Kiểm tra lại</button>
          </>
        ) : (
          <>
            <Loader2 size={28} className="text-blue-400 mx-auto mb-3 animate-spin" />
            <p className="text-ns-primary font-medium mb-1">AI đang chỉnh sửa CV của bạn…</p>
            <p className="text-ns-muted text-sm">Thường mất 20–40 giây. Trang sẽ tự cập nhật.</p>
          </>
        )}
      </div>
    )
  }

  const retry = async () => {
    try {
      await retryCvRevision(analysisId)
      setData(d => (d ? { ...d, status: 'pending' } : d))
      setReloadKey(k => k + 1)
    } catch {
      toast.error('Không thể thử lại', 'Vui lòng thử lại sau ít phút.')
    }
  }

  if (data.status === 'unavailable' || data.status === 'failed') {
    return (
      <div className="bg-ns-card border border-ns rounded-2xl p-10 text-center shadow-card">
        <AlertCircle size={28} className="text-ns-faint mx-auto mb-3" />
        <p className="text-ns-primary font-medium mb-1">
          {data.status === 'failed' ? 'Chưa tạo được CV hoàn thiện' : 'Báo cáo này chưa có CV hoàn thiện'}
        </p>
        <p className="text-ns-muted text-sm mb-4">
          {data.status === 'failed' ? 'AI gặp lỗi khi chỉnh sửa CV. Kết quả phân tích vẫn được giữ nguyên.' : 'Bạn có thể yêu cầu AI tạo CV hoàn thiện từ kết quả phân tích này.'}
        </p>
        {USE_API && <button type="button" onClick={retry} className="btn-primary text-sm inline-flex items-center gap-2"><Sparkles size={14} /> {data.status === 'failed' ? 'Thử lại' : 'Tạo CV hoàn thiện'}</button>}
      </div>
    )
  }

  const decide = (cid: string, d: CvDecision) => { setDecisions(s => ({ ...s, [cid]: d })); setDirty(true) }
  const acceptSafe = () => { setDecisions(s => ({ ...defaultDecisions(data.changes), ...s })); setDirty(true) }
  const before = data.originalStructured ? keywordCoverage(data.originalStructured, keywords) : null
  const after = finalCv ? keywordCoverage(finalCv, keywords) : null
  const acceptedCount = Object.values(decisions).filter(d => d.state !== 'rejected').length
  const pendingConfirm = data.changes.filter(c => c.needsUserConfirmation && !decisions[c.id]).length
  const unresolved = data.changes.some(c => {
    const d = decisions[c.id]
    return d && d.state !== 'rejected' && hasPlaceholder(d.state === 'edited' ? d.value : c.after)
  })

  const download = async () => {
    if (!USE_API) { toast.info('Chế độ demo', 'Tải DOCX cần kết nối API. Bạn có thể dùng "In / Lưu PDF".'); return }
    setDownloading(true)
    try {
      if (dirty) { await saveCvDecisions(analysisId, decisions, templateId ?? undefined); setDirty(false) }
      const { unresolved: n } = await downloadCvRevisionDocx(analysisId)
      if (n > 0) toast.warning('Đã bỏ nội dung chưa hoàn thiện', `${n} dòng còn "[Bổ sung nếu có...]" đã được loại khỏi file.`)
    } catch (e) {
      toast.error('Không tải được file', e instanceof Error && e.message === 'PLAN_REQUIRED' ? 'Tính năng này cần gói trả phí.' : 'Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="min-w-0 space-y-3">
        <div className="bg-ns-card border border-ns rounded-xl p-3 flex flex-wrap items-center gap-2 no-print">
          <select value={templateId ?? 'ats-classic'} onChange={e => { setTemplateId(e.target.value); setDirty(true) }}
            className="input-field text-xs py-1.5 !w-auto cursor-pointer" aria-label="Mẫu CV">
            {CV_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button type="button" onClick={download} disabled={downloading}
            className="text-xs px-3 py-1.5 rounded-lg border border-ns text-ns-secondary hover:bg-ns-raised inline-flex items-center gap-1 cursor-pointer disabled:opacity-50">
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Tải DOCX
          </button>
          <button type="button" onClick={() => window.print()}
            className="text-xs px-3 py-1.5 rounded-lg border border-ns text-ns-secondary hover:bg-ns-raised inline-flex items-center gap-1 cursor-pointer">
            <Printer size={13} /> In / Lưu PDF
          </button>
          {before && after && before.total > 0 && (
            <span className="ml-auto text-xs text-ns-muted">
              Từ khóa JD: <b className="text-ns-secondary">{before.hit}/{before.total}</b> → <b className="text-green-500">{after.hit}/{after.total}</b>
            </span>
          )}
        </div>
        {unresolved && (
          <p className="text-xs text-orange-500 flex items-center gap-1"><AlertCircle size={13} /> Còn nội dung "[Bổ sung nếu có...]" chưa sửa. Dòng đó sẽ bị bỏ khi tải về.</p>
        )}
        {finalCv && <CvRenderer cv={finalCv} templateId={templateId} highlightPaths={appliedPaths} />}
      </div>

      <aside className="space-y-3 lg:max-h-[85vh] lg:overflow-y-auto lg:pr-1 no-print">
        <div className="bg-ns-card border border-ns rounded-xl p-3">
          <p className="text-ns-primary text-sm font-medium">{data.changes.length} đề xuất chỉnh sửa</p>
          <p className="text-ns-faint text-xs mt-0.5">
            Đã áp dụng {acceptedCount}{pendingConfirm > 0 ? ` · ${pendingConfirm} cần bạn xác nhận` : ''}
          </p>
          {data.changes.some(c => !c.needsUserConfirmation && !decisions[c.id]) && (
            <button type="button" onClick={acceptSafe} className="mt-2 text-xs text-blue-500 hover:underline cursor-pointer">Chấp nhận tất cả thay đổi an toàn</button>
          )}
        </div>
        {data.changes.length === 0 && (
          <p className="text-ns-muted text-sm bg-ns-card border border-ns rounded-xl p-4">AI không tìm thấy chỉnh sửa nào cần thiết cho CV này.</p>
        )}
        {data.changes.map(ch => (
          <ChangeItem key={ch.id} change={ch} decision={decisions[ch.id]} cv={data.originalStructured} onDecide={d => decide(ch.id, d)} />
        ))}
        {data.limitations.length > 0 && (
          <div className="bg-ns-card border border-ns rounded-xl p-3">
            <p className="text-ns-secondary text-xs font-medium mb-1">Lưu ý</p>
            <ul className="list-disc pl-4 text-xs text-ns-muted space-y-0.5">
              {data.limitations.map(l => <li key={l}>{l}</li>)}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
