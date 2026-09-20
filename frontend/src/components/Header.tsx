// src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserMenuDropdown } from './header/UserMenuDropdown';
import { ProfileModal } from './header/ProfileModal';
import { ChangePasswordModal } from './header/ChangePasswordModal';

export const Header: React.FC = () => {
  const { currentUser, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              <h1 className="text-base sm:text-xl font-black tracking-wide uppercase text-white">
                Hệ thống báo cáo công việc
              </h1>
            </div>
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <UserMenuDropdown
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdated={(updatedUser) => {
          // Refresh context để mọi nơi dùng user mới
          refreshCurrentUser();
        }}
      />

      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userId={currentUser.id}
          userName={currentUser.fullName}
          onSuccess={() => {
            // Optional: hiển thị thông báo
          }}
        />
      )}
    </header>
  );
};

export default Header;