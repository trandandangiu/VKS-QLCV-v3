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
  /** 🎯 Danh sách PVT + số liệu */
  pvtCards?: PvtCard[];
  /** 🎯 ID PVT đang được chọn (để highlight) */
  selectedPvtId?: string | null;
  /** 🎯 Callback khi bấm vào 1 card PVT */
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

// 🎯 Hàm rút gọn tên: "Nguyễn Văn A" → "N.V.A"
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

// 🎯 Hàm rút gọn tên hiển thị: bỏ prefix "Đ/c", "Đồng chí"
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
    // Bấm lại vào card đang chọn → bỏ chọn
    if (selectedPvtId === pvtId) {
      onSelectPvt(null);
    } else {
      onSelectPvt(pvtId);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl text-white shadow-2xl"
      style={{
        backgroundImage: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 50%, #4A0808 100%)',
        minHeight: '260px',
      }}
    >
      {/* Pattern dots */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots-hero" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-hero)" />
        </svg>
      </div>

      {/* Glow blobs parallax */}
      <div
        className="absolute w-96 h-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none transition-transform duration-700"
        style={{
          top: '-30%',
          right: '-10%',
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full bg-rose-500/20 blur-3xl pointer-events-none transition-transform duration-700"
        style={{
          bottom: '-40%',
          left: '-10%',
          transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)`,
        }}
      />

      <div className="relative p-6 sm:p-10">
        {/* 🎯 GRID 2 CỘT: trái = nội dung, phải = danh sách PVT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ═══════ CỘT TRÁI (7/12) ═══════ */}
          <div className="lg:col-span-7 space-y-5">

            {/* Badges */}
            {/* <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/25">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] font-black tracking-widest uppercase text-amber-100">
                  Viện Kiểm sát nhân dân
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full border border-emerald-400/40">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              </div>
            </div> */}

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Công văn gửi <span style={{ color: '#FFD700' }}>Lãnh đạo</span>
              </h1>
            </div>

            {/* Date + Time */}
            <div className="flex items-center gap-4 text-sm text-red-100 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-300" />
                <span className="font-medium">{getTodayString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span className="font-mono font-bold text-white">{timeStr}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onScrollToTable}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-900 font-black text-sm rounded-xl shadow-lg hover:bg-amber-100 transition cursor-pointer active:scale-95"
              >
                <TrendingUp className="w-4 h-4" />
                Xem bảng công văn
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </button>
            </div>

            {/* Greeting */}

          </div>

          {/* ═══════ CỘT PHẢI (5/12): DANH SÁCH PVT ═══════ */}
          <div className="lg:col-span-5 space-y-3">
            {pvtCards.length > 0 && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                        Lãnh đạo phụ trách
                      </div>
                      <div className="text-xs font-bold text-white">
                        {pvtCards.length} Phó Viện trưởng
                      </div>
                    </div>
                  </div>

                  {/* Nút xoá lọc */}
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
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {pvtCards.map(pvt => {
                    const isSelected = selectedPvtId === pvt.id;
                    const initials = getInitials(pvt.name);
                    const displayName = cleanName(pvt.name);
                    const clickable = canClickPvtCard ? canClickPvtCard(pvt) : true;

                    return (
                      <button
                        key={pvt.id}
                        onClick={() => {
                          if (!clickable) return;   // 🎯 chặn click
                          handleCardClick(pvt.id);
                        }}
                        disabled={!clickable}       // 🎯 disable khi không có quyền
                        title={clickable ? 'Bấm để lọc' : 'Bạn không có quyền lọc công văn này'}
                        className={`w-full text-left p-3 rounded-2xl transition border ${isSelected
                            ? 'bg-amber-400/25 border-amber-300 shadow-lg ring-2 ring-amber-300/50 cursor-pointer'
                            : clickable
                              ? 'bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30 cursor-pointer'
                              : 'bg-white/5 border-white/10 cursor-not-allowed opacity-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar tròn initials */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${isSelected
                                ? 'bg-amber-400 text-red-950 border-amber-200'
                                : clickable
                                  ? 'bg-white/20 text-white border-white/30'
                                  : 'bg-white/10 text-white/60 border-white/20'
                              }`}
                          >
                            <span className="text-xs font-black tracking-wider">
                              {initials}
                            </span>
                          </div>

                          {/* Tên + mã phòng */}
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-black truncate ${clickable ? 'text-white' : 'text-white/70'
                              }`}>
                              {displayName}
                            </div>
                            {pvt.roomCode && (
                              <div className={`text-[10px] font-bold uppercase tracking-wider ${clickable ? 'text-amber-200' : 'text-amber-200/60'
                                }`}>
                                {pvt.roomCode}
                              </div>
                            )}
                          </div>

                          {/* Số liệu */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-center">
                              <div className={`text-sm font-black leading-none ${clickable ? 'text-white' : 'text-white/70'
                                }`}>
                                {pvt.total}
                              </div>
                              <div className="text-[9px] text-red-100/80 font-bold uppercase tracking-wider mt-0.5">
                                CV
                              </div>
                            </div>

                            {pvt.overdue > 0 && (
                              <div className="text-center px-1.5 py-1 bg-rose-500/25 rounded-lg border border-rose-400/40">
                                <div className="text-xs font-black text-rose-100 leading-none">
                                  {pvt.overdue}
                                </div>
                                <div className="text-[9px] text-rose-200 font-bold uppercase tracking-wider mt-0.5">
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

                {/* Chú thích */}

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHeroSection;