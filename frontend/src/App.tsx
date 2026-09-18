import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicHome from './pages/PublicHome';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VienTruongDashboard from './pages/VienTruongDashboard';
import PhoVienTruongDashboard from './pages/PhoVienTruongDashboard';
import TruongPhongDashboard from './pages/TruongPhongDashboard';

export default function App() {
  return (
    <Routes>
      {/* 1. MÀN HÌNH HIỂN THỊ CÔNG KHAI TOÀN CƠ QUAN */}
      <Route path="/" element={<PublicHome />} />

      {/* 2. TRANG ĐĂNG NHẬP VÀ CHUYỂN ĐỔI VAI TRÒ NHANH */}
      <Route path="/login" element={<Login />} />

      {/* 3. PHÂN HỆ QUẢN TRỊ HỆ THỐNG (/admin) */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* 4. PHÂN HỆ VIỆN TRƯỞNG (/vt hoặc /Vt) - NẮM TOÀN QUYỀN & BIỂU ĐỒ TRÒN TIẾN ĐỘ */}
      <Route path="/vt" element={<VienTruongDashboard />} />
      <Route path="/Vt" element={<Navigate to="/vt" replace />} />
      <Route path="/VT" element={<Navigate to="/vt" replace />} />

      {/* 5. 12 TÀI KHOẢN PHÓ VIỆN TRƯỞNG (/pvt/:id và /pvt1 -> /pvt12) */}
      <Route path="/pvt/:id" element={<PhoVienTruongDashboard />} />
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
        <React.Fragment key={`pvt-${num}`}>
          <Route path={`/pvt${num}`} element={<PhoVienTruongDashboard />} />
          <Route path={`/PVT${num}`} element={<Navigate to={`/pvt${num}`} replace />} />
        </React.Fragment>
      ))}

      {/* 6. 12 TÀI KHOẢN LÃNH ĐẠO PHÒNG (/tp/:id và /tp1, 2, 3, 7, 8, 9, 10, 11, 12, 4, 5, 6) */}
      <Route path="/tp/:id" element={<TruongPhongDashboard />} />
      {[1, 2, 3, 7, 8, 9, 10, 11, 12, 4, 5, 6].map(num => (
        <React.Fragment key={`tp-${num}`}>
          <Route path={`/tp${num}`} element={<TruongPhongDashboard />} />
          <Route path={`/Tp${num}`} element={<Navigate to={`/tp${num}`} replace />} />
          <Route path={`/TP${num}`} element={<Navigate to={`/tp${num}`} replace />} />
        </React.Fragment>
      ))}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}