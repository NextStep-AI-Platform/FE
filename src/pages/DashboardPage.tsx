import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, FileText, Building2, BookOpen, Upload, Mic, Lock, ChevronRight, ScanLine, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { PLAN_LIMITS, ROUTES } from '../constants'
import { useApp } from '../contexts/AppContext'
import { aggregateCourses, getQualifyingScans } from '../lib/dashboardInsights'
import { getAnalysis, listAnalyses } from '../lib/api/analysis'
import type { AnalysisListItem } from '../lib/api/analysis'
import { USE_API } from '../lib/config'
import { courseDisplayTitle, verifiedCourseUrl } from '../lib/courseLinks'
import { PICTURE } from '../lib/picture'
import { formatDateTime, formatScanDisplayTitle, getScoreBarColor, getScoreLabel } from '../lib/utils'
import type { ScanRecord } from '../types'

const DASHBOARD_DETAIL_LIMIT = 10

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
  const [remoteAnalyses, setRemoteAnalyses] = useState<AnalysisListItem[]>([])
  const [remoteDetails, setRemoteDetails] = useState<ScanRecord[]>([])
  const [analysisLoading, setAnalysisLoading] = useState(USE_API)
  const [detailsLoading, setDetailsLoading] = useState(USE_API)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!USE_API) return
    let cancelled = false

    setAnalysisLoading(true)
    setDetailsLoading(true)
    setAnalysisError(null)
    setRemoteDetails([])

    listAnalyses()
      .then(async response => {
        const sorted = [...response.items].sort(
          (left, right) =>
            new Date(right.analyzedAt).getTime() - new Date(left.analyzedAt).getTime(),
        )
        if (!cancelled) {
          setRemoteAnalyses(sorted)
          setAnalysisLoading(false)
        }

        const detailTargets = sorted.slice(
          0,
          premium ? DASHBOARD_DETAIL_LIMIT : Math.min(1, sorted.length),
        )
        const detailResults = await Promise.allSettled(
          detailTargets.map(item => getAnalysis(item.id)),
        )
        if (!cancelled) {
          setRemoteDetails(
            detailResults.flatMap(result =>
              result.status === 'fulfilled' ? [result.value] : [],
            ),
          )
          setDetailsLoading(false)
        }
      })
      .catch(error => {
        console.error('Unable to load Dashboard analysis data', error)
        if (!cancelled) {
          setRemoteAnalyses([])
          setRemoteDetails([])
          setAnalysisError('Không thể đồng bộ dữ liệu phân tích. Vui lòng thử lại.')
          setAnalysisLoading(false)
          setDetailsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [premium, reloadKey])

  const analysisSummaries = USE_API ? remoteAnalyses : scans
  const analysisDetails = USE_API ? remoteDetails : scans

  const scansLimit = plan.type === 'free' ? PLAN_LIMITS.free.scansPerMonth : 15
  const remaining = scansRemaining()
  const scansUsed = scansLimit - remaining
  const scansLeft = remaining

  const sortedAnalyses = useMemo(
    () => [...analysisSummaries].sort(
      (left, right) =>
        new Date(right.analyzedAt).getTime() - new Date(left.analyzedAt).getTime(),
    ),
    [analysisSummaries],
  )
  const latestAnalysis = sortedAnalyses[0]
  const latestDetail = analysisDetails.find(item => item.id === latestAnalysis?.id)
  const latestScores = latestDetail?.result.scores
  const scoreInfo = latestScores ? getScoreLabel(latestScores.overall) : null
  const recentScans = sortedAnalyses.slice(0, 3)
  const qualifyingScans = useMemo(
    () => (premium ? getQualifyingScans(analysisDetails) : []),
    [premium, analysisDetails],
  )
  const aggregatedCourses = useMemo(
    () => (premium ? aggregateCourses(analysisDetails) : []),
    [premium, analysisDetails],
  )

  const firstName = user?.name.split(' ').pop() ?? 'bạn'

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-ns-card border border-ns rounded-2xl p-6 relative overflow-hidden shadow-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <h2 className="font-heading text-xl font-bold text-ns-primary mb-1">
              Xin chào, {firstName} 👋
            </h2>
            <p className="text-ns-muted text-sm">
              {plan.type === 'free' ? (
                <>Bạn đã sử dụng <span className={scansLeft <= 1 ? 'text-yellow-400 font-semibold' : 'text-ns-primary font-semibold'}>{scansUsed}/{scansLimit}</span> lượt phân tích CV tháng này</>
              ) : (
                <>Gói {plan.type === 'vip' ? 'VIP' : 'Premium'} — tối đa 15 lượt phân tích CV/tháng</>
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
              Xem các gói
            </button>
          )}
        </div>
        {!premium && (
          <div
            className="mt-4 promo-strip border border-blue-500/20 rounded-xl p-4 flex items-center gap-3 relative overflow-hidden"
            style={{ backgroundImage: `url(${PICTURE.dashboardPremiumBanner})`, backgroundSize: 'cover', backgroundPosition: 'right' }}
          >
            <div className="absolute inset-0 bg-ns-card/85" />
            <span className="text-blue-400 text-sm relative z-10">Gói Free có 3 lượt scan mỗi tháng. Xem trang gói dịch vụ để biết trạng thái thanh toán.</span>
            <button onClick={() => navigate('/pricing')} className="flex-shrink-0 text-blue-400 text-xs underline cursor-pointer hover:text-blue-300 relative z-10">Xem gói</button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Điểm CV gần nhất', value: analysisLoading ? '...' : latestAnalysis ? `${latestAnalysis.overallScore}/100` : '—', icon: Star, color: 'keep-accent text-yellow-400', bg: 'bg-yellow-400/10', tile: 'stat-icon-tile-yellow' },
          { label: 'Lượt scan còn lại', value: `${scansLeft} lượt`, icon: ScanLine, color: scansLeft <= 1 ? 'keep-accent text-yellow-400' : 'keep-accent text-blue-400', bg: scansLeft <= 1 ? 'bg-yellow-400/10' : 'bg-blue-400/10', tile: scansLeft <= 1 ? 'stat-icon-tile-yellow' : 'stat-icon-tile-blue' },
          { label: 'Công ty phù hợp', value: premium ? (detailsLoading ? '...' : `${qualifyingScans.length} lượt`) : '—', icon: Building2, color: 'keep-accent text-green-400', bg: 'bg-green-400/10', tile: 'stat-icon-tile-green' },
          { label: 'Chủ đề học đề xuất', value: premium ? (detailsLoading ? '...' : `${aggregatedCourses.length} chủ đề`) : '—', icon: BookOpen, color: 'keep-accent text-purple-400', bg: 'bg-purple-400/10', tile: 'stat-icon-tile-purple' },
        ].map(({ label, value, icon: Icon, color, bg, tile }) => (
          <div key={label} className="bg-ns-card border border-ns rounded-2xl p-5 card-interactive dashboard-stat-card">
            <div className={`w-10 h-10 ${bg} ${tile} stat-icon-tile rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-ns-muted text-xs mb-1">{label}</p>
            <p className="font-heading font-bold text-ns-primary text-xl">{value}</p>
          </div>
        ))}
      </div>

      {analysisError && (
        <div className="bg-ns-card border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-ns-muted text-sm flex-1">{analysisError}</p>
          <button
            onClick={() => setReloadKey(value => value + 1)}
            className="inline-flex items-center justify-center gap-2 text-blue-400 text-sm hover:text-blue-300 cursor-pointer"
          >
            <RefreshCw size={15} /> Thử lại
          </button>
        </div>
      )}

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
          className="bg-slate-950 border border-slate-700 rounded-2xl p-7 relative overflow-hidden card-interactive"
          style={{ backgroundImage: `url(${PICTURE.dashboardInterviewBanner})`, backgroundSize: 'cover', backgroundPosition: 'right center' }}
        >
          <div className="absolute inset-0 bg-slate-950/85" />
          <div className="relative z-10">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-5">
            <Mic size={24} className="text-blue-200" />
          </div>
          <h3 className="font-heading font-bold text-white text-xl mb-2">Luyện phỏng vấn AI</h3>
          <p className="text-slate-200 text-sm mb-5 leading-relaxed">Mô phỏng buổi phỏng vấn thực tế với AI cho vị trí bạn muốn</p>
          {!vip ? (
            <button onClick={() => navigate('/pricing')} className="border border-blue-300/60 text-blue-100 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-2">
              <Lock size={14} /> Xem gói VIP
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
      {analysisLoading || detailsLoading ? (
        <div className="h-56 bg-ns-card border border-ns rounded-2xl animate-pulse" aria-label="Đang tải điểm phân tích gần nhất" />
      ) : latestAnalysis && latestScores && scoreInfo ? (
      <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-semibold text-ns-primary text-lg">Điểm phân tích CV gần nhất</h3>
          <button onClick={() => navigate(ROUTES.ANALYSIS_DETAIL(latestAnalysis.id))} className="keep-accent text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 cursor-pointer">
            Xem chi tiết <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-shrink-0 text-center">
            <div className="w-32 h-32 rounded-full border-8 border-blue-500 score-ring-light flex items-center justify-center bg-ns-page mx-auto">
              <div>
                <span className="font-heading font-bold keep-accent text-blue-400 text-4xl">{latestScores.overall}</span>
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
      ) : latestAnalysis ? (
        <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-ns-primary mb-1">Điểm phân tích CV gần nhất</h3>
            <p className="text-ns-muted text-sm">
              Điểm tổng: <span className="text-blue-400 font-semibold">{latestAnalysis.overallScore}/100</span>. Chi tiết các thành phần chưa tải được.
            </p>
          </div>
          <button
            onClick={() => navigate(ROUTES.ANALYSIS_DETAIL(latestAnalysis.id))}
            className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            Mở kết quả <ChevronRight size={14} />
          </button>
        </div>
      ) : null}

      {/* Recent Scans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-ns-primary text-lg">Lịch sử phân tích</h3>
          <button onClick={() => navigate(ROUTES.ANALYSIS)} className="keep-accent text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 cursor-pointer">
            Xem tất cả <ChevronRight size={14} />
          </button>
        </div>
        {analysisLoading ? (
          <div className="space-y-3" aria-label="Đang tải lịch sử phân tích">
            {[0, 1, 2].map(item => (
              <div key={item} className="h-[70px] bg-ns-card border border-ns rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentScans.length === 0 ? (
          <div className="bg-ns-card border border-ns rounded-xl p-8 text-center shadow-card">
            <p className="text-ns-muted text-sm mb-3">Chưa có lần phân tích nào</p>
            <button onClick={() => navigate('/cv-scan')} className="keep-accent text-blue-400 text-sm hover:text-blue-300 cursor-pointer">Phân tích CV đầu tiên</button>
          </div>
        ) : (
        <div className="space-y-3">
          {recentScans.map(scan => {
            const scoreInfo = getScoreLabel(scan.overallScore)
            return (
            <div key={scan.id} className="bg-ns-card border border-ns rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-blue-500/30 transition-all scan-history-row">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-blue-400/10 stat-icon-tile stat-icon-tile-blue rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="keep-accent text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-ns-primary text-sm font-medium truncate">{formatScanDisplayTitle(scan.title)}</p>
                  <p className="text-ns-faint text-xs">{formatDateTime(scan.analyzedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`rounded-lg px-3 py-1 text-sm font-bold ${scoreInfo.bg} ${scoreInfo.color}`}>
                  {scan.overallScore}
                </span>
                <button onClick={() => navigate(ROUTES.ANALYSIS_DETAIL(scan.id))} className="text-ns-muted hover:text-ns-primary text-xs border border-ns px-3 py-1.5 rounded-lg hover:bg-ns-raised transition cursor-pointer">
                  Xem lại
                </button>
              </div>
            </div>
            )
          })}
        </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
        <div className="bg-ns-card border border-ns rounded-2xl p-6 relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-ns-primary">Công ty phù hợp với bạn</h3>
            {!premium && <span className="text-xs premium-lock-badge px-2 py-1 rounded-full flex items-center gap-1 keep-accent text-yellow-400"><Lock size={10} /> Premium</span>}
          </div>
          {premium ? (
            detailsLoading ? (
              <div className="space-y-3" aria-label="Đang tải gợi ý công ty">
                {[0, 1, 2].map(item => <div key={item} className="h-14 bg-ns-page rounded-xl animate-pulse" />)}
              </div>
            ) : qualifyingScans.length === 0 ? (
              <p className="text-ns-muted text-sm py-6 text-center">Chưa có lượt scan ≥70 điểm trong 30 ngày qua</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {qualifyingScans.map(item => (
                  <button key={item.scanId} type="button" onClick={() => navigate(ROUTES.ANALYSIS_DETAIL(item.scanId))}
                    className="w-full flex items-center gap-3 p-3 bg-ns-page rounded-xl hover:border-blue-500/40 border border-transparent transition cursor-pointer text-left insight-list-item">
                    <div className="w-9 h-9 rounded-full bg-green-400/10 stat-icon-tile stat-icon-tile-green flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="keep-accent text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ns-primary text-sm font-medium truncate">{item.title}</p>
                      <p className="text-ns-faint text-xs truncate">{item.topCompanyName ?? item.company} · {formatDateTime(item.analyzedAt)}</p>
                    </div>
                    <span className={`text-sm font-semibold keep-accent ${item.score >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>{item.score}</span>
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
                  <button onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">Xem các gói</button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="bg-ns-card border border-ns rounded-2xl p-6 relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-ns-primary">Chủ đề nên học tiếp theo</h3>
            {!premium && <span className="text-xs premium-lock-badge px-2 py-1 rounded-full flex items-center gap-1 keep-accent text-yellow-400"><Lock size={10} /> Premium</span>}
          </div>
          {premium ? (
            detailsLoading ? (
              <div className="space-y-3" aria-label="Đang tải khóa học đề xuất">
                {[0, 1, 2].map(item => <div key={item} className="h-14 bg-ns-page rounded-xl animate-pulse" />)}
              </div>
            ) : aggregatedCourses.length === 0 ? (
              <p className="text-ns-muted text-sm py-6 text-center">Chưa có chủ đề học đề xuất trong 30 ngày qua</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {aggregatedCourses.map(c => {
                  const url = verifiedCourseUrl(c)
                  const content = <>
                    <div className="w-8 h-8 bg-orange-500/20 stat-icon-tile stat-icon-tile-orange rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} className="keep-accent text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ns-primary text-sm font-medium line-clamp-2">{courseDisplayTitle(c)}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {url && <span className="text-xs keep-accent text-orange-400">{c.platform}</span>}
                        <span className="text-xs keep-accent text-blue-400">{c.skill}</span>
                        {c.count > 1 && <span className="text-xs keep-accent text-purple-400">{c.count}× đề xuất</span>}
                      </div>
                      {!url && <p className="text-ns-faint text-xs mt-1">Chưa có liên kết khóa học được xác minh</p>}
                    </div>
                    {url && <ExternalLink size={14} className="text-ns-faint flex-shrink-0 mt-1" />}
                  </>
                  const cardClass = 'w-full p-3 bg-ns-page rounded-xl flex items-start gap-3 border border-transparent text-left insight-list-item'
                  return url ? (
                    <a key={c.title} href={url} target="_blank" rel="noopener noreferrer" className={`${cardClass} hover:border-orange-500/30 transition`}>
                      {content}
                    </a>
                  ) : (
                    <div key={c.title} className={cardClass}>{content}</div>
                  )
                })}
              </div>
            )
          ) : (
            <>
              <div className="space-y-3 blur-sm select-none pointer-events-none opacity-60">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-ns-page rounded-xl" />)}</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-ns-card border border-blue-500/30 rounded-2xl p-5 text-center mx-4">
                  <Lock size={24} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-ns-primary text-sm font-semibold mb-3">Mở khóa gợi ý khoá học</p>
                  <button onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">Xem các gói</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
