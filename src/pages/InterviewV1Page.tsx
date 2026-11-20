import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Check, Clock3, FileText, Mic, RotateCcw, Send, Square, X } from 'lucide-react'
import { ApiError } from '../lib/api/client'
import { interviewV1, type InterviewAvailability, type InterviewReportV1, type InterviewSessionV1 } from '../lib/api/interviewsV1'

const consentCopy = 'Tôi đồng ý gửi câu trả lời đã xác nhận tới Gemini của Google để tạo câu hỏi và báo cáo. Nếu dùng micro, âm thanh cũng được gửi tới Gemini để chuyển thành chữ; NextStep không lưu âm thanh trong hồ sơ và yêu cầu Google xóa file sau xử lý, còn Google có thể lưu file tạm tối đa 48 giờ. Tôi có thể sửa bản chép lời trước khi xác nhận. Transcript tự xóa sau 24 giờ; báo cáo lưu trong tài khoản và bị xóa khi tôi xóa tài khoản.'
const terminal = new Set(['completed', 'failed', 'abandoned'])
const statusLabels: Record<string, string> = {
  created: 'Đang chuẩn bị câu hỏi',
  preparing: 'Đang chuẩn bị trả lời',
  recording: 'Đang ghi âm',
  transcribing: 'Đang chuyển giọng nói thành chữ',
  awaiting_confirmation: 'Chờ xác nhận câu trả lời',
  preparing_next: 'Đang tạo câu hỏi tiếp theo',
  reporting: 'Đang tạo báo cáo',
  completed: 'Đã hoàn thành',
  failed: 'Phiên gặp lỗi',
  abandoned: 'Đã kết thúc',
}
const difficultyLabels: Record<string, string> = { easy: 'Cơ bản', medium: 'Trung bình', hard: 'Nâng cao' }

export default function InterviewV1Page() {
  const [availability, setAvailability] = useState<InterviewAvailability | null>(null)
  const [sessions, setSessions] = useState<InterviewSessionV1[]>([])
  const [session, setSession] = useState<InterviewSessionV1 | null>(null)
  const [report, setReport] = useState<InterviewReportV1 | null>(null)
  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [consent, setConsent] = useState(false)
  const [draft, setDraft] = useState('')
  const [textFallback, setTextFallback] = useState(false)
  const [textOnly, setTextOnly] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [clock, setClock] = useState(Date.now())
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const stopping = useRef(false)
  const discard = useRef(false)
  const chatList = useRef<HTMLDivElement | null>(null)

  const refresh = useCallback(async () => {
    const [a, s] = await Promise.all([interviewV1.availability(), interviewV1.list()])
    setAvailability(a)
    setSessions(s.items)
    setSession(current => current ? s.items.find(item => item.id === current.id) ?? current : s.items.find(item => !terminal.has(item.status)) ?? null)
  }, [])

  useEffect(() => { void refresh().catch(() => setError('Không tải được phiên phỏng vấn.')) }, [refresh])
  useEffect(() => { const id = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(id) }, [])
  useEffect(() => {
    if (!session || terminal.has(session.status)) return
    const id = window.setInterval(() => void interviewV1.get(session.id).then(setSession).catch(() => undefined), 5000)
    return () => window.clearInterval(id)
  }, [session?.id, session?.status])
  useEffect(() => { setDraft(session?.transcriptDraft ?? '') }, [session?.id, session?.questionNumber, session?.transcriptRevision])
  useEffect(() => {
    if (chatList.current) chatList.current.scrollTop = chatList.current.scrollHeight
  }, [session?.id, session?.questionNumber, session?.status, session?.answers.length, report])
  useEffect(() => () => { discard.current = true; if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()) }, [])

  const run = async (action: () => Promise<InterviewSessionV1>) => {
    setBusy(true); setError('')
    try { setSession(await action()); await refresh() }
    catch (e) {
      // The server can recover an unsuccessful upload to "preparing" while the
      // browser still holds the preceding "transcribing" snapshot.
      try { await refresh() } catch { /* The normal poll can retry the refresh. */ }
      if (e instanceof ApiError && e.code === 'STT_UNAVAILABLE') {
        setTextFallback(true)
        setError('Không chuyển được ghi âm thành chữ. Bạn có thể nhập câu trả lời bằng chữ cho câu hỏi này khi bộ đếm chuẩn bị về 0; không cần bắt đầu phiên mới.')
      } else {
        setError(e instanceof ApiError ? `${e.code}: ${e.message}` : 'Thao tác thất bại. Vui lòng thử lại.')
      }
    }
    finally { setBusy(false) }
  }

  const remaining = (date: string | null) => Math.max(0, Math.ceil(((date ? new Date(date).getTime() : 0) - clock) / 1000))
  const stopTracks = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null }
  const stopRecording = () => {
    if (recorder.current?.state === 'recording' && !stopping.current) { stopping.current = true; recorder.current.stop() }
  }
  const startSession = async () => {
    if (!consent || role.trim().length < 2) return
    setBusy(true); setError('')
    try {
      if (!textOnly) {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('MICROPHONE_UNAVAILABLE')
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true })
        probe.getTracks().forEach(track => track.stop())
      }
      setSession(await interviewV1.start(role.trim(), difficulty))
      setTextFallback(textOnly)
      await refresh()
    } catch (e) {
      if (e instanceof ApiError && e.code === 'RATE_LIMITED') {
        const seconds = Number((e.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds)
        const wait = seconds > 0
          ? seconds >= 3600 ? `${Math.ceil(seconds / 3600)} giờ` : `${Math.ceil(seconds / 60)} phút`
          : 'ít phút'
        setError(`Đã có quá nhiều lần thử bắt đầu phỏng vấn. Vui lòng thử lại sau khoảng ${wait}; lần thử này chưa trừ lượt VIP.`)
      } else {
        setError(e instanceof ApiError ? `${e.code}: ${e.message}` : 'Không dùng được micro. Chọn chế độ trả lời bằng chữ để tiếp tục; chưa trừ lượt phỏng vấn.')
      }
    } finally { setBusy(false) }
  }

  const startRecording = async () => {
    if (!session?.questionNumber || !consent || remaining(session.prepEndsAt) > 0) return
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('Trình duyệt không hỗ trợ ghi âm. Hãy dùng câu trả lời bằng chữ.'); return }
    setBusy(true); setError('')
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = media
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const instance = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
      const permitted = await interviewV1.begin(session.id, session.questionNumber)
      setSession(permitted)
      chunks.current = []; stopping.current = false; discard.current = false
      recorder.current = instance
      instance.ondataavailable = event => { if (event.data.size) chunks.current.push(event.data) }
      instance.onstop = () => {
        stopTracks()
        if (discard.current) return
        const blob = new Blob(chunks.current, { type: instance.mimeType || 'audio/webm' })
        if (blob.size && session.questionNumber) void run(() => interviewV1.upload(session.id, session.questionNumber!, blob))
        else setError('Không có âm thanh. Hãy ghi lại hoặc dùng chữ.')
      }
      instance.start()
    } catch (e) {
      stopTracks()
      setError(e instanceof ApiError ? e.code : 'Không truy cập được micro. Bạn có thể trả lời bằng chữ.')
    } finally { setBusy(false) }
  }

  useEffect(() => { if (session?.status === 'recording' && remaining(session.answerDeadlineAt) === 0) stopRecording() }, [clock, session?.status, session?.answerDeadlineAt])
  const openReport = async (id: string) => {
    setError(''); setReport(null)
    try { setReport(await interviewV1.report(id)) }
    catch { setError('Báo cáo đang xử lý. Hãy thử lại sau.') }
  }

  const answeredCount = session?.answers.length ?? 0
  const currentQuestionAnswered = session?.answers.some(answer => answer.questionNumber === session.questionNumber) ?? false
  const openNewSession = () => {
    if (!session) return
    setRole(session.targetRole)
    setDifficulty(session.difficulty)
    setConsent(false)
    setSession(null)
    setReport(null)
    setError('')
  }

  return <main className="interview-chat mx-auto max-w-5xl px-4 py-6 text-ns-primary sm:px-6 sm:py-8">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Luyện phỏng vấn AI</h1>
        <p className="mt-1 text-sm text-ns-muted">Một cuộc hội thoại gồm 6 câu hỏi. Bạn có thể trả lời bằng giọng nói hoặc bằng chữ.</p>
      </div>
      {availability?.eligible && <span className="rounded-full border border-ns bg-ns-card px-3 py-1.5 text-sm text-ns-secondary">Còn {availability.sessionsLeft} lượt phỏng vấn</span>}
    </div>

    {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}
    {!availability ? <p role="status" className="rounded-2xl border border-ns bg-ns-card p-6">Đang tải phiên phỏng vấn...</p>
      : !availability.enabled ? <p className="rounded-2xl border border-ns bg-ns-card p-6">Phỏng vấn AI chưa mở cho tài khoản này.</p>
        : !availability.eligible ? <p className="rounded-2xl border border-ns bg-ns-card p-6">Tính năng phỏng vấn yêu cầu gói VIP còn hiệu lực.</p>
          : <>
            {!session && <section className="overflow-hidden rounded-2xl border border-ns bg-ns-card shadow-card" aria-labelledby="interview-start-title">
              <div className="flex items-start gap-3 border-b border-ns p-5 sm:p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 keep-accent"><Bot size={23} aria-hidden="true" /></span>
                <div>
                  <h2 id="interview-start-title" className="text-xl font-semibold">Bắt đầu cuộc phỏng vấn</h2>
                  <p className="mt-1 text-sm text-ns-muted">Hãy chọn vị trí và độ khó. AI sẽ đặt câu hỏi đầu tiên sau khi bạn bắt đầu.</p>
                </div>
              </div>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                  <label className="block text-sm font-medium">Vị trí ứng tuyển
                    <input className="input-field mt-2" maxLength={255} placeholder="Ví dụ: Data Engineer" value={role} onChange={e => setRole(e.target.value)} />
                  </label>
                  <label className="block text-sm font-medium">Độ khó
                    <select className="input-field mt-2" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                      <option value="easy">Cơ bản</option><option value="medium">Trung bình</option><option value="hard">Nâng cao</option>
                    </select>
                  </label>
                </div>
                <label className="flex items-start gap-3 rounded-xl border border-ns bg-ns-page p-4 text-sm text-ns-secondary">
                  <input type="checkbox" className="mt-1" checked={textOnly} onChange={e => setTextOnly(e.target.checked)} />
                  <span>Chỉ trả lời bằng chữ. Câu trả lời vẫn tính trong cùng một lượt VIP.</span>
                </label>
                <label className="flex items-start gap-3 rounded-xl border border-ns bg-ns-page p-4 text-sm leading-relaxed text-ns-secondary">
                  <input type="checkbox" className="mt-1" checked={consent} onChange={e => setConsent(e.target.checked)} />
                  <span>{consentCopy}</span>
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-ns-muted">60 giây chuẩn bị mỗi câu · Tối đa 120 giây ghi âm</p>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !consent || role.trim().length < 2 || availability.sessionsLeft < 1} onClick={() => void startSession()}>
                    <Bot size={18} aria-hidden="true" /> {busy ? 'Đang bắt đầu...' : 'Bắt đầu phỏng vấn'}
                  </button>
                </div>
              </div>
            </section>}

            {session && <section className="flex flex-col overflow-hidden rounded-2xl border border-ns bg-ns-card shadow-card" aria-label={`Phỏng vấn ${session.targetRole}`}>
              <header className="border-b border-ns p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><Bot size={21} aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold sm:text-lg">{session.targetRole}</h2>
                      <p className="text-xs text-ns-muted">Phỏng vấn AI · {difficultyLabels[session.difficulty] ?? session.difficulty}</p>
                    </div>
                  </div>
                  <button type="button" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm text-ns-muted hover:bg-ns-raised hover:text-ns-primary disabled:opacity-50" disabled={busy} onClick={() => { discard.current = true; stopRecording(); setSession(null); setReport(null); setError('') }} aria-label="Đóng khung phỏng vấn">
                    <X size={17} aria-hidden="true" /> Đóng
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-ns-muted">
                  <span>{statusLabels[session.status] ?? session.status}</span>
                  <span>{answeredCount}/6 câu đã trả lời</span>
                </div>
                <div className="mt-2 flex gap-1.5" role="progressbar" aria-label="Tiến độ phỏng vấn" aria-valuemin={0} aria-valuemax={6} aria-valuenow={answeredCount}>
                  {Array.from({ length: 6 }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < answeredCount ? 'bg-blue-600' : index === answeredCount && !terminal.has(session.status) ? 'bg-blue-400' : 'bg-ns-raised'}`} />)}
                </div>
              </header>

              <div ref={chatList} role="log" aria-label="Hội thoại phỏng vấn" aria-relevant="additions" className={`${terminal.has(session.status) ? '' : 'min-h-80'} max-h-[55vh] space-y-5 overflow-y-auto bg-ns-page px-4 py-6 sm:px-6`}>
                {(!['failed', 'abandoned'].includes(session.status) || answeredCount > 0) && <div className="flex items-end gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><Bot size={16} aria-hidden="true" /></span>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-ns bg-ns-card px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]">Chào bạn! Chúng ta sẽ cùng luyện 6 câu hỏi cho vị trí <strong>{session.targetRole}</strong>. Bạn có thể sửa bản chép lời trước khi xác nhận.</div>
                </div>}
                {session.answers.map(answer => <Fragment key={answer.questionNumber}>
                  <div className="flex items-end gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><Bot size={16} aria-hidden="true" /></span>
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-ns bg-ns-card px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]"><p className="mb-1 text-xs font-semibold text-blue-400 keep-accent">Câu {answer.questionNumber}</p>{answer.question}</div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white sm:max-w-[75%]"><p className="mb-1 text-xs font-semibold text-blue-100">Câu trả lời của bạn</p>{answer.transcript ?? 'Nội dung đã được xóa theo thời hạn lưu trữ.'}</div>
                  </div>
                </Fragment>)}
                {session.question && !terminal.has(session.status) && !currentQuestionAnswered && <div className="flex items-end gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><Bot size={16} aria-hidden="true" /></span>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-ns bg-ns-card px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]"><p className="mb-1 text-xs font-semibold text-blue-400 keep-accent">Câu {session.questionNumber}/6</p>{session.question}</div>
                </div>}
                {['created', 'preparing_next', 'reporting', 'transcribing'].includes(session.status) && <p role="status" className="ml-10 text-sm text-ns-muted">{statusLabels[session.status]}...</p>}
                {session.status === 'failed' && <div className="flex items-end gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><Bot size={16} aria-hidden="true" /></span><p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-ns-primary sm:max-w-[75%]">Phiên này gặp lỗi và không thể tiếp tục. {answeredCount === 0 ? 'Chưa có câu trả lời nào được ghi nhận.' : `${answeredCount}/6 câu trả lời đã được ghi nhận.`} Hãy kiểm tra lượt còn lại trước khi bắt đầu phiên khác.</p></div>}
                {session.status === 'abandoned' && <div className="flex items-end gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><Bot size={16} aria-hidden="true" /></span><p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-ns bg-ns-card px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]">Phiên này đã kết thúc và không thể tiếp tục.</p></div>}
                {session.status === 'completed' && <div className="flex items-end gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><Check size={16} aria-hidden="true" /></span><p className="rounded-2xl rounded-bl-sm border border-ns bg-ns-card px-4 py-3 text-sm">Bạn đã hoàn thành buổi phỏng vấn. Báo cáo đã sẵn sàng.</p></div>}
                {report && <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><FileText size={16} aria-hidden="true" /></span>
                  <div className="min-w-0 max-w-[90%] rounded-2xl rounded-bl-sm border border-ns bg-ns-card p-4 text-sm leading-relaxed sm:max-w-[80%]">
                    <h3 className="font-semibold">Báo cáo phỏng vấn · {report.overallScore == null ? 'Chưa đủ dữ liệu chấm điểm' : `${report.overallScore}/100`}</h3>
                    <p className="mt-2">{report.report.summary}</p>
                    {report.report.details?.map(detail => <p key={detail.questionNumber} className="mt-3 border-t border-ns pt-3"><strong>Câu {detail.questionNumber}: {detail.score == null ? 'Không thể đánh giá' : `${detail.score}/100`}</strong><br />{detail.feedback}</p>)}
                  </div>
                </div>}
              </div>

              <div className="space-y-4 border-t border-ns p-4 sm:p-5">
                {!consent && !terminal.has(session.status) && <label className="flex items-start gap-2 rounded-xl border border-ns bg-ns-page p-3 text-xs leading-relaxed text-ns-secondary"><input type="checkbox" className="mt-0.5" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{consentCopy}</span></label>}

                {session.status === 'preparing' && <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="inline-flex items-center gap-2 text-ns-secondary"><Clock3 size={16} aria-hidden="true" /> Chuẩn bị: <strong>{remaining(session.prepEndsAt)} giây</strong></span><span className="text-xs text-ns-muted">Có thể soạn trước; gửi khi hết thời gian chuẩn bị.</span></div>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Cách trả lời">
                    <button type="button" className={`rounded-lg px-3 py-2 text-sm ${!textFallback ? 'bg-blue-600 text-white' : 'border border-ns text-ns-secondary hover:bg-ns-raised'}`} onClick={() => setTextFallback(false)}><Mic size={16} className="mr-1 inline" aria-hidden="true" /> Ghi âm</button>
                    <button type="button" className={`rounded-lg px-3 py-2 text-sm ${textFallback ? 'bg-blue-600 text-white' : 'border border-ns text-ns-secondary hover:bg-ns-raised'}`} onClick={() => setTextFallback(true)}>Trả lời bằng chữ</button>
                  </div>
                  {textFallback ? <div className="space-y-2">
                    <label htmlFor="interview-text-answer" className="sr-only">Câu trả lời bằng chữ</label>
                    <textarea id="interview-text-answer" className="min-h-28 w-full resize-y rounded-xl border border-ns bg-ns-page p-3 text-ns-primary placeholder:text-ns-faint focus:border-blue-500 focus:outline-none" maxLength={12000} placeholder="Nhập câu trả lời của bạn..." value={draft} onChange={e => setDraft(e.target.value)} />
                    <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !consent || remaining(session.prepEndsAt) > 0 || !draft.trim()} onClick={() => void run(() => interviewV1.text(session.id, session.questionNumber!, draft.trim()))}><Send size={17} aria-hidden="true" /> Gửi câu trả lời</button>
                  </div> : <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !consent || remaining(session.prepEndsAt) > 0} onClick={() => void startRecording()}><Mic size={18} aria-hidden="true" /> Bắt đầu ghi âm</button>}
                </>}

                {session.status === 'recording' && <div className="flex flex-wrap items-center gap-3">
                  <span role="status" className="inline-flex items-center gap-2 text-sm text-red-500"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" /> {busy ? 'Đang gửi ghi âm...' : recorder.current?.state === 'recording' ? `Đang ghi âm · còn ${remaining(session.answerDeadlineAt)} giây` : 'Ghi âm đã ngắt trên trình duyệt. Hãy ghi lại.'}</span>
                  {recorder.current?.state === 'recording' && <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50" disabled={busy} onClick={stopRecording}><Square size={16} aria-hidden="true" /> Dừng và chuyển thành chữ</button>}
                  <button className="inline-flex items-center gap-2 rounded-xl border border-ns px-3 py-2 text-sm text-ns-secondary hover:bg-ns-raised disabled:opacity-50" disabled={busy} onClick={() => { discard.current = true; stopRecording(); void run(() => interviewV1.retry(session.id, session.questionNumber!)) }}><RotateCcw size={15} aria-hidden="true" /> Ghi lại</button>
                </div>}

                {session.status === 'awaiting_confirmation' && <div className="space-y-2">
                  <label htmlFor="interview-transcript" className="block text-sm font-medium">Kiểm tra và sửa bản chép lời trước khi xác nhận</label>
                  <textarea id="interview-transcript" className="min-h-28 w-full resize-y rounded-xl border border-ns bg-ns-page p-3 text-ns-primary focus:border-blue-500 focus:outline-none" maxLength={12000} value={draft} onChange={e => setDraft(e.target.value)} />
                  <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50" disabled={busy || !draft.trim()} onClick={() => void run(() => interviewV1.confirm(session.id, session.questionNumber!, draft.trim(), session.transcriptRevision!))}><Check size={18} aria-hidden="true" /> Xác nhận câu trả lời</button>
                </div>}

                {['created', 'preparing_next', 'reporting', 'transcribing'].includes(session.status) && <button className="inline-flex items-center gap-2 rounded-lg border border-ns px-3 py-2 text-sm text-ns-secondary hover:bg-ns-raised disabled:opacity-50" disabled={busy} onClick={() => void run(() => interviewV1.resume(session.id))}><RotateCcw size={15} aria-hidden="true" /> Cập nhật trạng thái</button>}
                {session.status === 'completed' && !report && <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500" onClick={() => void openReport(session.id)}><FileText size={18} aria-hidden="true" /> Xem báo cáo</button>}
                {session.status === 'failed' && <p className="text-xs text-ns-muted">Nếu số lượt không đúng, hãy liên hệ nhóm vận hành để đối soát.</p>}
                {(session.status === 'failed' || session.status === 'abandoned') && <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500" onClick={openNewSession}><Bot size={17} aria-hidden="true" /> Bắt đầu phiên mới</button>}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ns pt-3 text-xs text-ns-muted">
                  <span>Transcript xóa sau {availability.transcriptTtlHours} giờ; báo cáo lưu tới khi xóa tài khoản.</span>
                  {!terminal.has(session.status) && <button className="rounded-lg px-2 py-1 text-red-500 hover:bg-red-500/10 disabled:opacity-50" disabled={busy} onClick={() => { if (window.confirm('Kết thúc phiên phỏng vấn này? Bạn sẽ không thể tiếp tục phiên sau khi kết thúc.')) { discard.current = true; stopRecording(); void run(() => interviewV1.abandon(session.id)) } }}>Kết thúc phiên</button>}
                </div>
              </div>
            </section>}

            <section className="mt-8" aria-labelledby="interview-history-title">
              <h2 id="interview-history-title" className="mb-3 text-lg font-semibold">Lịch sử phỏng vấn</h2>
              {sessions.length === 0 ? <p className="rounded-xl border border-ns bg-ns-card p-4 text-sm text-ns-muted">Chưa có phiên phỏng vấn nào.</p> : <div className="grid gap-2 sm:grid-cols-2">
                {sessions.map(item => <button key={item.id} disabled={busy || recorder.current?.state === 'recording'} className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-ns-raised disabled:cursor-not-allowed disabled:opacity-50 ${session?.id === item.id ? 'border-blue-500 bg-blue-600/10' : 'border-ns bg-ns-card'}`} onClick={() => { setSession(item); setReport(null); setError(''); if (item.status === 'completed') void openReport(item.id) }}>
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{item.targetRole}</span><span className="block text-xs text-ns-muted">{new Date(item.createdAt).toLocaleString('vi-VN')}</span></span>
                  <span className="shrink-0 text-xs text-ns-muted">{statusLabels[item.status] ?? item.status}</span>
                </button>)}
              </div>}
            </section>
          </>}
  </main>
}
