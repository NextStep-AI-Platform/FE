import { Link } from 'react-router-dom'
import { Shield, Database, Lock, UserCheck, Mail, FileText, Eye } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import ScrollReveal from '../components/ScrollReveal'

const sections = [
  {
    icon: FileText,
    title: '1. Thông tin chúng tôi thu thập',
    items: [
      'Thông tin tài khoản: họ tên, email, mật khẩu (đã mã hóa trong MVP mock).',
      'Nội dung CV và JD bạn tải lên hoặc dán để phân tích.',
      'Kết quả phân tích, lịch sử scan và cài đặt thông báo.',
      'Dữ liệu phiên (theme, trạng thái đăng nhập) lưu trên trình duyệt qua localStorage.',
    ],
  },
  {
    icon: Database,
    title: '2. Cách chúng tôi sử dụng dữ liệu',
    items: [
      'Cung cấp tính năng phân tích CV, gợi ý công ty/khoá học và luyện phỏng vấn.',
      'Cá nhân hóa trải nghiệm dashboard và thông báo trong ứng dụng.',
      'Cải thiện chất lượng mô hình AI (ở phiên bản production sẽ có chính sách riêng).',
      'Không bán dữ liệu cá nhân cho bên thứ ba.',
    ],
  },
  {
    icon: Lock,
    title: '3. Lưu trữ & bảo mật (MVP)',
    items: [
      'Phiên bản MVP hiện tại lưu dữ liệu cục bộ trên trình duyệt (localStorage).',
      'Dữ liệu chỉ tồn tại trên thiết bị bạn đang sử dụng — xóa cache trình duyệt sẽ mất dữ liệu.',
      'Khi triển khai production, dữ liệu sẽ được mã hóa truyền tải (HTTPS) và lưu trên server bảo mật.',
      'Chúng tôi khuyến nghị không chia sẻ thiết bị đăng nhập với người khác.',
    ],
  },
  {
    icon: UserCheck,
    title: '4. Quyền của bạn',
    items: [
      'Truy cập và chỉnh sửa thông tin hồ sơ trong mục Cài đặt.',
      'Xóa tài khoản và toàn bộ dữ liệu liên quan trong ứng dụng.',
      'Từ chối nhận thông báo marketing qua cài đặt thông báo.',
      'Yêu cầu hỗ trợ về dữ liệu qua email liên hệ bên dưới.',
    ],
  },
  {
    icon: Eye,
    title: '5. Cookie & theo dõi',
    items: [
      'MVP không sử dụng cookie quảng cáo hay theo dõi hành vi bên thứ ba.',
      'Chỉ lưu preference theme và trạng thái app trên localStorage.',
      'Phiên bản sau có thể bổ sung cookie phân tích — sẽ cập nhật chính sách trước khi áp dụng.',
    ],
  },
  {
    icon: Mail,
    title: '6. Liên hệ',
    items: [
      'Email: privacy@nextstep.ai',
      'Chúng tôi phản hồi yêu cầu liên quan quyền riêng tư trong vòng 7 ngày làm việc.',
      'Cập nhật lần cuối: tháng 6/2026.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ns-page">
      <PublicNavbar />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <ScrollReveal direction="fade">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-blue-600/15 rounded-2xl flex items-center justify-center">
            <Shield size={28} className="text-blue-400 keep-accent" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ns-primary">Chính sách bảo mật</h1>
            <p className="text-ns-muted text-sm mt-1">NextStep AI — Phiên bản MVP</p>
          </div>
        </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
        <p className="text-ns-secondary leading-relaxed mb-10 bg-ns-card border border-ns rounded-2xl p-6 card-interactive">
          Chúng tôi coi trọng quyền riêng tư của bạn. Tài liệu này mô tả cách NextStep AI thu thập, sử dụng và bảo vệ
          thông tin trong phiên bản MVP (mock frontend, dữ liệu lưu local). Khi triển khai backend thật, chính sách
          sẽ được cập nhật tương ứng.
        </p>
        </ScrollReveal>

        <div className="space-y-8">
          {sections.map(({ icon: Icon, title, items }, i) => (
            <ScrollReveal key={title} delay={i * 60} direction="up">
            <section className="bg-ns-card border border-ns rounded-2xl p-6 card-interactive">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600/15 rounded-xl flex items-center justify-center">
                  <Icon size={20} className="text-purple-400 keep-accent" />
                </div>
                <h2 className="font-heading font-semibold text-ns-primary text-lg">{title}</h2>
              </div>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item} className="flex gap-2 text-ns-muted text-sm leading-relaxed">
                    <span className="text-blue-400 keep-accent mt-1 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={120}>
        <p className="text-ns-faint text-xs text-center mt-12">
          <Link to="/" className="hover:text-ns-primary transition-colors">← Về trang chủ</Link>
        </p>
        </ScrollReveal>
      </div>
    </div>
  )
}
