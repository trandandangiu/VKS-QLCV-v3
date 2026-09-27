// src/components/public/PublicHeroSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Crown,
  Calendar,
  Clock,
  TrendingUp,
  ArrowDown,
  Sparkles,
  Users,
  X,
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
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

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
}) => {
  const [timeStr, setTimeStr] = useState(getCurrentTime());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => setTimeStr(getCurrentTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Chỉ bật parallax trên desktop
    if (window.innerWidth < 768) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleCardClick = (pvtId: string) => {
    if (!onSelectPvt) return;
    if (selectedPvtId === pvtId) {
      onSelectPvt(null);
    } else {
      onSelectPvt(pvtId);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl text-white shadow-xl sm:shadow-2xl"
      style={{
        backgroundImage: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 50%, #4A0808 100%)',
        minHeight: 'auto',
      }}
    >
      {/* Pattern dots — ẩn trên mobile để nhẹ hơn */}
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

      {/* Glow blobs — ẩn trên mobile */}
      <div
        className="hidden sm:block absolute w-96 h-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none transition-transform duration-700"
        style={{
          top: '-30%',
          right: '-10%',
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
        }}
      />
      <div
        className="hidden sm:block absolute w-80 h-80 rounded-full bg-rose-500/20 blur-3xl pointer-events-none transition-transform duration-700"
        style={{
          bottom: '-40%',
          left: '-10%',
          transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)`,
        }}
      />

      <div className="relative p-4 sm:p-6 lg:p-10">
        {/* Grid 2 cột: mobile stack dọc, desktop 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">

          {/* ═══════ CỘT TRÁI ═══════ */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-5">

            {/* Title — responsive size */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white">
                THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN
              </h1>
            </div>

            {/* Date + Time */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-red-100 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                <span className="font-medium">{getTodayString()}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                <span className="font-mono font-bold text-white">{timeStr}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 pt-1 sm:pt-2">
              <button
                onClick={onScrollToTable}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white text-red-900 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-lg hover:bg-amber-100 transition cursor-pointer active:scale-95"
              >
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Chi tiết tiến độ văn bản
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
              </button>
            </div>
          </div>

          {/* ═══════ CỘT PHẢI: DANH SÁCH PVT ═══════ */}
          <div className="lg:col-span-5 space-y-2.5 sm:space-y-3">
            {pvtCards.length > 0 && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                      <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-200">
                        Lãnh đạo viện phụ trách
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold text-white">
                        {pvtCards.length} Phó Viện trưởng
                      </div>
                    </div>
                  </div>

                  {selectedPvtId && onSelectPvt && (
                    <button
                      onClick={() => onSelectPvt(null)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/25 transition cursor-pointer"
                      title="Bỏ lọc"
                    >
                      <X className="w-3 h-3" />
                      Bỏ lọc
                    </button>
                  )}
                </div>

                {/* Danh sách card PVT */}
                <div className="space-y-1.5 max-h-[280px] sm:max-h-[340px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {pvtCards.map(pvt => {
                    const isSelected = selectedPvtId === pvt.id;
                    const initials = getInitials(pvt.name);
                    const displayName = cleanName(pvt.name);
                    const clickable = canClickPvtCard ? canClickPvtCard(pvt) : true;

                    return (
                      <button
                        key={pvt.id}
                        onClick={() => {
                          if (!clickable) return;
                          handleCardClick(pvt.id);
                        }}
                        disabled={!clickable}
                        title={clickable ? 'Bấm để lọc' : 'Bạn không có quyền lọc công văn này'}
                        className={`w-full text-left p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition border ${isSelected
                            ? 'bg-amber-400/25 border-amber-300 shadow-lg ring-2 ring-amber-300/50 cursor-pointer'
                            : clickable
                              ? 'bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30 cursor-pointer'
                              : 'bg-white/5 border-white/10 cursor-not-allowed opacity-50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          {/* Avatar */}
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border-2 ${isSelected
                                ? 'bg-amber-400 text-red-950 border-amber-200'
                                : clickable
                                  ? 'bg-white/20 text-white border-white/30'
                                  : 'bg-white/10 text-white/60 border-white/20'
                              }`}
                          >
                            <span className="text-[10px] sm:text-xs font-black tracking-wider">
                              {initials}
                            </span>
                          </div>

                          {/* Tên + mã */}
                          <div className="flex-1 min-w-0">
                            <div className={`text-[11px] sm:text-xs font-black truncate ${clickable ? 'text-white' : 'text-white/70'
                              }`}>
                              {displayName}
                            </div>
                            {pvt.roomCode && (
                              <div className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${clickable ? 'text-amber-200' : 'text-amber-200/60'
                                }`}>
                                {pvt.roomCode}
                              </div>
                            )}
                          </div>

                          {/* Số liệu — gọn hơn trên mobile */}
                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            <div className="text-center">
                              <div className={`text-xs sm:text-sm font-black leading-none ${clickable ? 'text-white' : 'text-white/70'
                                }`}>
                                {pvt.total}
                              </div>
                              <div className="text-[8px] sm:text-[9px] text-red-100/80 font-bold uppercase tracking-wider mt-0.5">
                                CV
                              </div>
                            </div>

                            {pvt.overdue > 0 && (
                              <div className="text-center px-1.5 sm:px-2 py-1 bg-rose-500/25 rounded-lg border border-rose-400/40">
                                <div className="text-[10px] sm:text-xs font-black text-rose-100 leading-none">
                                  {pvt.overdue}
                                </div>
                                <div className="text-[8px] sm:text-[9px] text-rose-200 font-bold uppercase tracking-wider mt-0.5">
                                  Hạn
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHeroSection;