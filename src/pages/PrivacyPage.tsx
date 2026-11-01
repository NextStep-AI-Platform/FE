import { Link } from 'react-router-dom'
import { Shield, Database, Lock, UserCheck, Mail, FileText, Eye } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import ScrollReveal from '../components/ScrollReveal'
import { USE_API } from '../lib/config'

const mockSections = [
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
      'Hiện chưa có email hoặc biểu mẫu hỗ trợ chính thức được xác nhận để công bố tại đây.',
      'Vui lòng liên hệ nhóm vận hành qua kênh trao đổi đã được cung cấp cho tài khoản của bạn.',
    ],
  },
]

const apiSections = [
  {
    icon: FileText,
    title: '1. Dữ liệu tài khoản và sử dụng dịch vụ',
    items: [
      'Tài khoản, hồ sơ, nội dung CV/JD và kết quả phân tích được xử lý qua máy chủ khi bạn dùng các tính năng tương ứng.',
      'Thông tin gói và giao dịch thanh toán được máy chủ quản lý; xóa dữ liệu trên trình duyệt không xóa hồ sơ máy chủ.',
    ],
  },
  {
    icon: UserCheck,
    title: '2. Chỉnh sửa và yêu cầu xử lý tài khoản',
    items: [
      'Bạn có thể chỉnh sửa các trường hồ sơ được hỗ trợ trong trang Hồ Sơ; thay đổi chỉ được ghi nhận sau khi máy chủ xác nhận.',
      'Bạn có thể bấm Xóa tài khoản trong Hồ Sơ. Sau khi máy chủ xác nhận, tài khoản không thể đăng nhập lại.',
      'Tài khoản được đánh dấu đã xóa; dữ liệu hồ sơ, phân tích và giao dịch thanh toán cũ không bị xóa vật lý ở bước này. Thời hạn lưu cụ thể chưa được công bố trên trang này.',
      'Nếu cần hỗ trợ thêm về dữ liệu, vui lòng liên hệ nhóm vận hành qua kênh trao đổi đã được cung cấp cho tài khoản của bạn.',
    ],
  },
  {
    icon: Mail,
    title: '3. Kênh liên hệ',
    items: [
      'Hiện chưa có email hoặc biểu mẫu hỗ trợ chính thức được xác nhận để công bố tại đây.',
      'Kênh hỗ trợ chính thức và thời hạn lưu hồ sơ giao dịch cần được nhóm vận hành công bố riêng.',
    ],
  },
]

export default function PrivacyPage() {
  const sections = USE_API ? apiSections : mockSections
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
            <h1 className="font-heading text-3xl font-bold text-ns-primary">{USE_API ? 'Thông tin dữ liệu và hỗ trợ' : 'Chính sách bảo mật'}</h1>
            <p className="text-ns-muted text-sm mt-1">NextStep AI</p>
          </div>
        </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
        <p className="text-ns-secondary leading-relaxed mb-10 bg-ns-card border border-ns rounded-2xl p-6 card-interactive">
          {USE_API
            ? 'Thông tin dưới đây mô tả các thao tác hiện có đối với tài khoản dùng máy chủ. Nút xóa tài khoản sẽ vô hiệu hóa đăng nhập sau khi máy chủ xác nhận, đồng thời giữ giao dịch thanh toán cũ để đối soát.'
            : 'Tài liệu này mô tả cách NextStep AI xử lý dữ liệu trong phiên bản MVP dùng dữ liệu cục bộ trên trình duyệt.'}
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
