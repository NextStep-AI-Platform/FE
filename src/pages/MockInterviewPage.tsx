import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Send, ChevronDown, RefreshCw, Star, Lock, X, RotateCcw } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { INDUSTRIES, ROLES_BY_INDUSTRY, MOCK_QUESTIONS } from '../constants'
import { formatTimer } from '../lib/utils'

type InterviewPhase = 'setup' | 'interview' | 'result'

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

export default function MockInterviewPage() {
  const navigate = useNavigate()
  const { isVip } = useApp()
  const vip = isVip()

  const [phase, setPhase] = useState<InterviewPhase>('setup')
  const [industry, setIndustry] = useState('')
  const [role, setRole] = useState('')
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const roles = industry ? (ROLES_BY_INDUSTRY[industry] ?? []) : []
  const questions = role && MOCK_QUESTIONS[role] ? MOCK_QUESTIONS[role] : MOCK_QUESTIONS['default']

  useEffect(() => {
    if (phase === 'interview') {
      timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startInterview = () => {
    if (!industry || !role) return
    const firstQ = questions[0]
    setMessages([{ role: 'ai', content: `Xin chào! Tôi là AI Interviewer của NextStep. Chúng ta sẽ thực hiện buổi phỏng vấn cho vị trí **${role}**.\n\nHãy bắt đầu với câu hỏi đầu tiên:\n\n${firstQ}` }])
    setQuestionIndex(0)
    setPhase('interview')
  }

  const sendAnswer = (answer: string) => {
    if (!answer.trim() || isTyping) return
    const userMsg: Message = { role: 'user', content: answer }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const score = Math.floor(Math.random() * 20) + 70
      const comments = [
        'Câu trả lời tốt! Bạn đã nêu rõ kinh nghiệm và kết quả cụ thể.',
        'Khá tốt, nhưng hãy thêm số liệu cụ thể để câu trả lời thuyết phục hơn.',
        'Bạn đã dùng phương pháp STAR tốt. Phần kết quả có thể cụ thể hơn.',
      ]
      const feedback = { score, comment: comments[Math.floor(Math.random() * comments.length)] }
      const nextIdx = questionIndex + 1
      const done = nextIdx >= questions.length

      let aiContent = `**Feedback:** ${feedback.comment} (Điểm: ${score}/100)\n\n`
      if (!done) {
        aiContent += `**Câu hỏi ${nextIdx + 1}/${questions.length}:**\n\n${questions[nextIdx]}`
      } else {
        aiContent += 'Buổi phỏng vấn đã kết thúc! Cảm ơn bạn đã tham gia. Nhấn **Xem kết quả** để xem đánh giá tổng thể.'
        setIsFinished(true)
        if (timerRef.current) clearInterval(timerRef.current)
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiContent, feedback: { score, comment: feedback.comment } }])
      if (!done) setQuestionIndex(nextIdx)
      setIsTyping(false)
    }, 1500)
  }

  const mockOverallScore = 78
  const mockFeedbacks = [
    { question: questions[0] ?? 'Câu hỏi 1', score: 82, comment: 'Trả lời rõ ràng, có số liệu cụ thể' },
    { question: questions[1] ?? 'Câu hỏi 2', score: 74, comment: 'Cần thêm ví dụ thực tế để minh họa' },
    { question: questions[2] ?? 'Câu hỏi 3', score: 78, comment: 'Tốt, nhưng có thể ngắn gọn hơn' },
  ]

  if (!vip) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full bg-ns-card border border-blue-500/20 rounded-2xl p-10 text-center">
          <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-blue-400" />
          </div>
          <h2 className="font-heading font-bold text-ns-primary text-2xl mb-3">Luyện phỏng vấn AI</h2>
          <p className="text-ns-muted text-sm mb-2">Tính năng này yêu cầu gói <span className="text-yellow-400 font-semibold">VIP Interview</span></p>
          <p className="text-ns-faint text-sm mb-8">Mô phỏng buổi phỏng vấn thực tế với AI, nhận feedback chi tiết và cải thiện kỹ năng phỏng vấn của bạn</p>
          <ul className="text-left space-y-2 mb-8">
            {['Câu hỏi theo ngành & vị trí cụ thể', 'AI phân tích câu trả lời real-time', 'Feedback chi tiết từng câu hỏi', 'Báo cáo phỏng vấn sau mỗi phiên', 'Luyện voice interview'].map(f => (
              <li key={f} className="flex items-center gap-2 text-ns-secondary text-sm">
                <Star size={14} className="text-yellow-400 flex-shrink-0" /> {f}
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

  if (phase === 'setup') {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-5">
        <div className="bg-ns-card border border-ns rounded-2xl p-8">
          <h2 className="font-heading font-bold text-ns-primary text-2xl mb-2">Chuẩn bị phỏng vấn</h2>
          <p className="text-ns-muted text-sm mb-8">Chọn vị trí để AI tạo câu hỏi phù hợp</p>

          <div className="space-y-5">
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
                    onClick={() => setMode(m)}
                    className={`p-4 rounded-xl border text-sm font-medium transition cursor-pointer ${mode === m ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-ns text-ns-muted hover:border-blue-500/30'}`}
                  >
                    {m === 'text' ? '⌨️ Gõ văn bản' : '🎙️ Giọng nói'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startInterview}
              disabled={!industry || !role}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Bắt đầu phỏng vấn
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="bg-ns-card border border-ns rounded-2xl p-8 text-center">
          <div className="w-28 h-28 rounded-full border-8 border-blue-500 flex items-center justify-center bg-ns-page mx-auto mb-4">
            <span className="font-heading font-bold text-blue-400 text-5xl">{mockOverallScore}</span>
          </div>
          <h2 className="font-heading font-bold text-ns-primary text-2xl mb-2">Kết quả phỏng vấn</h2>
          <p className="text-ns-muted text-sm mb-1">{role} · {formatTimer(elapsedTime)}</p>
          <p className="text-ns-faint text-xs">{questions.length} câu hỏi · {messages.filter(m => m.role === 'user').length} câu trả lời</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-ns-primary">Feedback từng câu hỏi</h3>
          {mockFeedbacks.map((f, i) => (
            <div key={i} className="bg-ns-card border border-ns rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-ns-secondary text-sm font-medium flex-1 mr-4 line-clamp-1">{f.question}</p>
                <span className={`text-sm font-bold flex-shrink-0 ${f.score >= 80 ? 'text-green-400' : f.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{f.score}/100</span>
              </div>
              <p className="text-ns-faint text-xs">{f.comment}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setPhase('setup'); setMessages([]); setElapsedTime(0); setIsFinished(false) }} className="flex-1 flex items-center justify-center gap-2 border border-ns text-ns-secondary py-3 rounded-xl hover:bg-ns-raised transition cursor-pointer">
            <RotateCcw size={16} /> Phỏng vấn lại
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition cursor-pointer">
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Interview Topbar */}
      <div className="bg-ns-card border-b border-ns px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-ns-primary font-semibold text-sm">{role}</p>
          <p className="text-ns-faint text-xs">Câu {Math.min(questionIndex + 1, questions.length)}/{questions.length} · {formatTimer(elapsedTime)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPhase('setup')} className="text-ns-faint hover:text-red-400 border border-ns p-2 rounded-lg transition cursor-pointer">
            <X size={16} />
          </button>
          {isFinished && (
            <button onClick={() => setPhase('result')} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
              Xem kết quả
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-ns-card border border-ns text-ns-secondary rounded-bl-sm'
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
            <div className="bg-ns-card border border-ns rounded-2xl rounded-bl-sm px-5 py-4 flex gap-1">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isFinished && (
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
                  onClick={() => { setIsMicOn(!isMicOn); if (isMicOn) sendAnswer(mockAnswers[questionIndex % mockAnswers.length]) }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition cursor-pointer ${isMicOn ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isMicOn ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                </button>
                <p className="text-ns-faint text-xs">{isMicOn ? 'Đang ghi âm... Nhấn để dừng và gửi' : 'Nhấn để bắt đầu nói'}</p>
              </div>
            )}
            <div className="flex justify-center mt-2">
              <button onClick={() => setMode(mode === 'text' ? 'voice' : 'text')} className="text-ns-faint text-xs flex items-center gap-1 hover:text-ns-secondary cursor-pointer">
                <RefreshCw size={11} /> Chuyển sang {mode === 'text' ? 'voice' : 'text'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
