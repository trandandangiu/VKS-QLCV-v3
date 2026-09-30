// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './hooks/useDialog';
import { ProtectedRoute } from './components/ProtectedRoute';

import { PublicHome } from './pages/PublicHome';
import { Login } from './pages/Login';
import { DispatchDeepLink } from './pages/DispatchDeepLink';
import { AdminDashboard } from './pages/AdminDashboard';
import { VienTruongDashboard } from './pages/VienTruongDashboard';
import { PhoVienTruongDashboard } from './pages/PhoVienTruongDashboard';
import { TruongPhongDashboard } from './pages/TruongPhongDashboard';
import { useAutoPush } from './hooks/useAutoPush';
import { ChuyenDeDetailPage } from './pages/ChuyenDeDetailPage';

const AppContent: React.FC = () => {
  // ⭐ Tự động đăng ký Web Push khi login
  useAutoPush();

  return (
    <Routes>
      {/* ── CÔNG KHAI ── */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<Login />} />

      {/* ⭐ DEEP LINK từ thông báo */}
      <Route path="/dispatches/:id" element={<DispatchDeepLink />} />

      {/* ── ADMIN ── */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── VIỆN TRƯỞNG ── */}
      <Route
        path="/vt/*"
        element={
          <ProtectedRoute allowedRoles={['VIEN_TRUONG', 'ADMIN']}>
            <VienTruongDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── PHÓ VIỆN TRƯỞNG ── */}
      <Route
        path="/pvt/*"
        element={
          <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
            <PhoVienTruongDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pvt/:id"
        element={
          <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
            <PhoVienTruongDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── TRƯỞNG PHÒNG ── */}
      <Route
        path="/tp/*"
        element={
          <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
            <TruongPhongDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tp/:id"
        element={
          <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
            <TruongPhongDashboard />
          </ProtectedRoute>
        }
      />
      {/* ⭐ Trang chi tiết chuyên đề */}
      <Route path="/chuyende/:id" element={<ChuyenDeDetailPage />} />
      {/* ── FALLBACK ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DialogProvider>
        <AppContent />
      </DialogProvider>
    </AuthProvider>
  );
};

export default App;