import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, ChevronRight, FileText, ScanLine } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatDateTime, formatScanDisplayTitle, getScoreLabel } from '../lib/utils'

export default function AnalysisListPage() {
  const navigate = useNavigate()
  const { scans } = useApp()
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    return scans.filter(scan => {
      const q = query.trim().toLowerCase()
      const matchQuery =
        !q ||
        scan.title.toLowerCase().includes(q) ||
        scan.role.toLowerCase().includes(q) ||
        scan.company.toLowerCase().includes(q)

      const scanDate = new Date(scan.analyzedAt)
      const fromOk = !dateFrom || scanDate >= new Date(dateFrom + 'T00:00:00')
      const toOk = !dateTo || scanDate <= new Date(dateTo + 'T23:59:59')

      return matchQuery && fromOk && toOk
    })
  }, [scans, query, dateFrom, dateTo])

  const hasFilters = query || dateFrom || dateTo

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-ns-primary text-2xl">Kết quả phân tích</h2>
          <p className="text-ns-muted text-sm mt-1">Xem lại các lần phân tích Coverage Score của bạn</p>
        </div>
        <button
          onClick={() => navigate('/cv-scan')}
          className="border border-ns text-ns-secondary text-sm px-4 py-2 rounded-xl hover:bg-ns-raised transition cursor-pointer"
        >
          Phân tích mới
        </button>
      </div>

      <div className="bg-ns-card border border-ns rounded-2xl p-4 space-y-4 shadow-card">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm theo tên, vị trí, công ty..."
            className="input-field flex-1 text-sm"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm" title="Từ ngày" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm" title="Đến ngày" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-ns-faint text-xs">Hiển thị {filtered.length} kết quả</p>
          {hasFilters && (
            <button
              onClick={() => { setQuery(''); setDateFrom(''); setDateTo('') }}
              className="text-blue-400 text-xs hover:text-blue-300 cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="bg-ns-card border border-ns rounded-2xl p-12 text-center">
          <ScanLine size={48} className="text-ns-faint mx-auto mb-4" />
          <p className="text-ns-primary font-medium mb-2">Chưa có kết quả phân tích nào</p>
          <p className="text-ns-muted text-sm mb-6">Bắt đầu phân tích CV và JD để nhận Coverage Score</p>
          <button onClick={() => navigate('/cv-scan')} className="btn-primary text-sm">
            Phân tích CV ngay
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-ns-card border border-ns rounded-2xl p-10 text-center">
          <p className="text-ns-muted">Không tìm thấy kết quả phù hợp</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(scan => {
            const scoreInfo = getScoreLabel(scan.overallScore)
            return (
              <button
                key={scan.id}
                onClick={() => navigate(`/analysis/${scan.id}`)}
                className="w-full bg-ns-card border border-ns rounded-xl px-5 py-4 flex items-center gap-4 hover:border-blue-500/30 transition text-left cursor-pointer scan-history-row"
              >
                <div className="w-10 h-10 bg-blue-400/10 stat-icon-tile stat-icon-tile-blue rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart2 size={18} className="keep-accent text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ns-primary font-medium truncate">{formatScanDisplayTitle(scan.title)}</p>
                  <p className="text-ns-faint text-xs mt-0.5">{formatDateTime(scan.analyzedAt)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${scoreInfo.bg} ${scoreInfo.color}`}>
                    {scan.overallScore}/100
                  </span>
                  <ChevronRight size={16} className="text-ns-faint" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
