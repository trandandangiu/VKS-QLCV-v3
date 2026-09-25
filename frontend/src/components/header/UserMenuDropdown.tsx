// src/components/header/UserMenuDropdown.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';   // 🎯 THÊM LẠI
import {
  ChevronDown,
  LogOut,
  User as UserIcon,
  KeyRound,
  Shield,
  Eye,          // 🎯 THÊM — icon cho "Trang công khai"
  ChevronRight, // 🎯 THÊM — mũi tên chỉ
} from 'lucide-react';
import { User } from '../../types/auth';

interface UserMenuDropdownProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenChangePassword: () => void;
}

// ============================================
// ROLE LABEL — ngắn gọn, chỉ hiện chức danh
// ============================================
const getRoleLabel = (role?: string): string => {
  switch (role) {
    case 'ADMIN': return 'Quản trị viên';
    case 'VIEN_TRUONG': return 'Viện trưởng';
    case 'PHO_VIEN_TRUONG': return 'Phó Viện trưởng';
    case 'TRUONG_PHONG': return 'Trưởng phòng';
    default: return 'Người dùng';
  }
};

const getRoleColor = (role?: string): string => {
  switch (role) {
    case 'ADMIN': return 'from-emerald-500 to-emerald-700';
    case 'VIEN_TRUONG': return 'from-red-700 to-red-900';
    case 'PHO_VIEN_TRUONG': return 'from-amber-500 to-orange-600';
    case 'TRUONG_PHONG': return 'from-blue-500 to-blue-700';
    default: return 'from-slate-500 to-slate-700';
  }
};

const getRoleBadgeClass = (role?: string): string => {
  switch (role) {
    case 'ADMIN': return 'bg-emerald-950/80 text-emerald-300 border-emerald-400/40';
    case 'VIEN_TRUONG': return 'bg-amber-950/80 text-amber-300 border-amber-400/40';
    case 'PHO_VIEN_TRUONG': return 'bg-black/40 text-amber-200 border-amber-300/30';
    case 'TRUONG_PHONG': return 'bg-blue-950/80 text-blue-200 border-blue-400/40';
    default: return 'bg-slate-900/80 text-slate-300 border-slate-400/40';
  }
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
};

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  currentUser,
  onLogout,
  onOpenProfile,
  onOpenChangePassword,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();   // 🎯 THÊM LẠI

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen]);

  if (!currentUser) return null;

  const initials = getInitials(currentUser.fullName);
  const roleColor = getRoleColor(currentUser.role);
  const roleBadge = getRoleBadgeClass(currentUser.role);

  // 🎯 Hàm chuyển trang
  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="group flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition cursor-pointer text-xs shadow-xs"
      >
        <div
          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center shadow-md border border-white/30 group-hover:scale-105 transition`}
        >
          <span className="text-[11px] font-black text-white tracking-wider">
            {initials}
          </span>
        </div>

        <div className="text-left hidden sm:block min-w-0">
          {/* <div className="text-xs font-bold text-white truncate max-w-[130px]">
            {currentUser.fullName}
          </div> */}
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleBadge}`}
            >
              <Shield className="w-2.5 h-2.5" />
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn font-sans">
          {/* Header gradient */}
          <div className="relative px-4 py-4 bg-gradient-to-br from-red-900 via-red-800 to-amber-900 text-white">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="dots-menu" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots-menu)" />
              </svg>
            </div>

            <div className="relative flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${roleColor} flex items-center justify-center border-2 border-white/30 shadow-lg`}
              >
                <span className="text-base font-black text-white tracking-wider">
                  {initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">
                  {getRoleLabel(currentUser.role)}
                </div>
                {/* <div className="text-sm font-black text-white truncate">
                  {currentUser.fullName}
                </div> */}
                {/* <div className="text-[11px] text-red-100 truncate font-mono mt-0.5">
                  {currentUser.email || currentUser.username}
                </div> */}
              </div>
            </div>
          </div>

          {/* Account section */}
          <div className="py-1.5">
            <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Tài khoản
            </div>

            <MenuButton
              icon={UserIcon}
              label="Thông tin cá nhân"
              description="Xem hồ sơ cán bộ"
              color="text-blue-600"
              onClick={() => {
                setIsOpen(false);
                onOpenProfile();
              }}
            />

            <MenuButton
              icon={KeyRound}
              label="Đổi mật khẩu"
              description="Cập nhật bảo mật"
              color="text-amber-600"
              onClick={() => {
                setIsOpen(false);
                onOpenChangePassword();
              }}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* 🎯 SECTION: Điều hướng nhanh — CHỈ CÓ "Trang công khai" */}
          <div className="py-1.5">
            <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Điều hướng
            </div>

            <button
              onClick={() => handleNavigate('/')}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-red-700 transition font-medium group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition">
                  Trang công khai
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Xem danh sách công văn công khai
                </div>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-red-500 group-hover:translate-x-0.5 transition shrink-0" />
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Logout */}
          <div className="py-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer font-bold"
            >
              <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <span className="flex-1 text-left">Đăng xuất hệ thống</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MENU BUTTON
// ============================================
interface MenuButtonProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  color: string;
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({
  icon: Icon,
  label,
  description,
  color,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2 text-xs hover:bg-slate-50 transition cursor-pointer group"
  >
    <div className={`w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-white border border-slate-100`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
    </div>
    <div className="flex-1 text-left min-w-0">
      <div className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition">
        {label}
      </div>
      {description && (
        <div className="text-[10px] text-slate-500 truncate">{description}</div>
      )}
    </div>
  </button>
);

export default UserMenuDropdown;