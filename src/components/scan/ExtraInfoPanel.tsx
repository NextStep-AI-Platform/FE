import { ChevronDown, Search } from 'lucide-react'
import { INDUSTRIES } from '../../constants'
import type { ExperienceUnit } from '../../types'

export interface ExtraInfoProps {
  company: string; setCompany: (v: string) => void
  industry: string; setIndustry: (v: string) => void
  industryOther: string; setIndustryOther: (v: string) => void
  role: string; setRole: (v: string) => void
  roleOther: string; setRoleOther: (v: string) => void
  roles: string[]
  location: string; setLocation: (v: string) => void
  jdMinExpUnit: ExperienceUnit; setJdMinExpUnit: (v: ExperienceUnit) => void
  jdMinExpValue: string; setJdMinExpValue: (v: string) => void
  canSearch: boolean
  searching: boolean
  hasResults: boolean
  onSearch: () => void
}

/** Optional hints for auto-JD search. Only shown when the JD source is "auto". */
export default function ExtraInfoPanel(props: ExtraInfoProps) {
  const {
    company, setCompany, industry, setIndustry, industryOther, setIndustryOther,
    role, setRole, roleOther, setRoleOther, roles, location, setLocation,
    jdMinExpUnit, setJdMinExpUnit, jdMinExpValue, setJdMinExpValue,
    canSearch, searching, hasResults, onSearch,
  } = props
  const handleMinExpInput = (raw: string) => setJdMinExpValue(raw.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))

  return (
    <div className="bg-ns-card border border-ns rounded-2xl p-5 shadow-card h-full min-h-0 flex flex-col overflow-hidden">
      <h3 className="font-heading font-semibold text-ns-primary text-sm shrink-0">Thông tin bổ sung</h3>
      <p className="text-ns-faint text-xs mb-4 shrink-0">Không bắt buộc, giúp tìm JD sát hơn</p>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3.5 pr-1 -mr-1">
        <div>
          <label className="text-ns-secondary text-xs font-medium block mb-1.5">Công ty mong muốn</label>
          <input value={company} onChange={e => setCompany(e.target.value)} className="input-field text-sm py-2" placeholder="VD: FPT Software" />
        </div>
        <div>
          <label className="text-ns-secondary text-xs font-medium block mb-1.5">Ngành nghề</label>
          <div className="relative">
            <select value={industry} onChange={e => { setIndustry(e.target.value); setRole('') }} className="input-field appearance-none pr-9 cursor-pointer text-sm py-2">
              <option value="">-- Tùy chọn --</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              <option value="__other__">Khác...</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-faint pointer-events-none" />
          </div>
          {industry === '__other__' && (
            <input value={industryOther} onChange={e => setIndustryOther(e.target.value)} className="input-field mt-2 text-sm py-2" placeholder="Nhập ngành nghề" />
          )}
        </div>
        <div>
          <label className="text-ns-secondary text-xs font-medium block mb-1.5">Vị trí ứng tuyển</label>
          {!industry ? (
            <input value={roleOther} onChange={e => setRoleOther(e.target.value)} className="input-field text-sm py-2" placeholder="VD: Data Engineer, Business Analyst..." />
          ) : (
            <>
              <div className="relative">
                <select value={role} onChange={e => setRole(e.target.value)} className="input-field appearance-none pr-9 cursor-pointer text-sm py-2">
                  <option value="">-- Chọn vị trí --</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  <option value="__other__">Khác...</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-faint pointer-events-none" />
              </div>
              {role === '__other__' && (
                <input value={roleOther} onChange={e => setRoleOther(e.target.value)} className="input-field mt-2 text-sm py-2" placeholder="Nhập vị trí cụ thể" />
              )}
            </>
          )}
        </div>
        <div>
          <label className="text-ns-secondary text-xs font-medium block mb-1.5">Địa điểm</label>
          <input value={location} onChange={e => setLocation(e.target.value)} className="input-field text-sm py-2" placeholder="VD: Hồ Chí Minh" />
        </div>
        <div>
          <label className="text-ns-secondary text-xs font-medium block mb-1.5">Kinh nghiệm tối thiểu</label>
          <div className="flex gap-2">
            <div className="relative w-[88px] shrink-0">
              <select value={jdMinExpUnit} onChange={e => setJdMinExpUnit(e.target.value as ExperienceUnit)}
                className="input-field appearance-none pr-7 cursor-pointer text-sm py-2">
                <option value="month">Tháng</option>
                <option value="year">Năm</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ns-faint pointer-events-none" />
            </div>
            <input type="text" inputMode="numeric" pattern="[0-9]*" value={jdMinExpValue} onChange={e => handleMinExpInput(e.target.value)}
              className="input-field flex-1 text-sm py-2" placeholder={jdMinExpUnit === 'year' ? 'VD: 3' : 'VD: 6'} />
          </div>
        </div>
      </div>
      <button type="button" onClick={onSearch} disabled={!canSearch || searching}
        title={!canSearch ? 'Thêm CV trước khi tìm JD' : undefined}
        className="w-full btn-primary py-2.5 text-sm shrink-0 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        <Search size={15} /> {hasResults ? 'Tìm lại' : 'Tìm JD phù hợp'}
      </button>
    </div>
  )
}
