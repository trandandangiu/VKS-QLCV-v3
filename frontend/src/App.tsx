// frontend/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicHome from './pages/PublicHome';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VienTruongDashboard from './pages/VienTruongDashboard';
import PhoVienTruongDashboard from './pages/PhoVienTruongDashboard';
import TruongPhongDashboard from './pages/TruongPhongDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* 1. PUBLIC */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<Login />} />

      {/* 2. ADMIN — CHỈ ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 3. VIỆN TRƯỞNG */}
      <Route
        path="/vt"
        element={
          <ProtectedRoute allowedRoles={['VIEN_TRUONG', 'ADMIN']}>
            <VienTruongDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/Vt" element={<Navigate to="/vt" replace />} />
      <Route path="/VT" element={<Navigate to="/vt" replace />} />

      {/* 4. PHÓ VIỆN TRƯỞNG */}
      <Route
        path="/pvt/:id"
        element={
          <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
            <PhoVienTruongDashboard />
          </ProtectedRoute>
        }
      />
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
        <React.Fragment key={`pvt-${num}`}>
          <Route
            path={`/pvt${num}`}
            element={
              <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
                <PhoVienTruongDashboard />
              </ProtectedRoute>
            }
          />
          <Route path={`/PVT${num}`} element={<Navigate to={`/pvt${num}`} replace />} />
        </React.Fragment>
      ))}

      {/* 5. TRƯỞNG PHÒNG */}
      <Route
        path="/tp/:id"
        element={
          <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
            <TruongPhongDashboard />
          </ProtectedRoute>
        }
      />
      {[1, 2, 3, 7, 8, 9, 10, 11, 12, 4, 5, 6].map(num => (
        <React.Fragment key={`tp-${num}`}>
          <Route
            path={`/tp${num}`}
            element={
              <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
                <TruongPhongDashboard />
              </ProtectedRoute>
            }
          />
          <Route path={`/Tp${num}`} element={<Navigate to={`/tp${num}`} replace />} />
          <Route path={`/TP${num}`} element={<Navigate to={`/tp${num}`} replace />} />
        </React.Fragment>
      ))}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}