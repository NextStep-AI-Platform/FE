import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import BrandName from './BrandName'
import LogoMark from './LogoMark'

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-ns-page/80 backdrop-blur-md border-b border-ns-sub">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark brandSize="md" />
          <BrandName size="md" className="hidden sm:inline" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/#features" className="text-ns-muted hover:text-ns-primary text-sm transition-colors">Tính năng</Link>
          <Link to="/#pricing" className="text-ns-muted hover:text-ns-primary text-sm transition-colors">Bảng giá</Link>
          <Link to="/about" className="text-ns-muted hover:text-ns-primary text-sm transition-colors">Về chúng tôi</Link>
          <Link to="/auth" className="text-ns-muted hover:text-ns-primary text-sm border border-ns px-4 py-2 rounded-lg hover:bg-ns-card transition-all">Đăng nhập</Link>
          <Link to="/auth" className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition">Bắt đầu miễn phí</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-ns-muted hover:text-ns-primary cursor-pointer">
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-ns-card border-t border-ns px-6 py-4 space-y-3">
          <Link to="/#features" className="block text-ns-secondary text-sm py-2" onClick={() => setOpen(false)}>Tính năng</Link>
          <Link to="/#pricing" className="block text-ns-secondary text-sm py-2" onClick={() => setOpen(false)}>Bảng giá</Link>
          <Link to="/about" className="block text-ns-secondary text-sm py-2" onClick={() => setOpen(false)}>Về chúng tôi</Link>
          <Link to="/auth" className="block text-ns-secondary text-sm py-2" onClick={() => setOpen(false)}>Đăng nhập</Link>
        </div>
      )}
    </nav>
  )
}
