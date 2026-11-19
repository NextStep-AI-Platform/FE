import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../lib/api/client'
import { interviewV1, type InterviewAvailability, type InterviewReportV1, type InterviewSessionV1 } from '../lib/api/interviewsV1'

const consentCopy = 'Tôi đồng ý gửi câu trả lời đã xác nhận tới Gemini của Google để tạo câu hỏi và báo cáo. Nếu dùng micro, âm thanh cũng được gửi tới Gemini để chuyển thành chữ; NextStep không lưu âm thanh trong hồ sơ và yêu cầu Google xóa file sau xử lý, còn Google có thể lưu file tạm tối đa 48 giờ. Tôi có thể sửa bản chép lời trước khi xác nhận. Transcript tự xóa sau 24 giờ; báo cáo lưu trong tài khoản và bị xóa khi tôi xóa tài khoản.'
const terminal = new Set(['completed', 'failed', 'abandoned'])

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
  useEffect(() => () => { discard.current = true; if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()) }, [])

  const run = async (action: () => Promise<InterviewSessionV1>) => {
    setBusy(true); setError('')
    try { setSession(await action()); await refresh() }
    catch (e) { setError(e instanceof ApiError ? `${e.code}: ${e.message}` : 'Thao tác thất bại. Vui lòng thử lại.') }
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
      setError(e instanceof ApiError ? `${e.code}: ${e.message}` : 'Không dùng được micro. Chọn chế độ trả lời bằng chữ để tiếp tục; chưa trừ lượt phỏng vấn.')
    } finally { setBusy(false) }
  }

  const startRecording = async () => {
    if (!session?.questionNumber || !consent || remaining(session.prepEndsAt) > 0) return
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('Trình duyệt không hỗ trợ ghi âm. Hãy dùng câu trả lời bằng chữ.'); return }
    setBusy(true); setError('')
    try {
      const permitted = await interviewV1.begin(session.id, session.questionNumber)
      setSession(permitted)
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = media
      chunks.current = []; stopping.current = false; discard.current = false
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const instance = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
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

  return <main className="max-w-4xl mx-auto px-4 py-8 text-ns-primary">
    <h1 className="text-3xl font-bold mb-3">Luyện phỏng vấn AI</h1>
    <p className="text-ns-muted mb-6">6 câu hỏi · 60 giây chuẩn bị mỗi câu · tối đa 120 giây ghi âm. Báo cáo dựa trên câu trả lời đã xác nhận.</p>
    {error && <p role="alert" className="rounded-lg border border-red-400 p-3 mb-4 text-red-500">{error}</p>}
    {!availability ? <p>Đang tải...</p> : !availability.enabled ? <p>Phỏng vấn AI chưa mở cho tài khoản này.</p> : !availability.eligible ? <p>Tính năng phỏng vấn yêu cầu gói VIP còn hiệu lực.</p> : <>
      <p className="mb-4">Lượt phỏng vấn còn lại: {availability.sessionsLeft}</p>
      {!session && <section className="rounded-xl border border-ns bg-ns-card p-5 space-y-4">
        <h2 className="font-semibold text-xl">Bắt đầu phiên mới</h2>
        <label className="block">Vị trí ứng tuyển<input className="block w-full mt-1 rounded border border-ns bg-ns-page p-2" maxLength={255} value={role} onChange={e => setRole(e.target.value)} /></label>
        <label className="block">Độ khó<select className="block mt-1 rounded border border-ns bg-ns-page p-2" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="easy">Cơ bản</option><option value="medium">Trung bình</option><option value="hard">Nâng cao</option></select></label>
        <label className="flex gap-2"><input type="checkbox" checked={textOnly} onChange={e => setTextOnly(e.target.checked)} /><span>Trả lời bằng chữ nếu không dùng được micro. Câu trả lời sẽ được ghi rõ là bản chữ và vẫn tính cùng lượt VIP.</span></label>
        <label className="flex gap-2"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{consentCopy}</span></label>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={busy || !consent || role.trim().length < 2 || availability.sessionsLeft < 1} onClick={() => void startSession()}>Bắt đầu</button>
      </section>}
      {session && <section className="rounded-xl border border-ns bg-ns-card p-5 space-y-4">
        <div className="flex justify-between gap-3"><h2 className="font-semibold text-xl">{session.targetRole} · Câu {session.questionNumber ?? '…'}/6</h2><button className="text-blue-500" onClick={() => { discard.current = true; stopRecording(); setSession(null); setReport(null) }}>Đóng</button></div>
        <p className="text-ns-muted">Trạng thái: {session.status}</p>
        {session.question && <p className="text-lg">{session.question}</p>}
        {!consent && !terminal.has(session.status) && <label className="flex gap-2"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{consentCopy}</span></label>}
        {session.status === 'preparing' && <><p>Chuẩn bị: {remaining(session.prepEndsAt)} giây</p><button className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={busy || !consent || remaining(session.prepEndsAt) > 0} onClick={() => void startRecording()}>Bật micro và trả lời</button><button className="ml-3 text-blue-500" onClick={() => setTextFallback(true)}>Trả lời bằng chữ</button>{textFallback && <div><textarea className="w-full rounded border border-ns bg-ns-page p-2" value={draft} onChange={e => setDraft(e.target.value)} /><button disabled={busy || remaining(session.prepEndsAt) > 0 || !draft.trim()} onClick={() => void run(() => interviewV1.text(session.id, session.questionNumber!, draft.trim()))}>Gửi câu trả lời bằng chữ</button></div>}</>}
        {session.status === 'recording' && <><p>Thời gian ghi âm còn: {remaining(session.answerDeadlineAt)} giây</p><button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={stopRecording}>Dừng và chuyển thành chữ</button><button className="ml-3 text-blue-500" disabled={busy} onClick={() => { discard.current = true; stopRecording(); void run(() => interviewV1.retry(session.id, session.questionNumber!)) }}>Ghi lại</button></>}
        {session.status === 'awaiting_confirmation' && <><label className="block">Kiểm tra và sửa transcript<textarea className="block w-full mt-1 rounded border border-ns bg-ns-page p-2 min-h-32" value={draft} onChange={e => setDraft(e.target.value)} /></label><button className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={busy || !draft.trim()} onClick={() => void run(() => interviewV1.confirm(session.id, session.questionNumber!, draft.trim(), session.transcriptRevision!))}>Xác nhận câu trả lời</button></>}
        {['created', 'preparing_next', 'reporting', 'transcribing'].includes(session.status) && <button className="text-blue-500" disabled={busy} onClick={() => void run(() => interviewV1.resume(session.id))}>Cập nhật trạng thái</button>}
        {session.status === 'completed' && <button className="text-blue-500" onClick={() => void openReport(session.id)}>Xem báo cáo</button>}
        {!terminal.has(session.status) && <button className="ml-3 text-red-500" disabled={busy} onClick={() => { discard.current = true; stopRecording(); void run(() => interviewV1.abandon(session.id)) }}>Kết thúc phiên</button>}
        <p className="text-xs text-ns-muted">Transcript xóa sau {availability.transcriptTtlHours} giờ; báo cáo lưu trong tài khoản cho tới khi xóa tài khoản.</p>
      </section>}
      {report && <section className="mt-5 rounded-xl border border-ns bg-ns-card p-5"><h2 className="text-xl font-semibold">Báo cáo · {report.overallScore == null ? 'Chưa đủ dữ liệu chấm điểm' : `${report.overallScore}/100`}</h2><p>{report.report.summary}</p>{report.report.details?.map(detail => <p key={detail.questionNumber} className="mt-3">Câu {detail.questionNumber}: {detail.score == null ? 'Không thể đánh giá' : `${detail.score}/100`} · {detail.feedback}</p>)}</section>}
      <h2 className="mt-8 mb-3 text-xl font-semibold">Lịch sử</h2>
      {sessions.map(item => <button key={item.id} className="block w-full text-left rounded-lg border border-ns p-3 mb-2" onClick={() => { setSession(item); setReport(null); if (item.status === 'completed') void openReport(item.id) }}>{item.targetRole} · {item.status} · {new Date(item.createdAt).toLocaleString('vi-VN')}</button>)}
    </>}
  </main>
}
