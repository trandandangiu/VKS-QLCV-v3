// src/components/vt/VtFilterBar.tsx
import React, { useState } from 'react';
import {
  Search,
  X,
  Filter,
  Calendar,
  ChevronDown,
  Check,
  RotateCcw,
} from 'lucide-react';
import { User } from '../../types/auth';
import { VtFilters, DEFAULT_VT_FILTERS } from '../../types/vt';

interface VtFilterBarProps {
  filters: VtFilters;
  onChange: (filters: VtFilters) => void;
  pvtList: User[];
  deptList: { code: string; name: string }[];
  totalResults: number;
}

export const VtFilterBar: React.FC<VtFilterBarProps> = ({
  filters,
  onChange,
  pvtList,
  deptList,
  totalResults,
}) => {
  const [showPvtDropdown, setShowPvtDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showDatePanel, setShowDatePanel] = useState(false);

  const update = (patch: Partial<VtFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const togglePvt = (id: string) => {
    const next = filters.pvtIds.includes(id)
      ? filters.pvtIds.filter(x => x !== id)
      : [...filters.pvtIds, id];
    update({ pvtIds: next });
  };

  const toggleDept = (code: string) => {
    const next = filters.deptCodes.includes(code)
      ? filters.deptCodes.filter(x => x !== code)
      : [...filters.deptCodes, code];
    update({ deptCodes: next });
  };

  const resetAll = () => {
    onChange(DEFAULT_VT_FILTERS);
  };

  const hasActiveFilter =
    filters.searchQuery ||
    filters.pvtIds.length > 0 ||
    filters.deptCodes.length > 0 ||
    filters.status !== 'ALL' ||
    filters.urgency !== 'ALL' ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 space-y-3">
      {/* Row 1: Search + Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm số CV, trích yếu, đơn vị, PVT, phòng ban..."
            value={filters.searchQuery}
            onChange={e => update({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-9 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => update({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={e => update({ status: e.target.value })}
          className="px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer text-slate-700 transition"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DANG_XU_LY">Đang xử lý</option>
          <option value="SAP_DEN_HAN">Sắp đến hạn</option>
          <option value="QUA_HAN">Quá hạn</option>
          <option value="HOAN_THANH">Hoàn thành</option>
        </select>

        {/* Urgency filter */}
        <select
          value={filters.urgency}
          onChange={e => update({ urgency: e.target.value })}
          className="px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer text-slate-700 transition"
        >
          <option value="ALL">Mọi mức độ</option>
          <option value="HOA_TOC">Hỏa tốc</option>
          <option value="KHAN">Khẩn</option>
          <option value="THUONG">Thường</option>
        </select>

        {/* Date range button */}
        <button
          onClick={() => setShowDatePanel(!showDatePanel)}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
            filters.dateFrom || filters.dateTo
              ? 'bg-red-50 text-red-700 border-red-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Khoảng ngày</span>
          {(filters.dateFrom || filters.dateTo) && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
        </button>

        {/* Reset */}
        {hasActiveFilter && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* Row 2: PVT + Dept dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* PVT dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPvtDropdown(!showPvtDropdown);
              setShowDeptDropdown(false);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
              filters.pvtIds.length > 0
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              {filters.pvtIds.length === 0
                ? 'Chọn Phó Viện Trưởng'
                : `Đã chọn ${filters.pvtIds.length} PVT`}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition ${showPvtDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showPvtDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 max-h-80 overflow-y-auto">
              <div className="p-2 space-y-0.5">
                {pvtList.map(pvt => {
                  const checked = filters.pvtIds.includes(pvt.id);
                  return (
                    <button
                      key={pvt.id}
                      onClick={() => togglePvt(pvt.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                        checked ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 ${
                          checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{pvt.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {pvt.roomCode}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {pvtList.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Không có PVT nào
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dept dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDeptDropdown(!showDeptDropdown);
              setShowPvtDropdown(false);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
              filters.deptCodes.length > 0
                ? 'bg-purple-50 text-purple-800 border-purple-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              {filters.deptCodes.length === 0
                ? 'Chọn Phòng ban'
                : `Đã chọn ${filters.deptCodes.length} phòng`}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition ${showDeptDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDeptDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 max-h-80 overflow-y-auto">
              <div className="p-2 space-y-0.5">
                {deptList.map(dept => {
                  const checked = filters.deptCodes.includes(dept.code);
                  return (
                    <button
                      key={dept.code}
                      onClick={() => toggleDept(dept.code)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                        checked ? 'bg-purple-50 text-purple-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 ${
                          checked ? 'bg-purple-600 border-purple-600' : 'border-slate-300'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{dept.code}</div>
                        <div className="text-[10px] text-slate-500 truncate">{dept.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="text-slate-400">Kết quả:</span>
          <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">
            {totalResults} công văn
          </span>
        </div>
      </div>

      {/* Row 3: Date panel (conditional) */}
      {showDatePanel && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Từ ngày:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => update({ dateFrom: e.target.value })}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Đến ngày:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => update({ dateTo: e.target.value })}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          {(filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => update({ dateFrom: '', dateTo: '' })}
              className="text-xs font-bold text-red-600 hover:text-red-800 underline"
            >
              Xóa khoảng ngày
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {(filters.pvtIds.length > 0 || filters.deptCodes.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {filters.pvtIds.map(id => {
            const pvt = pvtList.find(p => p.id === id);
            if (!pvt) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold"
              >
                {pvt.fullName}
                <button
                  onClick={() => togglePvt(id)}
                  className="hover:bg-blue-100 rounded p-0.5 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {filters.deptCodes.map(code => (
            <span
              key={code}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold font-mono"
            >
              {code}
              <button
                onClick={() => toggleDept(code)}
                className="hover:bg-purple-100 rounded p-0.5 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default VtFilterBar;