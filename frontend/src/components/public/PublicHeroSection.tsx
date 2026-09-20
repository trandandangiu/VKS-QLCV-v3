// src/components/public/PublicHeroSection.tsx
import React, { useState, useEffect } from 'react';
import { Crown, Calendar, Clock, TrendingUp, ArrowDown, Sparkles } from 'lucide-react';

interface PublicHeroSectionProps {
  totalDispatches: number;
  totalCompleted: number;
  totalOverdue: number;
  onScrollToTable: () => void;
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

export const PublicHeroSection: React.FC<PublicHeroSectionProps> = ({
  onScrollToTable,
}) => {
  const [timeStr, setTimeStr] = useState(getCurrentTime());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTimeStr(getCurrentTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Parallax effect
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
        <div className="max-w-4xl space-y-5">

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/25">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[11px] font-black tracking-widest uppercase text-amber-100">
                Viện Kiểm sát nhân dân
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full border border-emerald-400/40">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-[11px] font-bold text-emerald-100">
                Hệ thống chính thức
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Công văn gửi <span style={{ color: '#FFD700' }}>Lãnh đạo</span>
            </h1>
            <p className="text-sm text-red-100 mt-2 font-medium max-w-2xl">
              Hệ thống theo dõi, giám sát tiến độ xử lý công văn và báo cáo kết quả
              của các cấp Lãnh đạo Viện Kiểm sát Nhân dân Thành phố Hồ Chí Minh
            </p>
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

          {/* CTA Button */}
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

          {/* Greeting — đặt xuống dưới CTA */}
          <div className="mt-2 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md">
            <div className="text-[10px] uppercase tracking-widest text-amber-200 font-black">
              {getGreeting()}
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              Chúc Quý đồng chí một ngày làm việc hiệu quả
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicHeroSection;