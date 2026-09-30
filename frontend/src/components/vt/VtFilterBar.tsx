// src/components/vt/VtFilterBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  Search,
  X,
} from 'lucide-react';
import { User } from '../../types/auth';
import { VtFilters, DEFAULT_VT_FILTERS } from '../../types/vt';

interface VtFilterBarProps {
  filters: VtFilters;
  onChange: (filters: VtFilters) => void;
  pvtList: User[];
  totalResults: number;
  chuyenDeCount?: number;
}

// ⭐ Config cho từng loại văn bản (bỏ icon)
const LOAI_VAN_BAN_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'CONG_VAN', label: 'Công văn' },
  { value: 'CHUYEN_DE', label: 'Chuyên đề' },
];

export const VtFilterBar: React.FC<VtFilterBarProps> = ({
  filters,
  onChange,
  pvtList,
  totalResults,
  chuyenDeCount = 0,
}) => {
  const [showPvtDropdown, setShowPvtDropdown] = useState(false);
  const [showDatePanel, setShowDatePanel] = useState(false);
  const [showLoaiDropdown, setShowLoaiDropdown] = useState(false);

  // ⭐ Refs để click-outside
  const loaiDropdownRef = useRef<HTMLDivElement>(null);
  const pvtDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside → đóng cả 2 dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        loaiDropdownRef.current &&
        !loaiDropdownRef.current.contains(target)
      ) {
        setShowLoaiDropdown(false);
      }
      if (
        pvtDropdownRef.current &&
        !pvtDropdownRef.current.contains(target)
      ) {
        setShowPvtDropdown(false);
      }
    };
    if (showLoaiDropdown || showPvtDropdown) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showLoaiDropdown, showPvtDropdown]);

  const update = (patch: Partial<VtFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const togglePvt = (id: string) => {
    const next = filters.pvtIds.includes(id)
      ? filters.pvtIds.filter(x => x !== id)
      : [...filters.pvtIds, id];
    update({ pvtIds: next });
  };

  const resetAll = () => {
    onChange(DEFAULT_VT_FILTERS);
  };

  // Loại VB đang chọn
  const currentLoaiOption =
    LOAI_VAN_BAN_OPTIONS.find(o => o.value === filters.loaiVanBan) ||
    LOAI_VAN_BAN_OPTIONS[0];

  const hasActiveFilter =
    filters.searchQuery !== '' ||
    filters.pvtIds.length > 0 ||
    filters.status !== 'ALL' ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.loaiVanBan !== 'ALL';

  const congVanCount = Math.max(0, totalResults - chuyenDeCount);

  // ⭐ Class chung cho tất cả nút filter — ĐỒNG ĐỀU
  const btnBase =
    'inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold rounded-lg border transition cursor-pointer whitespace-nowrap';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">

      {/* ═══ Row 1: Search + 4 nút filter ═══ */}
      <div className="flex flex-wrap items-center gap-2">

        {/* ── Ô TÌM KIẾM ── */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm số CV, trích yếu, đơn vị..."
            value={filters.searchQuery}
            onChange={e => update({ searchQuery: e.target.value })}
            className="w-full h-9 pl-9 pr-9 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => update({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── DROPDOWN LOẠI VĂN BẢN ── */}
        <div className="relative" ref={loaiDropdownRef}>
          <button
            type="button"
            onClick={() => setShowLoaiDropdown(prev => !prev)}
            className={`${btnBase} ${filters.loaiVanBan !== 'ALL'
                ? 'bg-red-50 text-red-800 border-red-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
          >
            <span>{currentLoaiOption.label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition ${showLoaiDropdown ? 'rotate-180' : ''
                }`}
            />
          </button>

          {showLoaiDropdown && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden py-1">
              {LOAI_VAN_BAN_OPTIONS.map(opt => {
                const isActive = filters.loaiVanBan === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      update({ loaiVanBan: opt.value as any });
                      setShowLoaiDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${isActive
                        ? 'bg-red-50 text-red-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-red-600" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── KHOẢNG NGÀY ── */}
        <button
          type="button"
          onClick={() => setShowDatePanel(!showDatePanel)}
          className={`${btnBase} ${filters.dateFrom || filters.dateTo
              ? 'bg-red-50 text-red-700 border-red-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
        >
          <span>
            {filters.dateFrom || filters.dateTo
              ? 'Đã chọn khoảng ngày'
              : 'Khoảng ngày'}
          </span>
          {(filters.dateFrom || filters.dateTo) && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
        </button>



        {/* ── NÚT XÓA LỌC ── */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetAll}
            className={`${btnBase} bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100`}
          >
            <span>Xóa lọc</span>
          </button>
        )}

        {/* ── KẾT QUẢ (bên phải) ── */}
        <div className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="text-slate-400 font-medium">Kết quả:</span>

          {filters.loaiVanBan === 'ALL' ? (
            <>
              <span className="text-red-700">{congVanCount} công văn</span>
              <span className="text-slate-300">·</span>
              <span className="text-teal-700">{chuyenDeCount} chuyên đề</span>
            </>
          ) : filters.loaiVanBan === 'CONG_VAN' ? (
            <span className="text-red-700">{totalResults} công văn</span>
          ) : (
            <span className="text-teal-700">{totalResults} chuyên đề</span>
          )}
        </div>
      </div>

      {/* ═══ Row 2: Date panel ═══ */}
      {showDatePanel && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Từ ngày:
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => update({ dateFrom: e.target.value })}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Đến ngày:
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => update({ dateTo: e.target.value })}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          {(filters.dateFrom || filters.dateTo) && (
            <button
              type="button"
              onClick={() => update({ dateFrom: '', dateTo: '' })}
              className="text-xs font-semibold text-red-600 hover:text-red-800 underline cursor-pointer"
            >
              Xóa khoảng ngày
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDatePanel(false)}
            className="ml-auto text-xs font-semibold text-slate-600 hover:text-slate-800 underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};

export default VtFilterBar;