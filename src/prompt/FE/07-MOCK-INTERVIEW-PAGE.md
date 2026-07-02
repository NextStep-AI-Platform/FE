# NextStep AI — AI Mock Interview Page
# Prompt #07: MockInterviewPage.tsx

## Skill Activation

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "chat interface AI conversation dark modern" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "voice text interaction loading states feedback" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "interview session progress timer messaging" --domain ux
```

---

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.

Build src/pages/MockInterviewPage.tsx — AI mock interview feature page.
All text in Vietnamese. Single file.
This page has 3 states: Setup → Interview Session → Report

### State Structure
```ts
type PageState = 'setup' | 'interview' | 'report'
const [pageState, setPageState] = useState<PageState>('setup')
const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
const [interviewMode, setInterviewMode] = useState<'text' | 'voice'>('text')
const [selectedRole, setSelectedRole] = useState('Frontend Developer')
const [selectedIndustry, setSelectedIndustry] = useState('Công nghệ thông tin')
const [messages, setMessages] = useState<Message[]>([])
const [currentInput, setCurrentInput] = useState('')
const [currentQuestion, setCurrentQuestion] = useState(0)
const [isAiTyping, setIsAiTyping] = useState(false)
const [sessionTime, setSessionTime] = useState(0) // seconds elapsed
const [isRecording, setIsRecording] = useState(false)

interface Message {
  id: number
  role: 'ai' | 'user'
  content: string
  timestamp: string
  questionNumber?: number
  feedback?: string // AI feedback on user answer (premium)
}
```

### Mock Interview Questions
```ts
const mockQuestions = [
  'Hãy giới thiệu bản thân bạn và lý do bạn ứng tuyển vào vị trí Frontend Developer?',
  'Bạn có thể giải thích sự khác biệt giữa React State và Props không?',
  'Kể về một dự án khó khăn nhất bạn đã làm. Bạn đã giải quyết thách thức đó như thế nào?',
  'Bạn xử lý performance optimization trong React như thế nào?',
  'Nếu được nhận vào vị trí này, kế hoạch 3 tháng đầu của bạn là gì?',
]
const mockReport = {
  totalQuestions: 5,
  answeredQuestions: 5,
  duration: '18 phút 32 giây',
  overallScore: 78,
  categoryScores: {
    communication: 80,
    technical: 75,
    problemSolving: 82,
    attitude: 78,
  },
  questionFeedback: [
    { question: mockQuestions[0], score: 82, feedback: 'Phần giới thiệu rõ ràng, có điểm nhấn về kỹ năng. Tuy nhiên nên bổ sung thêm thành tích cụ thể với con số.', improvement: 'Thêm: "Tôi đã tăng performance của app lên 40%..."' },
    { question: mockQuestions[1], score: 70, feedback: 'Câu trả lời đúng về kỹ thuật nhưng thiếu ví dụ minh họa thực tế từ dự án.', improvement: 'Luôn kèm ví dụ: "Trong dự án X, tôi dùng props để..."' },
  ],
  sampleAnswers: [
    { question: mockQuestions[0], sample: 'Xin chào, tôi là [Tên], có 2 năm kinh nghiệm làm Frontend Developer với chuyên môn React.js và TypeScript. Tại công ty trước, tôi đã lead team 3 người xây dựng dashboard analytics, giúp giảm 40% thời gian load page. Tôi ứng tuyển vị trí này vì...' },
  ],
}
```

---

## STATE 1: SETUP

**Layout:** max-w-2xl mx-auto px-4 py-8

**Card:** bg-[#1E293B] border border-[#334155] rounded-2xl p-8

**Header:**
- Premium gate check: if not premium user, show gate banner at very top:
  - bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 mb-6
  - "🔒 Tính năng AI Mock Interview yêu cầu gói trả phí"
  - "Bạn cần mua gói để sử dụng tính năng này" text-slate-400
  - Buttons: "Xem gói 49.000đ/tháng" + "Mua lẻ 1 buổi (19.000đ)" → /pricing
  - (For demo: show setup anyway with isPremium = true mock)

**Title:** "🎤 Cài đặt buổi phỏng vấn" text-xl font-bold text-white

**Field 1: Chọn vị trí phỏng vấn**
- Label: "Vị trí ứng tuyển" text-slate-300 text-sm font-medium
- Text input with autocomplete: bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3
- Placeholder: "Ví dụ: Frontend Developer, Data Analyst..."
- Pre-filled from CV scan if available: "Frontend Developer"

**Field 2: Độ khó**
- Label: "Mức độ phỏng vấn"
- 3 difficulty cards in a row (grid-cols-3):
  
  Easy: bg-green-900/20 border border-green-500/30 text-green-400
  - "😊 Dễ" bold + "Phù hợp cho Fresher/Intern" text-xs
  
  Medium (default selected): bg-blue-900/20 border-2 border-blue-500 text-blue-400
  - "💪 Trung bình" bold + "Phù hợp 1-3 năm kinh nghiệm" text-xs
  
  Hard: bg-red-900/20 border border-red-500/30 text-red-400
  - "🔥 Khó" bold + "Phù hợp Senior/Lead" text-xs

**Field 3: Hình thức phỏng vấn**
- Label: "Hình thức trả lời"
- 2 option cards (grid-cols-2):
  
  Text: "⌨️ Nhập văn bản" + "Gõ câu trả lời của bạn"
  Voice: "🎙️ Giọng nói" + "Nói câu trả lời (yêu cầu microphone)" + "(coming soon)" badge

**Field 4: Số câu hỏi**
- Label: "Số câu hỏi trong buổi"
- Row of options: 3 | 5 | 7 | 10 câu (pill buttons)
- Default: 5
- Note: text-slate-500 text-xs "Thời gian ước tính: ~15-20 phút cho 5 câu"

**Start button:**
- Full-width "🚀 Bắt đầu phỏng vấn" blue gradient py-4 text-lg
- onClick: 
  - setMessages([{ id: 1, role: 'ai', content: 'Xin chào! Tôi là NextStep AI Interviewer. Hôm nay chúng ta sẽ có buổi phỏng vấn cho vị trí Frontend Developer ở mức độ Trung bình. Hãy thoải mái và cố gắng trả lời đầy đủ nhé. Chúng ta bắt đầu nhé!\n\n' + mockQuestions[0], questionNumber: 1 }])
  - setCurrentQuestion(1)
  - setPageState('interview')

---

## STATE 2: INTERVIEW SESSION

**Layout:** Full height flex layout (h-screen or min-h-screen minus topbar)

**Structure:** flex flex-col max-w-4xl mx-auto px-4 py-4 h-full

**TOP BAR (interview-specific):**
- bg-[#1E293B] border border-[#334155] rounded-2xl p-4 mb-4
- flex items-center justify-between
- LEFT: "Buổi phỏng vấn: Frontend Developer" + difficulty badge
- CENTER: Question progress "Câu 1/5" + progress dots (5 dots, filled = answered)
- RIGHT: Timer "18:32" (mm:ss, counts up) text-blue-400 font-mono + "Kết thúc" button (red outline)

**CHAT AREA (flex-1 overflow-y-auto):**
- bg-[#0F172A] rounded-2xl p-4 space-y-4 mb-4
- Message rendering:
  
  AI message (left-aligned):
  - flex items-start gap-3
  - Avatar: 36px circle bg-gradient-to-br from-blue-500 to-blue-700 with "AI" text
  - Bubble: bg-[#1E293B] border border-[#334155] rounded-2xl rounded-tl-sm px-5 py-4 max-w-3xl
  - If message has questionNumber: show badge above bubble "Câu hỏi số {questionNumber}" bg-blue-900/20 text-blue-400 text-xs
  - Content: text-slate-200 text-sm leading-relaxed (whitespace-pre-wrap for line breaks)
  - Timestamp: text-slate-500 text-xs mt-1

  User message (right-aligned):
  - flex items-start gap-3 flex-row-reverse
  - Avatar: 36px circle bg-slate-600 with user initial
  - Bubble: bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-3xl
  - Timestamp: text-blue-200 text-xs mt-1

  AI Typing indicator (when isAiTyping):
  - Same as AI message but bubble contains 3 animated dots (animate-bounce with delays)

**INPUT AREA (bottom, sticky):**
- bg-[#1E293B] border border-[#334155] rounded-2xl p-4
- flex items-end gap-3

  Textarea: 
  - bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-white flex-1 resize-none
  - Placeholder: "Nhập câu trả lời của bạn..."
  - Auto-expand height (min-h-[56px] max-h-40)
  - onKeyDown: Shift+Enter = newline, Enter = submit

  Send button:
  - bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3
  - SendHorizontal icon from lucide
  - disabled when input empty or isAiTyping

**Handle send logic:**
```ts
const handleSend = () => {
  if (!currentInput.trim() || isAiTyping) return
  
  // Add user message
  const userMsg = { id: Date.now(), role: 'user', content: currentInput, timestamp: new Date().toLocaleTimeString() }
  setMessages(prev => [...prev, userMsg])
  setCurrentInput('')
  setIsAiTyping(true)
  
  // Simulate AI response after 1.5-2s
  setTimeout(() => {
    const nextQ = currentQuestion + 1
    let aiContent = ''
    
    if (nextQ <= mockQuestions.length) {
      aiContent = `Cảm ơn câu trả lời của bạn! 👍\n\nBây giờ chúng ta chuyển sang câu hỏi tiếp theo:\n\n${mockQuestions[nextQ - 1]}`
      setCurrentQuestion(nextQ)
    } else {
      aiContent = 'Tuyệt vời! Chúng ta đã hoàn thành tất cả các câu hỏi. Bạn đã trả lời rất tốt! Hãy để tôi tổng hợp kết quả và đánh giá chi tiết cho bạn...'
      setTimeout(() => setPageState('report'), 2000)
    }
    
    setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: aiContent, timestamp: new Date().toLocaleTimeString(), questionNumber: nextQ <= mockQuestions.length ? nextQ : undefined }])
    setIsAiTyping(false)
  }, 1500 + Math.random() * 500)
}
```

---

## STATE 3: REPORT

**Layout:** max-w-4xl mx-auto px-4 py-8 space-y-6

**Header:**
- "🎉 Buổi phỏng vấn đã kết thúc!" text-2xl font-bold text-white
- "Thời gian: 18 phút 32 giây · 5/5 câu đã trả lời" text-slate-400 text-sm

**Overall Score Card:**
- Same score hero as CV Result page
- Score: 78/100
- 4 sub-scores: Giao tiếp / Kỹ thuật / Giải quyết vấn đề / Thái độ (progress bars)

**Question-by-Question Feedback [PREMIUM GATE]:**
- Header: "📋 Phân tích chi tiết từng câu" + lock if not premium
- If premium: accordion/expand list:
  Each question item:
  - Collapsed: question text + score badge
  - Expanded (click to open):
    - "Câu trả lời của bạn": show from messages
    - "AI Nhận xét": text-slate-300 with feedback text
    - "💡 Gợi ý cải thiện": text-blue-400 with improvement text
    - "📝 Câu trả lời mẫu (theo tiêu chuẩn chuyên gia)": bg-[#0F172A] p-4 rounded-xl

**Action buttons:**
- "🔄 Thử lại" → setPageState('setup')
- "📊 Xem kết quả CV" → /cv-result
- "🏠 Về Dashboard" → /dashboard
- "📥 Tải báo cáo PDF" → # (placeholder)

### Technical Requirements
- useEffect for session timer: setInterval every 1 second when pageState === 'interview'
- Clear interval on cleanup
- Auto-scroll chat to bottom on new message: useRef on bottom div + scrollIntoView
- Accordion state: useState with openQuestion index
- All transitions: Tailwind only
```
