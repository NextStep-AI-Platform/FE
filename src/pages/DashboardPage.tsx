import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, FileText, Building2, BookOpen, Upload, Mic, Lock, ChevronRight, ScanLine, ExternalLink } from 'lucide-react'
import { PLAN_LIMITS, ROUTES } from '../constants'
import { useApp } from '../contexts/AppContext'
import { aggregateCourses, getQualifyingScans } from '../lib/dashboardInsights'
import { PICTURE } from '../lib/picture'
import { formatDateTime, getScoreBarColor, getScoreLabel } from '../lib/utils'

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-ns-muted">{label}</span>
        <span className="text-ns-primary font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-ns-raised rounded-full">
        <div className={`h-full ${getScoreBarColor(value)} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, plan, scans, isPremium, isVip, scansRemaining } = useApp()
  const premium = isPremium()
  const vip = isVip()

  const scansLimit = plan.type === 'free' ? PLAN_LIMITS.free.scansPerMonth : Infinity
  const remaining = scansRemaining()
  const scansUsed = plan.type === 'free' ? scansLimit - remaining : scans.length
  const scansLeft = plan.type === 'free' ? remaining : Infinity

  const latestScan = [...scans].sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())[0]
  const latestScores = latestScan?.result.scores
  const scoreInfo = latestScores ? getScoreLabel(latestScores.overall) : null
  const recentScans = [...scans].sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()).slice(0, 3)
  const qualifyingScans = useMemo(() => (premium ? getQualifyingScans(scans) : []), [premium, scans])
  const aggregatedCourses = useMemo(() => (premium ? aggregateCourses(scans) : []), [premium, scans])

  const firstName = user?.name.split(' ').pop() ?? 'bạn'

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-ns-card border border-ns rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <h2 className="font-heading text-xl font-bold text-ns-primary mb-1">
              Xin chào, {firstName} 👋
            </h2>
            <p className="text-ns-muted text-sm">
              {plan.type === 'free' ? (
                <>Bạn đã sử dụng <span className={scansLeft <= 1 ? 'text-yellow-400 font-semibold' : 'text-ns-primary font-semibold'}>{scansUsed}/{scansLimit}</span> lượt phân tích CV miễn phí tháng này</>
              ) : (
                <>Gói {plan.type === 'vip' ? 'VIP' : 'Premium'} — phân tích CV không giới hạn</>
              )}
            </p>
            {plan.type === 'free' && (
            <div className="mt-3 w-full max-w-xs bg-ns-raised h-2 rounded-full">
              <div
                className={`h-full rounded-full ${scansLeft === 0 ? 'bg-red-500' : scansLeft === 1 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${(scansUsed / scansLimit) * 100}%` }}
              />
            </div>
            )}
          </div>
          {!premium && (
            <button
              onClick={() => navigate('/pricing')}
              className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              ✨ Nâng cấp Premium
            </button>
          )}
        </div>
        {!premium && (
          <div
            className="mt-4 promo-strip border border-blue-500/20 rounded-xl p-4 flex items-center gap-3 relative overflow-hidden"
            style={{ backgroundImage: `url(${PICTURE.dashboardPremiumBanner})`, backgroundSize: 'cover', backgroundPosition: 'right' }}
          >
            <div className="absolute inset-0 bg-ns-card/85" />
            <span className="text-blue-400 text-sm relative z-10">🚀 Nâng cấp Premium để scan không giới hạn và nhận insight chuyên sâu từ AI</span>
            <button onClick={() => navigate('/pricing')} className="flex-shrink-0 text-blue-400 text-xs underline cursor-pointer hover:text-blue-300 relative z-10">Xem gói</button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Điểm CV gần nhất', value: latestScan ? `${latestScan.overallScore}/100` : '—', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Lượt scan còn lại', value: plan.type === 'free' ? `${scansLeft} lượt` : '∞', icon: ScanLine, color: scansLeft <= 1 && plan.type === 'free' ? 'text-yellow-400' : 'text-blue-400', bg: scansLeft <= 1 && plan.type === 'free' ? 'bg-yellow-400/10' : 'bg-blue-400/10' },
          { label: 'Công ty phù hợp', value: premium ? `${qualifyingScans.length} lượt` : '—', icon: Building2, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Khoá học đề xuất', value: premium ? `${aggregatedCourses.length} khoá` : '—', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-ns-card border border-ns rounded-2xl p-5 card-interactive">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-ns-muted text-xs mb-1">{label}</p>
            <p className="font-heading font-bold text-ns-primary text-xl">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-5">
        <div
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-7 cursor-pointer hover:opacity-95 hover:scale-[1.01] transition-transform animate-slide-up"
          onClick={() => navigate('/cv-scan')}
          style={{ backgroundImage: `url(${PICTURE.dashboardCvBanner})`, backgroundSize: 'cover', backgroundPosition: 'right center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-800/85" />
          <div className="relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
            <Upload size={24} className="text-white" />
          </div>
          <h3 className="font-heading font-bold text-white text-xl mb-2">Phân tích CV mới</h3>
          <p className="text-blue-200 text-sm mb-5 leading-relaxed">Tải lên CV và nhận đánh giá chi tiết trong 60 giây</p>
          <button className="bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition cursor-pointer flex items-center gap-2">
            Bắt đầu ngay <ChevronRight size={16} />
          </button>
          </div>
        </div>

        <div
          className="bg-ns-card border border-ns rounded-2xl p-7 relative overflow-hidden card-interactive"
          style={{ backgroundImage: `url(${PICTURE.dashboardInterviewBanner})`, backgroundSize: 'cover', backgroundPosition: 'right center' }}
        >
          <div className="absolute inset-0 bg-ns-card/90" />
          <div className="relative z-10">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-5">
            <Mic size={24} className="text-blue-400" />
          </div>
          <h3 className="font-heading font-bold text-ns-primary text-xl mb-2">Luyện phỏng vấn AI</h3>
          <p className="text-ns-muted text-sm mb-5 leading-relaxed">Mô phỏng buổi phỏng vấn thực tế với AI cho vị trí bạn muốn</p>
          {!vip ? (
            <button onClick={() => navigate('/pricing')} className="border border-blue-500/40 text-blue-400 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-500/10 transition cursor-pointer flex items-center gap-2">
              <Lock size={14} /> Nâng cấp VIP để dùng
            </button>
          ) : (
            <button onClick={() => navigate('/mock-interview')} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition cursor-pointer flex items-center gap-2">
              Bắt đầu luyện <ChevronRight size={16} />
            </button>
          )}
          </div>
        </div>
      </div>

      {/* CV Score Overview */}
      {latestScan && latestScores && scoreInfo && (
      <div className="bg-ns-card border border-ns rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-semibold text-ns-primary text-lg">Điểm phân tích CV gần nhất</h3>
          <button onClick={() => navigate(ROUTES.ANALYSIS_DETAIL(latestScan.id))} className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 cursor-pointer">
            Xem chi tiết <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-shrink-0 text-center">
            <div className="w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center bg-ns-page mx-auto">
              <div>
                <span className="font-heading font-bold text-blue-400 text-4xl">{latestScores.overall}</span>
                <span className="text-ns-faint text-sm">/100</span>
              </div>
            </div>
            <div className={`mt-3 inline-block px-4 py-1 rounded-full text-sm font-medium ${scoreInfo.bg} ${scoreInfo.color}`}>
              {scoreInfo.label}
            </div>
          </div>
          <div className="flex-1 w-full space-y-4">
            <ScoreBar label="ATS Compatibility" value={latestScores.ats} />
            <ScoreBar label="Keyword Match" value={latestScores.keyword} />
            <ScoreBar label="Experience Fit" value={latestScores.experience} />
            <ScoreBar label="CV Presentation" value={latestScores.presentation} />
          </div>
        </div>
      </div>
      )}

      {/* Recent Scans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-ns-primary text-lg">Lịch sử phân tích</h3>
          <button onClick={() => navigate(ROUTES.ANALYSIS)} className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 cursor-pointer">
            Xem tất cả <ChevronRight size={14} />
          </button>
        </div>
        {recentScans.length === 0 ? (
          <div className="bg-ns-card border border-ns rounded-xl p-8 text-center">
            <p className="text-ns-muted text-sm mb-3">Chưa có lần phân tích nào</p>
            <button onClick={() => navigate('/cv-scan')} className="text-blue-400 text-sm hover:text-blue-300 cursor-pointer">Phân tích CV đầu tiên</button>
          </div>
        ) : (
        <div className="space-y-3">
          {recentScans.map(scan => (
            <div key={scan.id} className="bg-ns-card border border-ns rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-ns-primary text-sm font-medium truncate">{scan.title}</p>
                  <p className="text-ns-faint text-xs">{formatDateTime(scan.analyzedAt)}</p>
                </div>
              </div>
              <span className="hidden sm:block text-ns-muted text-sm flex-shrink-0">{scan.role}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="bg-blue-600/20 text-blue-400 rounded-lg px-3 py-1 text-sm font-semibold">{scan.overallScore}</span>
                <button onClick={() => navigate(ROUTES.ANALYSIS_DETAIL(scan.id))} className="text-ns-muted hover:text-ns-primary text-xs border border-ns px-3 py-1.5 rounded-lg hover:bg-ns-raised transition cursor-pointer">
                  Xem lại
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
        <div className="bg-ns-card border border-ns rounded-2xl p-6 relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-ns-primary">Công ty phù hợp với bạn</h3>
            {!premium && <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full flex items-center gap-1"><Lock size={10} /> Premium</span>}
          </div>
          {premium ? (
            qualifyingScans.length === 0 ? (
              <p className="text-ns-muted text-sm py-6 text-center">Chưa có lượt scan ≥70 điểm trong 30 ngày qua</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {qualifyingScans.map(item => (
                  <button key={item.scanId} type="button" onClick={() => navigate(ROUTES.ANALYSIS_DETAIL(item.scanId))}
                    className="w-full flex items-center gap-3 p-3 bg-ns-page rounded-xl hover:border-blue-500/40 border border-transparent transition cursor-pointer text-left">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ns-primary text-sm font-medium truncate">{item.title}</p>
                      <p className="text-ns-faint text-xs truncate">{item.topCompanyName ?? item.company} · {formatDateTime(item.analyzedAt)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${item.score >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>{item.score}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <>
              <div className="space-y-3 blur-sm select-none pointer-events-none opacity-60">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-ns-page rounded-xl" />)}</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-ns-card border border-blue-500/30 rounded-2xl p-5 text-center mx-4">
                  <Lock size={24} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-ns-primary text-sm font-semibold mb-3">Mở khóa gợi ý công ty</p>
                  <button onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">Nâng cấp Premium</button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="bg-ns-card border border-ns rounded-2xl p-6 relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-ns-primary">Khoá học nên học tiếp theo</h3>
            {!premium && <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full flex items-center gap-1"><Lock size={10} /> Premium</span>}
          </div>
          {premium ? (
            aggregatedCourses.length === 0 ? (
              <p className="text-ns-muted text-sm py-6 text-center">Chưa có khoá học đề xuất trong 30 ngày qua</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {aggregatedCourses.map(c => (
                  <button key={c.url || c.title} type="button" onClick={() => window.open(c.url, '_blank', 'noopener,noreferrer')}
                    className="w-full p-3 bg-ns-page rounded-xl flex items-start gap-3 hover:border-orange-500/30 border border-transparent transition cursor-pointer text-left">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} className="text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ns-primary text-sm font-medium line-clamp-2">{c.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-orange-400">{c.platform}</span>
                        <span className="text-xs text-yellow-400">⭐ {c.rating}</span>
                        <span className="text-xs text-blue-400">{c.skill}</span>
                        {c.count > 1 && <span className="text-xs text-purple-400">{c.count}× đề xuất</span>}
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-ns-faint flex-shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            )
          ) : (
            <>
              <div className="space-y-3 blur-sm select-none pointer-events-none opacity-60">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-ns-page rounded-xl" />)}</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-ns-card border border-blue-500/30 rounded-2xl p-5 text-center mx-4">
                  <Lock size={24} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-ns-primary text-sm font-semibold mb-3">Mở khóa gợi ý khoá học</p>
                  <button onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">Nâng cấp Premium</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
