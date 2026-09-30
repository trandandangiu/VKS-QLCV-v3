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
  onFilterOverdue?: () => void;
  isOverdueFilterActive?: boolean;
}

const getTodayString = (): string => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
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

  // ⭐ Mobile chỉ hiện 4, desktop 6
  const INITIAL_SHOW = 6;
  const displayPvts = isExpanded ? pvtCards : pvtCards.slice(0, INITIAL_SHOW);
  const hasMore = pvtCards.length > INITIAL_SHOW;
  const pvtsWithWork = pvtCards.filter(p => p.total > 0).length;

  return (
    <div
      className="relative overflow-hidden rounded-lg sm:rounded-2xl text-white shadow-lg"
      style={{
        backgroundImage: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 50%, #4A0808 100%)',
      }}
    >
      {/* Pattern dots — chỉ desktop */}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">

          {/* ═══════ CỘT TRÁI ═══════ */}
          <div className="lg:col-span-5 space-y-2">
            {/* Tiêu đề — ẩn trên mobile vì Header đã có */}
            <div>
              <h1 className="hidden sm:block text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN
              </h1>
              <h1 className="sm:hidden text-base font-black tracking-tight leading-tight">
                Tiến độ công văn
              </h1>
            </div>

            {/* Ngày + giờ */}
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

            {/* Badges row — mobile gọn hơn */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <button
                onClick={onScrollToTable}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white text-red-900 font-black text-[10px] sm:text-xs rounded-lg shadow-md hover:bg-amber-100 transition cursor-pointer active:scale-95"
              >
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Chi tiết tiến độ</span>
                <span className="sm:hidden">Xem bảng</span>
                <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-bounce" />
              </button>

              {pvtCards.length > 0 && (
                <>
                  <span className="px-2 py-1 bg-white/15 border border-white/25 rounded-md text-[10px] sm:text-[11px] font-bold text-white">
                    {pvtCards.length} Phó viện trưởng
                  </span>

                  {pvtsWithWork > 0 && (
                    <span className="hidden sm:inline px-2 py-1 bg-emerald-500/25 border border-emerald-400/40 rounded-md text-[11px] font-bold text-emerald-100">
                      {pvtsWithWork} có công văn
                    </span>
                  )}

                  {totalOverdue > 0 && (
                    <button
                      type="button"
                      onClick={onFilterOverdue}
                      className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center gap-1 cursor-pointer transition border ${isOverdueFilterActive
                        ? 'bg-rose-500 border-rose-300 text-white shadow-md ring-2 ring-rose-300/50'
                        : 'bg-rose-500/25 hover:bg-rose-500/40 border-rose-400/40 text-rose-100'
                        }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>{totalOverdue} quá hạn</span>
                      {isOverdueFilterActive && <X className="w-3 h-3 ml-0.5" />}
                    </button>
                  )}
                </>
              )}
            </div>

          </div>

          {/* ═══════ CỘT PHẢI: Phó viện trưởngGRID ═══════ */}
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
                        {pvtCards.length} Phó viện trưởng· {pvtCards.reduce((s, p) => s + p.total, 0)} công văn
                      </div>
                    </div>
                  </div>

                  {hasMore && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-white/15 hover:bg-white/25 rounded-md border border-white/25 transition cursor-pointer shrink-0"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          +{pvtCards.length - INITIAL_SHOW}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Grid Phó viện trưởng— 2 cột mobile, scroll */}
                <div
                  className={`grid grid-cols-2 gap-1.5 sm:gap-2 ${isExpanded ? 'max-h-[280px]' : 'max-h-[180px] sm:max-h-[140px]'
                    } overflow-y-auto pr-0.5 transition-all`}
                >
                  {displayPvts.map(pvt => {
                    const isSelected = selectedPvtId === pvt.id;
                    const initials = getInitials(pvt.name);
                    const displayName = cleanName(pvt.name);
                    const clickable = canClickPvtCard ? canClickPvtCard(pvt) : true;

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
                            ? `${displayName} · ${pvt.total} CV${hasOverdue ? ` · ${pvt.overdue} quá hạn` : ''}`
                            : 'Không có quyền'
                        }
                        className={`
                          relative w-full text-left p-1.5 sm:p-2 rounded-lg transition border
                          ${isSelected
                            ? 'bg-amber-400/30 border-amber-300 shadow-md ring-1 ring-amber-300/50 cursor-pointer'
                            : !hasWork
                              ? clickable
                                ? 'bg-white/5 hover:bg-white/10 border-white/15 opacity-70 cursor-pointer'
                                : 'bg-white/5 border-white/10 cursor-not-allowed opacity-40'
                              : hasOverdue
                                ? clickable
                                  ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-400/50 cursor-pointer'
                                  : 'bg-white/5 border-white/10 cursor-not-allowed opacity-40'
                                : clickable
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-400/40 cursor-pointer'
                                  : 'bg-white/5 border-white/10 cursor-not-allowed opacity-40'
                          }
                        `}
                      >
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          {/* Avatar */}
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border ${isSelected
                              ? 'bg-amber-400 text-red-950 border-amber-200'
                              : !hasWork
                                ? 'bg-white/10 text-white/60 border-white/20'
                                : hasOverdue
                                  ? 'bg-rose-500/30 text-white border-rose-400/50'
                                  : 'bg-emerald-500/25 text-white border-emerald-400/40'
                              }`}
                          >
                            <span className="text-[9px] sm:text-[11px] font-black">
                              {initials}
                            </span>
                          </div>

                          {/* Tên + roomCode */}
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

                          {/* Số liệu */}
                          {hasWork && (
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              <div className="text-[10px] sm:text-xs font-black text-white leading-none">
                                {pvt.total}
                                <span className="hidden sm:inline text-[8px] text-white/70 ml-0.5">
                                  Công văn
                                </span>
                              </div>
                              {hasOverdue && (
                                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-rose-500/40 rounded text-[8px] font-black text-white">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {pvt.overdue}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Dot trạng thái */}
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