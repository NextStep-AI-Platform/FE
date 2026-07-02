import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Upload, Brain, BarChart2, Star, Building2, BookOpen, Mic,
  Check, X, Menu, ChevronRight, Zap, Shield, Globe,
} from 'lucide-react'

import BrandName from '../components/BrandName'
import LogoMark from '../components/LogoMark'
import AssetImage from '../components/AssetImage'
import ScrollReveal from '../components/ScrollReveal'
import { PICTURE } from '../lib/picture'

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-ns-page font-body">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-ns-page/80 backdrop-blur-md border-b border-ns-sub">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark brandSize="md" />
            <BrandName size="md" className="hidden sm:inline" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-ns-muted hover:text-ns-primary text-sm transition-colors cursor-pointer">Tính năng</a>
            <a href="#pricing" className="text-ns-muted hover:text-ns-primary text-sm transition-colors cursor-pointer">Bảng giá</a>
            <Link to="/about" className="text-ns-muted hover:text-ns-primary text-sm transition-colors">Về chúng tôi</Link>
            <button onClick={() => navigate('/auth')} className="text-ns-muted hover:text-ns-primary text-sm border border-ns px-4 py-2 rounded-lg hover:bg-ns-card transition-all cursor-pointer">
              Đăng nhập
            </button>
            <button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition cursor-pointer">
              Bắt đầu miễn phí
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-ns-muted hover:text-ns-primary cursor-pointer">
            <Menu size={22} />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-ns-card border-t border-ns px-6 py-4 space-y-3">
            <a href="#features" className="block text-ns-secondary text-sm py-2">Tính năng</a>
            <a href="#pricing" className="block text-ns-secondary text-sm py-2">Bảng giá</a>
            <Link to="/about" className="block text-ns-secondary text-sm py-2">Về chúng tôi</Link>
            <button onClick={() => navigate('/auth')} className="w-full text-left text-ns-secondary text-sm py-2">Đăng nhập</button>
            <button onClick={() => navigate('/auth')} className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl">
              Bắt đầu miễn phí
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <ScrollReveal direction="fade" className="inline-flex">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-ns text-ns-secondary text-sm font-medium px-4 py-2 rounded-full mb-8 badge-pill">
          <Zap size={14} className="keep-accent text-blue-400" />
          AI-Powered Career Platform
        </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
        <h1 className="font-heading text-4xl md:text-6xl font-bold text-ns-primary leading-tight mb-6">
          Khám phá con đường sự nghiệp<br />
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            phù hợp với bạn nhất
          </span>
        </h1>
        </ScrollReveal>

        <ScrollReveal delay={120}>
        <p className="text-ns-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          NextStep AI phân tích CV của bạn, đánh giá độ phù hợp theo thị trường lao động thực tế,
          và đề xuất lộ trình phát triển nghề nghiệp cá nhân hóa.
        </p>
        </ScrollReveal>

        <ScrollReveal delay={160}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition text-lg flex items-center gap-2 cursor-pointer"
          >
            Phân tích CV miễn phí <ChevronRight size={20} />
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="border border-ns text-ns-primary font-semibold px-8 py-4 rounded-xl hover:bg-ns-card transition text-lg cursor-pointer"
          >
            Xem demo
          </button>
        </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
        <div className="flex flex-wrap items-center justify-center gap-6 text-ns-faint text-sm">
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> Miễn phí để bắt đầu</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> Không cần thẻ tín dụng</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> Kết quả trong 60 giây</span>
        </div>
        </ScrollReveal>

        <ScrollReveal delay={240} direction="up" className="mt-16 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center text-left">
          <AssetImage
            src={PICTURE.landingHero}
            alt="Phân tích CV với AI"
            className="w-full rounded-2xl border border-ns shadow-card order-2 lg:order-1 hidden sm:block"
            fallback={
              <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-ns flex items-center justify-center order-2 lg:order-1">
                <Brain size={48} className="text-blue-400" />
              </div>
            }
          />
        <div className="bg-ns-card border border-ns rounded-2xl p-6 order-1 lg:order-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-ns-muted text-xs mb-1">Kết quả phân tích</p>
              <p className="text-ns-primary font-semibold font-heading">CV_Frontend_Developer.pdf</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center bg-ns-page">
                <span className="text-blue-400 font-bold text-xl font-heading">87</span>
              </div>
              <p className="text-ns-faint text-xs mt-1">/100</p>
            </div>
          </div>
          {[
            { label: 'ATS Score', value: 85 },
            { label: 'Keyword Match', value: 90 },
            { label: 'Experience Fit', value: 87 },
          ].map(({ label, value }) => (
            <div key={label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ns-muted">{label}</span>
                <span className="text-ns-primary font-medium">{value}%</span>
              </div>
              <div className="h-2 bg-ns-raised rounded-full">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-ns flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-400 text-sm font-medium">Khá tốt — Sẵn sàng ứng tuyển</span>
          </div>
        </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-ns-card/50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ns-primary mb-4">Chỉ 3 bước đơn giản</h2>
            <p className="text-ns-muted text-lg">Từ CV đến lộ trình sự nghiệp trong vài phút</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Upload, title: 'Tải lên CV', desc: 'Tải lên CV PDF hoặc paste nội dung trực tiếp. Hỗ trợ mọi định dạng phổ biến.' },
              { step: '02', icon: Brain, title: 'AI Phân Tích', desc: 'AI đánh giá CV theo ngành nghề và tình hình thị trường lao động hiện tại.' },
              { step: '03', icon: BarChart2, title: 'Nhận Kết Quả', desc: 'Nhận điểm số, điểm mạnh/yếu, khoá học đề xuất và gợi ý công ty phù hợp.' },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
              <div className="relative text-center h-full">
                <div className="bg-ns-card border border-ns rounded-2xl p-8 card-interactive h-full">
                  <div className="text-ns-faint font-heading font-bold text-5xl mb-4">{step}</div>
                  <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Icon size={26} className="text-blue-400" />
                  </div>
                  <h3 className="font-heading font-semibold text-ns-primary text-xl mb-3">{title}</h3>
                  <p className="text-ns-muted text-sm leading-relaxed">{desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight size={24} className="text-blue-500/40" />
                  </div>
                )}
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ns-primary mb-4">Tính năng nổi bật</h2>
            <p className="text-ns-muted text-lg">Mọi thứ bạn cần để tối ưu sự nghiệp</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10',
                title: 'Chấm điểm CV bằng AI',
                desc: 'Phân tích CV theo ngành nghề mục tiêu, kiểm tra ATS-compatibility, keyword gap và chất lượng trình bày.',
              },
              {
                icon: Building2, color: 'text-green-400', bg: 'bg-green-400/10',
                title: 'Gợi ý công ty phù hợp',
                desc: 'So sánh CV với JD thực tế, xếp hạng độ tương thích với các doanh nghiệp đang tuyển dụng.',
              },
              {
                icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-400/10',
                title: 'Lộ trình học tập',
                desc: 'Đề xuất khoá học từ Udemy, Coursera cho từng kỹ năng còn thiếu dựa trên phân tích CV.',
              },
              {
                icon: Mic, color: 'text-blue-400', bg: 'bg-blue-400/10',
                title: 'AI Mock Interview',
                desc: 'Luyện phỏng vấn 1-1 với AI theo đúng vị trí và ngành nghề. Có phân tích chi tiết câu trả lời.',
              },
            ].map(({ icon: Icon, color, bg, title, desc }, i) => (
              <ScrollReveal key={i} delay={(i % 2) * 80} direction={i % 2 === 0 ? 'left' : 'right'}>
              <div className="bg-ns-card border border-ns rounded-2xl p-7 card-interactive group h-full">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon size={24} className={color} />
                </div>
                <h3 className="font-heading font-semibold text-ns-primary text-xl mb-3">{title}</h3>
                <p className="text-ns-muted text-sm leading-relaxed">{desc}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-ns-card/50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { value: '10.000+', label: 'Người dùng đã phân tích CV' },
              { value: '95%', label: 'Người dùng cải thiện CV sau lần đầu' },
              { value: '500+', label: 'Công ty trong cơ sở dữ liệu' },
            ].map(({ value, label }, i) => (
              <ScrollReveal key={label} delay={i * 100} direction="up">
              <div className="badge-pill py-4">
                <div className="font-heading text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
                  {value}
                </div>
                <p className="text-ns-muted text-sm">{label}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ns-primary mb-4">Bảng giá minh bạch</h2>
            <p className="text-ns-muted text-lg">Bắt đầu miễn phí, nâng cấp khi cần</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ScrollReveal delay={0} direction="up">
            <div className="bg-ns-card border border-ns rounded-2xl p-7 flex flex-col card-interactive h-full">
              <p className="text-ns-muted text-xs font-semibold uppercase tracking-wider mb-3">Freemium</p>
              <div className="mb-5">
                <span className="font-heading text-4xl font-bold text-ns-primary">Miễn phí</span>
                <span className="text-ns-muted text-sm ml-2">/mãi mãi</span>
              </div>
              <p className="text-ns-muted text-sm mb-6">Dành cho bạn muốn thử trải nghiệm</p>
              <ul className="space-y-3 mb-8 flex-1">
                {['3 lần scan CV/tháng', 'Phân tích keyword cơ bản', 'Chấm điểm tổng thể', 'Lộ trình học tổng quát'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                    <Check size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
                {['Gợi ý công ty phù hợp', 'AI Mock Interview'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ns-faint">
                    <X size={15} className="text-ns-faint mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/auth')} className="w-full border border-ns text-ns-primary py-3 rounded-xl font-semibold hover:bg-ns-raised transition cursor-pointer">
                Bắt đầu miễn phí
              </button>
            </div>
            </ScrollReveal>

            <ScrollReveal delay={100} direction="up">
            <div className="relative landing-premium-card bg-gradient-to-b from-[#1E3A5F] to-[#1E293B] border-2 border-blue-500 rounded-2xl p-7 flex flex-col card-interactive h-full">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full badge-pill">
                ⭐ Phổ biến nhất
              </div>
              <p className="text-blue-400 keep-accent text-xs font-semibold uppercase tracking-wider mb-3">Premium Analysis</p>
              <div className="mb-1">
                <span className="font-heading text-4xl font-bold text-white">49.000đ</span>
                <span className="text-ns-muted text-sm ml-2">/tháng</span>
              </div>
              <p className="text-ns-faint text-xs mb-5">hoặc 99.000đ/3 tháng</p>
              <p className="text-ns-muted text-sm mb-6">Dành cho người tìm việc nghiêm túc</p>
              <ul className="space-y-3 mb-8 flex-1">
                {['Scan CV không giới hạn', 'Phân tích ATS chi tiết', 'Chỉnh sửa CV bằng AI', 'Lộ trình học + link khoá học', 'Gợi ý công ty phù hợp'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                    <Check size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm text-ns-faint">
                  <X size={15} className="text-ns-faint mt-0.5 flex-shrink-0" /> AI Mock Interview
                </li>
              </ul>
              <button onClick={() => navigate('/auth')} className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition cursor-pointer">
                Nâng cấp ngay
              </button>
            </div>
            </ScrollReveal>

            <ScrollReveal delay={200} direction="up">
            <div className="bg-ns-card border border-ns rounded-2xl p-7 flex flex-col card-interactive h-full">
              <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">AI Mock Interview</p>
              <div className="mb-1">
                <span className="font-heading text-4xl font-bold text-ns-primary">149.000đ</span>
                <span className="text-ns-muted text-sm ml-2">/5 buổi</span>
              </div>
              <p className="text-ns-faint text-xs mb-5">Lẻ: 19.000–29.000đ/buổi</p>
              <p className="text-ns-muted text-sm mb-6">Dành cho bạn chuẩn bị phỏng vấn thực tế</p>
              <ul className="space-y-3 mb-8 flex-1">
                {['5 buổi phỏng vấn AI 1-1', 'Câu hỏi theo ngành nghề & vị trí', 'Điều chỉnh độ khó (Dễ/Vừa/Khó)', 'Báo cáo lỗi chi tiết từng câu', 'Câu trả lời mẫu chuẩn chuyên gia', 'Bao gồm scan CV không giới hạn'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                    <Check size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/pricing')} className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition cursor-pointer">
                Mua gói VIP
              </button>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="py-20 bg-ns-card/50">
        <ScrollReveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-ns-primary mb-5">
            Sẵn sàng tối ưu sự nghiệp của bạn?
          </h2>
          <p className="text-ns-muted text-lg mb-8">
            Tham gia cùng hơn 10.000 người dùng đã tìm thấy con đường sự nghiệp với NextStep AI
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold px-10 py-4 rounded-xl hover:opacity-90 transition text-lg cursor-pointer"
          >
            Bắt đầu miễn phí ngay →
          </button>
          <p className="text-ns-faint text-sm mt-4">Không cần thẻ tín dụng · Miễn phí mãi mãi</p>
        </ScrollReveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-ns-sub bg-ns-page py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <LogoMark brandSize="sm" />
              <BrandName size="sm" />
            </div>
            <p className="text-ns-faint text-sm">Đồng hành cùng bạn trên mọi bước sự nghiệp.</p>
            <div className="flex items-center gap-6 text-sm text-ns-faint">
              <a href="#features" className="hover:text-ns-primary transition-colors">Tính năng</a>
              <a href="#pricing" className="hover:text-ns-primary transition-colors">Bảng giá</a>
              <Link to="/about" className="hover:text-ns-primary transition-colors">Về chúng tôi</Link>
              <Link to="/privacy" className="hover:text-ns-primary transition-colors">Chính sách bảo mật</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-ns-sub flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-ns-faint text-xs">© 2025 NextStep AI. All rights reserved.</p>
            <div className="flex items-center gap-5 text-ns-faint text-xs">
              <span className="flex items-center gap-1.5"><Shield size={12} /> Bảo mật SSL</span>
              <span className="flex items-center gap-1.5"><Globe size={12} /> Made in Vietnam</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
