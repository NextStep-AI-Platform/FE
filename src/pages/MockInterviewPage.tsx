import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, Send, ChevronDown, RefreshCw, Star, Lock, X,
  Search, BarChart3, Clock, CheckCircle2, Keyboard, Mic2,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { INDUSTRIES, ROLES_BY_INDUSTRY, MOCK_QUESTIONS, VIP_INTERVIEW_TOTAL } from '../constants'
import { getInterviewFeedback } from '../data/interviewFeedbackPresets'
import { formatDateTime, formatTimer } from '../lib/utils'
import InterviewDonutChart, { ROLE_CHART_COLORS } from '../components/interview/InterviewDonutChart'
import InterviewResultModal from '../components/interview/InterviewResultModal'
import type { InterviewMode, InterviewQuestionResult, InterviewSessionRecord } from '../types'

type HubPhase = 'hub' | 'interview'
type StatsFilter = 'all' | '7d' | '30d'

interface Message {
  role: 'ai' | 'user'
  content: string
  feedback?: { score: number; comment: string }
}

const mockAnswers = [
  'Tôi có 2 năm kinh nghiệm phát triển Frontend với React và TypeScript. Tôi đã làm việc tại một startup fintech, xây dựng các tính năng cho ứng dụng quản lý tài chính cá nhân với hơn 50,000 người dùng.',
  'Trong dự án gần nhất, tôi đã tối ưu hoá hiệu năng bằng cách triển khai lazy loading và code splitting, giảm thời gian tải trang từ 4 giây xuống còn 1.8 giây, cải thiện Core Web Vitals đáng kể.',
  'Tôi xử lý conflict bằng cách lắng nghe cả hai phía, tìm điểm chung và đề xuất giải pháp dựa trên dữ liệu thực tế. Tôi đã từng giải quyết bất đồng về kiến trúc component bằng cách tổ chức một buổi demo so sánh hai phương án.',
]

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function StatBadge({
  label,
  value,
  icon: Icon,
  iconClass,
  tileClass,
}: {
  label: string
  value: number | string
  icon: typeof Clock
  iconClass: string
  tileClass: string
}) {
  return (
    <div className="dashboard-stat-card bg-ns-page border border-ns rounded-xl px-3.5 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 shrink-0 ${tileClass} stat-icon-tile rounded-lg flex items-center justify-center`}>
        <Icon size={17} className={iconClass} />
      </div>
      <div className="flex flex-col justify-center min-w-0 gap-0.5">
        <p className="text-ns-muted text-xs leading-none">{label}</p>
        <p className="font-heading font-bold text-ns-primary text-xl leading-none">{value}</p>
      </div>
    </div>
  )
}

function filterByPeriod(sessions: InterviewSessionRecord[], period: StatsFilter) {
  if (period === 'all') return sessions
  const days = period === '7d' ? 7 : 30
  const cutoff = Date.now() - days * 86_400_000
  return sessions.filter(s => new Date(s.completedAt).getTime() >= cutoff)
}

function buildSessionFromMessages(
  userId: string,
  industry: string,
  role: string,
  mode: InterviewMode,
  questions: string[],
  messages: Message[],
  durationSeconds: number,
): InterviewSessionRecord {
  const userMsgs = messages.filter(m => m.role === 'user')
  const aiFeedbacks = messages.filter(m => m.role === 'ai' && m.feedback)

  const questionResults: InterviewQuestionResult[] = questions.slice(0, userMsgs.length).map((q, i) => ({
    question: q,
    answer: userMsgs[i]?.content ?? '',
    score: aiFeedbacks[i]?.feedback?.score ?? 70,
    feedback: aiFeedbacks[i]?.feedback?.comment ?? 'Chưa có nhận xét.',
  }))

  const overallScore =
    questionResults.length > 0
      ? Math.round(questionResults.reduce((s, q) => s + q.score, 0) / questionResults.length)
      : 0

  return {
    id: `iv_${Date.now()}`,
    userId,
    role,
    industry,
    mode,
    overallScore,
    durationSeconds,
    completedAt: new Date().toISOString(),
    questions: questionResults,
  }
}

export default function MockInterviewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { isVip, plan, user, interviews, addInterviewSession, consumeInterviewSession } = useApp()
  const vip = isVip()

  const [phase, setPhase] = useState<HubPhase>('hub')
  const [resultSession, setResultSession] = useState<InterviewSessionRecord | null>(null)

  const [industry, setIndustry] = useState('')
  const [role, setRole] = useState('')
  const [mode, setMode] = useState<InterviewMode>('text')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const [statsFilter, setStatsFilter] = useState<StatsFilter>('all')
  const [historySearch, setHistorySearch] = useState('')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)

  const roles = industry ? (ROLES_BY_INDUSTRY[industry] ?? []) : []
  const questions = role && MOCK_QUESTIONS[role] ? MOCK_QUESTIONS[role] : MOCK_QUESTIONS['default']

  const sessionsLeft = plan.interviewSessionsLeft
  const sessionsUsed = Math.max(0, VIP_INTERVIEW_TOTAL - sessionsLeft)

  const filteredForStats = useMemo(
    () => filterByPeriod(interviews, statsFilter),
    [interviews, statsFilter],
  )

  const donutSegments = useMemo(() => {
    const counts = new Map<string, number>()
    filteredForStats.forEach(s => counts.set(s.role, (counts.get(s.role) ?? 0) + 1))
    return [...counts.entries()].map(([label, value], i) => ({
      label,
      value,
      color: ROLE_CHART_COLORS[i % ROLE_CHART_COLORS.length],
    }))
  }, [filteredForStats])

  const filteredHistory = useMemo(() => {
    return [...interviews]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .filter(s => {
        const q = historySearch.trim().toLowerCase()
        const matchQ = !q || s.role.toLowerCase().includes(q) || s.industry.toLowerCase().includes(q)
        const d = new Date(s.completedAt)
        const fromOk = !historyFrom || d >= new Date(historyFrom + 'T00:00:00')
        const toOk = !historyTo || d <= new Date(historyTo + 'T23:59:59')
        return matchQ && fromOk && toOk
      })
  }, [interviews, historySearch, historyFrom, historyTo])

  useEffect(() => {
    if (phase === 'interview') {
      timerRef.current = setInterval(() => setElapsedTime(t => { elapsedRef.current = t + 1; return t + 1 }), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const resetInterviewState = () => {
    setMessages([])
    setInput('')
    setQuestionIndex(0)
    setIsTyping(false)
    setIsMicOn(false)
    setElapsedTime(0)
  }

  const finishInterview = (currentMessages: Message[], duration: number) => {
    if (!user) return
    const session = buildSessionFromMessages(user.id, industry, role, mode, questions, currentMessages, duration)
    addInterviewSession(session)
    setResultSession(session)
    if (timerRef.current) clearInterval(timerRef.current)
    toast.success('Hoàn tất phỏng vấn', `Điểm tổng ${session.overallScore}/100 — xem chi tiết trong popup`)
  }

  const exitToHub = () => {
    setResultSession(null)
    resetInterviewState()
    setPhase('hub')
  }

  const handleContinue = () => {
    exitToHub()
    setIndustry('')
    setRole('')
    toast.info('Sẵn sàng buổi mới', 'Chọn ngành và vị trí bên dưới để luyện tiếp')
  }

  const handleCloseResult = () => {
    if (phase === 'interview') exitToHub()
    else setResultSession(null)
  }

  const startInterview = () => {
    if (!industry || !role) return
    if (!consumeInterviewSession()) {
      toast.error('Hết lượt phỏng vấn', 'Nâng cấp VIP hoặc mua thêm buổi tại trang Nâng cấp gói')
      return
    }
    toast.info('Buổi phỏng vấn đã bắt đầu', `${questions.length} câu hỏi · vị trí ${role}`)
    const firstQ = questions[0]
    setMessages([{
      role: 'ai',
      content: `Xin chào! Tôi là AI Interviewer của NextStep. Chúng ta sẽ thực hiện buổi phỏng vấn cho vị trí **${role}**.\n\nHãy bắt đầu với câu hỏi đầu tiên:\n\n${firstQ}`,
    }])
    setQuestionIndex(0)
    setElapsedTime(0)
    elapsedRef.current = 0
    setPhase('interview')
  }

  const sendAnswer = (answer: string) => {
    if (!answer.trim() || isTyping) return
    const userMsg: Message = { role: 'user', content: answer }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const { score, comment } = getInterviewFeedback(role, questionIndex, answer)
      const feedback = { score, comment: comment }
      const nextIdx = questionIndex + 1
      const done = nextIdx >= questions.length

      let aiContent = `**Feedback:** ${feedback.comment} (Điểm: ${score}/100)\n\n`
      if (!done) {
        aiContent += `**Câu hỏi ${nextIdx + 1}/${questions.length}:**\n\n${questions[nextIdx]}`
      } else {
        aiContent += 'Buổi phỏng vấn đã kết thúc! Cảm ơn bạn đã tham gia.'
      }

      const finalMessages: Message[] = [...nextMessages, { role: 'ai', content: aiContent, feedback }]
      setMessages(finalMessages)

      if (!done) {
        setQuestionIndex(nextIdx)
        setIsTyping(false)
      } else {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsTyping(false)
        setTimeout(() => finishInterview(finalMessages, elapsedRef.current), 800)
      }
    }, 1500)
  }

  if (!vip) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full bg-ns-card border border-blue-500/20 rounded-2xl p-10 text-center shadow-card">
          <div className="w-20 h-20 bg-yellow-400/10 stat-icon-tile stat-icon-tile-yellow rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="keep-accent text-yellow-400" />
          </div>
          <h2 className="font-heading font-bold text-ns-primary text-2xl mb-3">Luyện phỏng vấn AI</h2>
          <p className="text-ns-muted text-sm mb-2">Tính năng này yêu cầu gói <span className="keep-accent text-yellow-400 font-semibold">VIP Interview</span></p>
          <p className="text-ns-faint text-sm mb-8">Mô phỏng buổi phỏng vấn thực tế với AI, nhận feedback chi tiết và cải thiện kỹ năng phỏng vấn của bạn</p>
          <ul className="text-left space-y-2 mb-8">
            {['Câu hỏi theo ngành & vị trí cụ thể', 'AI phân tích câu trả lời real-time', 'Feedback chi tiết từng câu hỏi', 'Báo cáo phỏng vấn sau mỗi phiên', 'Luyện voice interview'].map(f => (
              <li key={f} className="flex items-center gap-2 text-ns-secondary text-sm">
                <Star size={14} className="keep-accent text-yellow-400 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/pricing')} className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition cursor-pointer">
            Xem gói VIP Interview
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'interview') {
    return (
      <div className="relative flex flex-col h-[calc(100vh-4rem)]">
        <div className={`flex flex-col flex-1 min-h-0 ${resultSession ? 'pointer-events-none select-none' : ''}`}>
          <div className="bg-ns-card border-b border-ns px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-ns-primary font-semibold text-sm">{role}</p>
              <p className="text-ns-faint text-xs">Câu {Math.min(questionIndex + 1, questions.length)}/{questions.length} · {formatTimer(elapsedTime)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                resetInterviewState()
                setPhase('hub')
                toast.warning('Đã thoát buổi phỏng vấn', 'Lượt đã dùng sẽ không được hoàn lại')
              }}
              className="text-ns-faint hover:text-red-400 border border-ns p-2 rounded-lg transition cursor-pointer"
              aria-label="Thoát phỏng vấn"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-ns-card border border-ns text-ns-secondary rounded-bl-sm shadow-card'
                }`}>
                  {msg.content.split('\n').map((line, j) => {
                    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    return <p key={j} className={j > 0 ? 'mt-2' : ''} dangerouslySetInnerHTML={{ __html: bold }} />
                  })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-ns-card border border-ns rounded-2xl rounded-bl-sm px-5 py-4 flex gap-1 shadow-card">
                  <span className="w-2 h-2 bg-ns-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-ns-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-ns-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!resultSession && (
          <div className="border-t border-ns p-4 bg-ns-page flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              {mode === 'text' ? (
                <div className="flex gap-3 items-end">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(input) } }}
                    placeholder="Nhập câu trả lời của bạn... (Enter để gửi)"
                    rows={3}
                    className="input-field flex-1 resize-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => sendAnswer(input)}
                    disabled={!input.trim() || isTyping}
                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsMicOn(!isMicOn); if (isMicOn) sendAnswer(mockAnswers[questionIndex % mockAnswers.length]) }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition cursor-pointer ${isMicOn ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isMicOn ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                  </button>
                  <p className="text-ns-faint text-xs">{isMicOn ? 'Đang ghi âm... Nhấn để dừng và gửi' : 'Nhấn để bắt đầu nói'}</p>
                </div>
              )}
              <div className="flex justify-center mt-2">
                <button type="button" onClick={() => setMode(mode === 'text' ? 'voice' : 'text')} className="text-ns-faint text-xs flex items-center gap-1 hover:text-ns-secondary cursor-pointer">
                  <RefreshCw size={11} /> Chuyển sang {mode === 'text' ? 'voice' : 'text'}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>

        {resultSession && (
          <InterviewResultModal
            session={resultSession}
            onClose={handleCloseResult}
            onContinue={handleContinue}
            onHome={() => { exitToHub(); navigate('/dashboard') }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative p-6 max-w-6xl mx-auto space-y-6">
      {/* Stats + chart cùng section */}
      <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={20} className="keep-accent text-blue-400" />
          <h2 className="font-heading font-semibold text-ns-primary text-lg">Thống kê phỏng vấn</h2>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,260px)_1fr] gap-5 items-stretch">
          {/* Badge lượt còn lại / đã dùng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <StatBadge
              label="Lượt còn lại"
              value={sessionsLeft}
              icon={Clock}
              iconClass="keep-accent text-blue-400"
              tileClass="bg-blue-400/10 stat-icon-tile-blue"
            />
            <StatBadge
              label="Lượt đã dùng"
              value={sessionsUsed}
              icon={CheckCircle2}
              iconClass="keep-accent text-green-400"
              tileClass="bg-green-400/10 stat-icon-tile-green"
            />
          </div>

          {/* Chart — filter chỉ áp dụng biểu đồ */}
          <div className="border border-ns rounded-xl bg-ns-page p-5 min-w-0 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 pb-4 border-b border-ns">
              <div>
                <h3 className="font-heading font-semibold text-ns-primary text-base">Phân bổ theo vị trí</h3>
                <p className="text-ns-faint text-xs mt-1">Số buổi phỏng vấn theo từng vị trí</p>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-44 flex-shrink-0">
                <label htmlFor="chart-period-filter" className="text-ns-faint text-xs font-medium">
                  Lọc biểu đồ
                </label>
                <div className="relative">
                  <select
                    id="chart-period-filter"
                    value={statsFilter}
                    onChange={e => setStatsFilter(e.target.value as StatsFilter)}
                    className="input-field appearance-none w-full pr-9 text-sm cursor-pointer bg-ns-card"
                  >
                    <option value="all">Tất cả</option>
                    <option value="7d">7 ngày qua</option>
                    <option value="30d">1 tháng qua</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-muted pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 flex-1">
              <InterviewDonutChart
                segments={donutSegments}
                centerLabel={String(filteredForStats.length)}
                centerSub="lượt"
              />
              <div
                className={`flex-1 min-w-0 w-full pr-0.5 ${donutSegments.length > 6 ? 'max-h-[8.75rem] overflow-y-auto' : ''}`}
              >
                {donutSegments.length === 0 ? (
                  <p className="text-ns-faint text-sm text-center sm:text-left">
                    Chưa có buổi phỏng vấn trong khoảng thời gian đã chọn
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {donutSegments.map(seg => (
                      <div
                        key={seg.label}
                        className="rounded-lg border px-2.5 py-2 flex items-center justify-between gap-2 min-w-0"
                        style={{
                          backgroundColor: hexToRgba(seg.color, 0.12),
                          borderColor: hexToRgba(seg.color, 0.35),
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                            aria-hidden
                          />
                          <span className="text-ns-secondary text-xs truncate leading-tight">{seg.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-ns-primary shrink-0 tabular-nums">
                          {seg.value} lượt
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup + History */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        {/* Setup */}
        <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card flex flex-col">
          <h2 className="font-heading font-bold text-ns-primary text-xl mb-1">Chuẩn bị phỏng vấn</h2>
          <p className="text-ns-muted text-sm mb-6">Chọn vị trí để AI tạo câu hỏi phù hợp</p>

          <div className="space-y-5 flex-1">
            <div>
              <label className="text-ns-secondary text-sm font-medium block mb-2">Ngành nghề *</label>
              <div className="relative">
                <select value={industry} onChange={e => { setIndustry(e.target.value); setRole('') }} className="input-field appearance-none w-full pr-9 cursor-pointer">
                  <option value="">-- Chọn ngành --</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-muted pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-ns-secondary text-sm font-medium block mb-2">Vị trí *</label>
              <div className="relative">
                <select value={role} onChange={e => setRole(e.target.value)} disabled={!industry} className="input-field appearance-none w-full pr-9 cursor-pointer disabled:opacity-50">
                  <option value="">-- Chọn vị trí --</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-muted pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-ns-secondary text-sm font-medium block mb-3">Hình thức trả lời</label>
              <div className="grid grid-cols-2 gap-3">
                {(['text', 'voice'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`p-4 rounded-xl border text-sm font-medium transition cursor-pointer flex flex-col items-center gap-2 ${
                      mode === m ? 'border-blue-500 bg-blue-600/10 keep-accent text-blue-400' : 'border-ns text-ns-muted hover:border-blue-500/30'
                    }`}
                  >
                    {m === 'text' ? <Keyboard size={20} /> : <Mic2 size={20} />}
                    {m === 'text' ? 'Gõ văn bản' : 'Giọng nói'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={startInterview}
            disabled={!industry || !role || sessionsLeft <= 0}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {sessionsLeft <= 0 ? 'Đã hết lượt phỏng vấn' : 'Bắt đầu phỏng vấn'}
          </button>
        </div>

        {/* History */}
        <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card flex flex-col min-h-[420px]">
          <h2 className="font-heading font-bold text-ns-primary text-xl mb-1">Kết quả phỏng vấn</h2>
          <p className="text-ns-muted text-sm mb-4">Lịch sử các buổi luyện tập gần đây</p>

          <div className="space-y-3 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2.5 input-field px-3 py-2.5">
              <Search size={16} className="text-ns-faint flex-shrink-0" aria-hidden />
              <input
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Tìm theo vị trí..."
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-ns-primary placeholder:text-ns-faint p-0 focus:ring-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} className="input-field text-sm" title="Từ ngày" />
              <input type="date" value={historyTo} onChange={e => setHistoryTo(e.target.value)} className="input-field text-sm" title="Đến ngày" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mic2 size={32} className="text-ns-faint mb-3" />
                <p className="text-ns-muted text-sm">Chưa có kết quả phỏng vấn</p>
                <p className="text-ns-faint text-xs mt-1">Bắt đầu buổi luyện đầu tiên bên trái</p>
              </div>
            ) : (
              filteredHistory.map(s => {
                const scoreColor =
                  s.overallScore >= 80 ? 'keep-accent text-green-400 bg-green-600/15 border-green-500/20'
                  : s.overallScore >= 60 ? 'keep-accent text-amber-400 bg-amber-500/15 border-amber-500/20'
                  : 'keep-accent text-red-400 bg-red-600/15 border-red-500/20'
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setResultSession(s)}
                    className="w-full flex items-center gap-3 p-3.5 bg-ns-page border border-ns rounded-xl hover:border-blue-500/30 transition cursor-pointer text-left insight-list-item scan-history-row"
                  >
                    <div className="w-9 h-9 bg-purple-400/10 stat-icon-tile stat-icon-tile-purple rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mic2 size={16} className="keep-accent text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ns-primary text-sm font-medium truncate">{s.role}</p>
                      <p className="text-ns-faint text-xs">{formatDateTime(s.completedAt)} · {formatTimer(s.durationSeconds)}</p>
                    </div>
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border flex-shrink-0 ${scoreColor}`}>
                      {s.overallScore}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {resultSession && (
        <InterviewResultModal
          session={resultSession}
          onClose={handleCloseResult}
          onContinue={handleContinue}
          onHome={() => { setResultSession(null); navigate('/dashboard') }}
        />
      )}
    </div>
  )
}
