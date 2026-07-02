import { Link } from 'react-router-dom'
import {
  Target, Heart, Users, Sparkles, TrendingUp, Award, Globe, ChevronRight,
} from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import AssetImage from '../components/AssetImage'
import ScrollReveal from '../components/ScrollReveal'
import { PICTURE } from '../lib/picture'

const values = [
  { icon: Target, title: 'Cá nhân hóa', desc: 'Mỗi lộ trình được AI thiết kế dựa trên CV và mục tiêu nghề nghiệp riêng của bạn.' },
  { icon: Heart, title: 'Minh bạch', desc: 'Giải thích rõ ràng điểm mạnh, điểm yếu và lý do đề xuất — không “hộp đen”.' },
  { icon: Users, title: 'Cộng đồng', desc: 'Hơn 10.000 người dùng đã tin tưởng NextStep AI trên hành trình tìm việc.' },
  { icon: Sparkles, title: 'Đổi mới', desc: 'Cập nhật mô hình và insight theo thị trường lao động Việt Nam.' },
]

const stats = [
  { icon: TrendingUp, value: '10.000+', label: 'Người dùng' },
  { icon: Award, value: '95%', label: 'Hài lòng' },
  { icon: Globe, value: '500+', label: 'Doanh nghiệp đối tác' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ns-page">
      <PublicNavbar />

      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <ScrollReveal direction="left">
          <div>
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3 keep-accent">Về chúng tôi</p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-ns-primary leading-tight mb-6">
              Đồng hành cùng bạn trên<br />
              <span className="brand-gradient-text">hành trình sự nghiệp</span>
            </h1>
            <p className="text-ns-muted text-lg leading-relaxed mb-8">
              NextStep AI ra đời với sứ mệnh giúp mọi người — đặc biệt là sinh viên và người mới đi làm —
              hiểu rõ vị thế của mình trên thị trường lao động và có lộ trình phát triển cụ thể, khả thi.
            </p>
            <Link to="/auth" className="inline-flex items-center gap-2 btn-primary">
              Bắt đầu miễn phí <ChevronRight size={18} />
            </Link>
          </div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={80}>
          <div className="relative">
            <AssetImage
              src={PICTURE.aboutHero}
              alt="NextStep AI platform"
              className="w-full rounded-2xl border border-ns shadow-card"
              fallback={
                <div className="w-full aspect-[7/4] rounded-2xl bg-gradient-to-br from-purple-900/40 to-blue-900/30 border border-ns flex items-center justify-center">
                  <Sparkles size={48} className="text-purple-400" />
                </div>
              }
            />
          </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-ns-card border-y border-ns py-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal direction="left">
          <AssetImage
            src={PICTURE.aboutMission}
            alt="Sứ mệnh"
            className="w-full rounded-2xl border border-ns order-2 lg:order-1"
            fallback={
              <div className="w-full aspect-[5/3.6] rounded-2xl bg-ns-raised border border-ns flex items-center justify-center">
                <Target size={40} className="text-blue-400" />
              </div>
            }
          />
          </ScrollReveal>
          <ScrollReveal direction="right" delay={80}>
          <div className="order-1 lg:order-2">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-ns-primary mb-4">Sứ mệnh của chúng tôi</h2>
            <p className="text-ns-secondary leading-relaxed mb-4">
              Chúng tôi tin rằng công nghệ AI nên là công cụ dân chủ hóa cơ hội nghề nghiệp — không chỉ dành cho
              ứng viên “top tier”, mà cho bất kỳ ai muốn cải thiện CV và chuẩn bị tốt hơn cho buổi phỏng vấn.
            </p>
            <p className="text-ns-muted leading-relaxed">
              Từ phân tích Coverage Score, gợi ý công ty phù hợp đến luyện phỏng vấn 1-1, mọi tính năng đều hướng tới
              một mục tiêu: giúp bạn biết <strong className="text-ns-primary">bước tiếp theo</strong> là gì.
            </p>
          </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <ScrollReveal className="text-center mb-10">
          <h2 className="font-heading text-2xl font-bold text-ns-primary">Giá trị cốt lõi</h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map(({ icon: Icon, title, desc }, i) => (
            <ScrollReveal key={title} delay={i * 80} direction="up">
            <div className="bg-ns-card border border-ns rounded-2xl p-6 card-interactive h-full">
              <div className="w-12 h-12 bg-blue-600/15 rounded-xl flex items-center justify-center mb-4">
                <Icon size={22} className="text-blue-400 keep-accent" />
              </div>
              <h3 className="font-heading font-semibold text-ns-primary mb-2">{title}</h3>
              <p className="text-ns-muted text-sm leading-relaxed">{desc}</p>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="bg-ns-card border-t border-ns py-14">
        <div className="max-w-4xl mx-auto px-6 grid sm:grid-cols-3 gap-8 text-center">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <ScrollReveal key={label} delay={i * 100} direction="up">
            <div className="badge-pill py-2">
              <Icon size={28} className="text-blue-400 keep-accent mx-auto mb-3" />
              <p className="font-heading text-3xl font-bold text-ns-primary">{value}</p>
              <p className="text-ns-muted text-sm mt-1">{label}</p>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <ScrollReveal>
        <h2 className="font-heading text-2xl font-bold text-ns-primary mb-4">Sẵn sàng khám phá?</h2>
        <p className="text-ns-muted mb-8">Tạo tài khoản miễn phí và nhận 3 lượt phân tích CV mỗi tháng.</p>
        <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
          Đăng ký ngay <ChevronRight size={18} />
        </Link>
        </ScrollReveal>
      </section>

      <footer className="border-t border-ns py-8 px-6 text-center text-ns-faint text-sm">
        <Link to="/" className="hover:text-ns-primary transition-colors">Trang chủ</Link>
        <span className="mx-3">·</span>
        <Link to="/privacy" className="hover:text-ns-primary transition-colors">Chính sách bảo mật</Link>
      </footer>
    </div>
  )
}
