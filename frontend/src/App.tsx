// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './hooks/useDialog';
import { ProtectedRoute } from './components/ProtectedRoute';

import { PublicHome } from './pages/PublicHome';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { VienTruongDashboard } from './pages/VienTruongDashboard';
import { PhoVienTruongDashboard } from './pages/PhoVienTruongDashboard';
import { TruongPhongDashboard } from './pages/TruongPhongDashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DialogProvider>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<Login />} />

          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/vt/*" element={
            <ProtectedRoute allowedRoles={['VIEN_TRUONG', 'ADMIN']}>
              <VienTruongDashboard />
            </ProtectedRoute>
          } />

          <Route path="/pvt/*" element={
            <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
              <PhoVienTruongDashboard />
            </ProtectedRoute>
          } />
          <Route path="/pvt/:id" element={
            <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
              <PhoVienTruongDashboard />
            </ProtectedRoute>
          } />

          <Route path="/tp/*" element={
            <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
              <TruongPhongDashboard />
            </ProtectedRoute>
          } />
          <Route path="/tp/:id" element={
            <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
              <TruongPhongDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DialogProvider>
    </AuthProvider>
  );
};

export default App;