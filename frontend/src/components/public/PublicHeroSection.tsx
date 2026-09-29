// src/components/public/PublicHeroSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  ArrowDown,
  Users,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

interface PvtCard {
  id: string;
  name: string;
  roomCode?: string;
  total: number;
  overdue: number;
  completed: number;
}

interface PublicHeroSectionProps {
  totalDispatches: number;
  totalCompleted: number;
  totalOverdue: number;
  onScrollToTable: () => void;
  pvtCards?: PvtCard[];
  selectedPvtId?: string | null;
  onSelectPvt?: (pvtId: string | null) => void;
  canClickPvtCard?: (card: PvtCard) => boolean;
  // ⭐ THÊM: callback khi click badge quá hạn
  onFilterOverdue?: () => void;
  isOverdueFilterActive?: boolean;
}

const getTodayString = (): string => {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const today = new Date();
  return `${days[today.getDay()]}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
};

const getCurrentTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  return name
    .replace(/^Đồng chí\s+/i, '')
    .replace(/^Đ\/c\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
};

const cleanName = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/^Đồng chí\s+/i, '')
    .replace(/^Đ\/c\s+/i, '')
    .trim();
};

export const PublicHeroSection: React.FC<PublicHeroSectionProps> = ({
  onScrollToTable,
  pvtCards = [],
  selectedPvtId = null,
  onSelectPvt,
  canClickPvtCard,
  onFilterOverdue,
  isOverdueFilterActive = false,
  totalDispatches = 0,
  totalCompleted = 0,
  totalOverdue = 0,
}) => {
  const [timeStr, setTimeStr] = useState(getCurrentTime());
  // ⭐ State mở rộng/thu gọn danh sách PVT
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeStr(getCurrentTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCardClick = (pvtId: string) => {
    if (!onSelectPvt) return;
    if (selectedPvtId === pvtId) {
      onSelectPvt(null);
    } else {
      onSelectPvt(pvtId);
    }
  };

  // ⭐ Hiển thị 6 PVT đầu, hoặc tất cả nếu expanded
  const INITIAL_SHOW = 6;
  const displayPvts = isExpanded ? pvtCards : pvtCards.slice(0, INITIAL_SHOW);
  const hasMore = pvtCards.length > INITIAL_SHOW;

  // Đếm PVT có việc
  const pvtsWithWork = pvtCards.filter(p => p.total > 0).length;

  return (
    <div
      className="relative overflow-hidden rounded-xl sm:rounded-2xl text-white shadow-lg"
      style={{
        backgroundImage: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 50%, #4A0808 100%)',
      }}
    >
      {/* Pattern dots */}
      <div className="hidden sm:block absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots-hero" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-hero)" />
        </svg>
      </div>

      <div className="hidden sm:block absolute w-72 h-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none -top-20 -right-20" />
      <div className="hidden sm:block absolute w-64 h-64 rounded-full bg-rose-500/20 blur-3xl pointer-events-none -bottom-24 -left-20" />

      <div className="relative p-3 sm:p-4 lg:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start">

          {/* ═══════ CỘT TRÁI ═══════ */}
          <div className="lg:col-span-5 space-y-2 sm:space-y-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN<span style={{ color: '#FFD700' }}></span>
              </h1>
            </div>

            <div className="flex items-center gap-3 text-[11px] sm:text-xs text-red-100 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-medium">{getTodayString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-mono font-bold text-white">{timeStr}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={onScrollToTable}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-red-900 font-black text-[11px] sm:text-xs rounded-lg shadow-md hover:bg-amber-100 transition cursor-pointer active:scale-95"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Chi tiết tiến độ
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </button>

              {/* ⭐ Badge tóm tắt nhanh */}
              {/* ⭐ Badge tóm tắt nhanh */}
              {pvtCards.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] flex-wrap">
                  {/* Badge: số PVT */}
                  <span className="px-2 py-1 bg-white/15 border border-white/25 rounded-md font-bold text-white">
                    {pvtCards.length} Phó viện trưởng
                  </span>

                  {/* Badge: số PVT có việc */}
                  {pvtsWithWork > 0 && (
                    <span className="px-2 py-1 bg-emerald-500/25 border border-emerald-400/40 rounded-md font-bold text-emerald-100">
                      {pvtsWithWork} Phó viện trưởng có công văn
                    </span>
                  )}

                  {/* ⭐ Badge: TỔNG CÔNG VĂN quá hạn — bấm được */}
                  {totalOverdue > 0 && (
                    <button
                      type="button"
                      onClick={onFilterOverdue}
                      className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition border ${isOverdueFilterActive
                        ? 'bg-rose-500 border-rose-300 text-white shadow-md ring-2 ring-rose-300/50'
                        : 'bg-rose-500/25 hover:bg-rose-500/40 border-rose-400/40 text-rose-100 hover:border-rose-300'
                        }`}
                      title={
                        isOverdueFilterActive
                          ? 'Bấm để bỏ lọc quá hạn'
                          : `Bấm để xem ${totalOverdue} công văn quá hạn`
                      }
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>{totalOverdue} công văn quá hạn</span>
                      {isOverdueFilterActive && (
                        <X className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ═══════ CỘT PHẢI: PVT GRID 2 CỘT ═══════ */}
          <div className="lg:col-span-7 space-y-2">
            {pvtCards.length > 0 && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                      <Users className="w-3 h-3 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-200">
                        Lãnh đạo phụ trách
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-white">
                        {pvtCards.length} Phó Viện trưởng · {pvtCards.reduce((s, p) => s + p.total, 0)} công văn
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Nút mở rộng */}
                    {hasMore && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-white/15 hover:bg-white/25 rounded-md border border-white/25 transition cursor-pointer"
                        title={isExpanded ? 'Thu gọn' : 'Xem tất cả'}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Thu gọn
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Xem +{pvtCards.length - INITIAL_SHOW}
                          </>
                        )}
                      </button>
                    )}

                    {/* Nút bỏ lọc */}
                    
                  </div>
                </div>

                {/* ⭐ GRID 2 CỘT + SCROLL */}
                <div
                  className={`grid grid-cols-2 gap-1.5 sm:gap-2 ${isExpanded ? 'max-h-[220px]' : 'max-h-[140px]'
                    } overflow-y-auto pr-0.5 scrollbar-thin transition-all`}
                >
                  {displayPvts.map(pvt => {
                    const isSelected = selectedPvtId === pvt.id;
                    const initials = getInitials(pvt.name);
                    const displayName = cleanName(pvt.name);
                    const clickable = canClickPvtCard ? canClickPvtCard(pvt) : true;

                    // ⭐ Logic màu sắc:
                    // - Có việc + quá hạn → viền đỏ đậm
                    // - Có việc + không quá hạn → viền xanh
                    // - Rảnh (0 việc) → mờ, viền xám
                    const hasWork = pvt.total > 0;
                    const hasOverdue = pvt.overdue > 0;

                    return (
                      <button
                        key={pvt.id}
                        onClick={() => {
                          if (!clickable) return;
                          handleCardClick(pvt.id);
                        }}
                        disabled={!clickable}
                        title={
                          clickable
                            ? `${displayName} · ${pvt.total} công văn${hasOverdue ? ` · ${pvt.overdue} quá hạn` : ''}`
                            : 'Bạn không có quyền lọc công văn này'
                        }
                        className={`
                          relative w-full text-left p-1.5 sm:p-2 rounded-lg transition border
                          ${isSelected
                            ? 'bg-amber-400/30 border-amber-300 shadow-md ring-1 ring-amber-300/50 cursor-pointer'
                            : !hasWork
                              ? clickable
                                ? 'bg-white/5 hover:bg-white/10 border-white/15 opacity-70 hover:opacity-90 cursor-pointer'
                                : 'bg-white/5 border-white/10 cursor-not-allowed opacity-40'
                              : hasOverdue
                                ? clickable
                                  ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-400/50 hover:border-rose-400 cursor-pointer'
                                  : 'bg-white/5 border-white/10 cursor-not-allowed opacity-40'
                                : clickable
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-400/40 hover:border-emerald-400 cursor-pointer'
                                  : 'bg-white/5 border-white/10 cursor-not-allowed opacity-40'
                          }
                        `}
                      >
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          {/* Avatar */}
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border ${isSelected
                              ? 'bg-amber-400 text-red-950 border-amber-200'
                              : !hasWork
                                ? 'bg-white/10 text-white/60 border-white/20'
                                : hasOverdue
                                  ? 'bg-rose-500/30 text-white border-rose-400/50'
                                  : 'bg-emerald-500/25 text-white border-emerald-400/40'
                              }`}
                          >
                            <span className="text-[10px] sm:text-[11px] font-black">
                              {initials}
                            </span>
                          </div>

                          {/* Tên + mã phòng */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-[10px] sm:text-[11px] font-black truncate ${!hasWork ? 'text-white/60' : 'text-white'
                                }`}
                            >
                              {displayName}
                            </div>
                            {pvt.roomCode && (
                              <div
                                className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wide ${!hasWork ? 'text-white/40' : 'text-amber-200'
                                  }`}
                              >
                                {pvt.roomCode}
                              </div>
                            )}
                          </div>

                          {/* Số liệu — chỉ hiện khi có việc */}
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            {hasWork ? (
                              <>
                                <div className="text-[11px] sm:text-xs font-black text-white leading-none">
                                  {pvt.total}
                                  <span className="text-[8px] text-white/70 ml-0.5">Công văn</span>
                                </div>
                                {hasOverdue && (
                                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-rose-500/40 rounded text-[8px] font-black text-white">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    {pvt.overdue}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-[9px] font-bold text-white/40 italic">
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ⭐ Dot xanh/đỏ nhỏ ở góc phải trên */}
                        {hasWork && (
                          <span
                            className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${hasOverdue ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'
                              }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer hint */}
                {hasMore && !isExpanded && (
                  <div className="text-center text-[10px] text-white/60 italic">
                    Còn {pvtCards.length - INITIAL_SHOW} Phó viện trưởng 
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHeroSection;