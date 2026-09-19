import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  Crown, 
  Users, 
  Briefcase, 
  Shield, 
  ChevronDown, 
  LogOut, 
  UserCog,
  LayoutDashboard
} from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, switchUser, allUsers, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getRoleBadge = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case 'VIEN_TRUONG':
        return (
          <span className="flex items-center gap-1 text-[11px] font-black uppercase text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-400/40">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            Viện Trưởng
          </span>
        );
      case 'PHO_VIEN_TRUONG':
        return (
          <span className="flex items-center gap-1 text-[11px] font-black uppercase text-amber-200 bg-black/40 px-2 py-0.5 rounded-full border border-amber-300/30">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            {currentUser.roomCode}
          </span>
        );
      case 'TRUONG_PHONG':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-blue-200 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-400/40">
            <Briefcase className="w-3.5 h-3.5 text-blue-300" />
            {currentUser.roomCode}
          </span>
        );
      case 'ADMIN':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-400/40">
            <Shield className="w-3.5 h-3.5 text-emerald-300" />
            Quản Trị
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header 
      className="text-white sticky top-0 z-40 shadow-md border-b-2"
      style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-3.5 sm:gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/logo.svg"
              alt="Huy hiệu Viện Kiểm sát Nhân dân"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-0.5">
              <div 
                className="text-[11px] sm:text-xs font-bold tracking-wider uppercase"
                style={{ color: '#FFD700' }}
              >
                VIỆN KIỂM SÁT NHÂN DÂN TP. HỒ CHÍ MINH
              </div>
              <h1 
                className="text-base sm:text-xl font-black tracking-wide uppercase text-white"
              >
                Hệ thống báo cáo công việc
              </h1>
            </div>
          </Link>

          {/* User Menu & Navigation */}
          <div className="flex items-center gap-3">
            {/* Current User Pill & Switch Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition cursor-pointer text-xs shadow-xs"
              >
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] text-amber-300 font-medium tracking-wide">
                    {currentUser ? currentUser.fullName : 'Chưa đăng nhập'}
                  </div>
                  <div className="font-semibold truncate max-w-[140px] mt-0.5">
                    {getRoleBadge()}
                  </div>
                </div>
                <div className="sm:hidden">
                  {getRoleBadge()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/80 transition-transform duration-150" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 text-slate-800 z-50 animate-fadeIn font-sans">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tài khoản đang đăng nhập</div>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">
                      {currentUser?.fullName || 'Khách'}
                    </div>
                    <div className="text-xs text-red-700 font-semibold mt-0.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-red-600" />
                      <span>{currentUser?.role} ({currentUser?.roomCode})</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition font-medium"
                    >
                      <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Trang hiển thị công khai toàn viện</span>
                    </Link>

                    <Link
                      to="/vt"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-amber-700 transition font-medium"
                    >
                      <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Bàn làm việc Viện Trưởng</span>
                    </Link>

                    <Link
                      to="/admin"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-red-700 transition font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Trang Quản Trị Hệ Thống (Admin)</span>
                    </Link>

                    <Link
                      to="/login"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-purple-700 transition font-medium"
                    >
                      <UserCog className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Đổi tài khoản / Vai trò khác</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-semibold"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Đăng xuất hệ thống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;
