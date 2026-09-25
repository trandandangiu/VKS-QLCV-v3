// src/pages/PublicHome.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/format';
import { apiClient } from '../services/apiClient';
import {
  Clock, AlertTriangle, CheckCircle2, ArrowUp,
  LogOut, KeyRound, User as UserIcon, ChevronDown,
} from 'lucide-react';
import { Dispatch } from '../types/dispatch';
import { resolveDispatchStatus } from '../services/excelService';
import { Pagination } from '../components/Pagination';
import { sortDispatchesNewestFirst } from '../services/dateSort';
import { PublicHeroSection } from '../components/public/PublicHeroSection';
// import { PublicFooter } from '../components/public/PublicFooter';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from '../components/header/ProfileModal';
import { ChangePasswordModal } from '../components/header/ChangePasswordModal';

export const PublicHome: React.FC = () => {
  const { currentUser, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedPvtId, setSelectedPvtId] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // 🎯 Xác định role
  const isPvt = currentUser?.role === 'PHO_VIEN_TRUONG';
  const isVt = currentUser?.role === 'VIEN_TRUONG';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isTp = currentUser?.role === 'TRUONG_PHONG';
  const canFilterPvt = isPvt || isVt || isAdmin;   // PVT, VT, Admin mới lọc được

  // 🎯 Chỉ PVT mới được bấm card của chính mình
  const canClickPvtCard = (pvtCard: { id: string; name: string }) => {
    if (!currentUser) return false;          // Khách → không bấm
    if (isVt || isAdmin) return true;        // VT/Admin → bấm tất cả
    if (isPvt) {
      // PVT chỉ bấm được card của chính mình
      const cleanName = currentUser.fullName
        .replace(/^Đồng chí\s+/i, '')
        .replace(/^Đ\/c\s+/i, '')
        .trim();
      return (
        pvtCard.id === currentUser.id ||
        pvtCard.name === cleanName ||
        (currentUser.roomCode && pvtCard.name.includes(currentUser.roomCode))
      );
    }
    return false;                             // TP → không bấm
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiClient.getDispatches({ limit: 500 });
        setDispatches(data);
      } catch (err) {
        console.error('Lỗi load dispatches:', err);
      }
    };
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    };
    updateClock();
    const t = setInterval(updateClock, 1000);
    return () => clearInterval(t);
  }, []);

  // 🎯 Auto-select PVT khi login bằng tài khoản PVT
  useEffect(() => {
    if (!currentUser || !isPvt) return;
    // Tìm card PVT khớp với user đang login
    const cleanName = currentUser.fullName
      .replace(/^Đồng chí\s+/i, '')
      .replace(/^Đ\/c\s+/i, '')
      .trim();
    const matched = pvtCards.find(p =>
      p.id === currentUser.id ||
      p.name === cleanName ||
      (currentUser.roomCode && p.roomCode === currentUser.roomCode)
    );
    if (matched && !selectedPvtId) {
      setSelectedPvtId(matched.id);
    }
  }, [currentUser, isPvt]);

  // 🎯 Tính PVT cards
  const pvtCards = useMemo(() => {
    const pvtMap = new Map<string, {
      id: string; name: string; roomCode: string;
      total: number; overdue: number; completed: number;
    }>();

    dispatches.forEach(d => {
      if (!d.assignedPvtId && !d.assignedPvtName) return;
      const key = d.assignedPvtId || d.assignedPvtName || '';
      if (!key) return;

      const cleanName = (d.assignedPvtName || '')
        .replace(/^Đồng chí\s+/i, '')
        .replace(/^Đ\/c\s+/i, '')
        .trim();

      const roomCodeMatch = (d.assignedPvtName || '').match(/PVT\d+/i);
      const roomCode = roomCodeMatch?.[0]?.toUpperCase() || '';

      if (!pvtMap.has(key)) {
        pvtMap.set(key, {
          id: d.assignedPvtId || key,
          name: cleanName,
          roomCode,
          total: 0, overdue: 0, completed: 0,
        });
      }

      const card = pvtMap.get(key)!;
      card.total += 1;
      const status = resolveDispatchStatus(d);
      if (status === 'HOAN_THANH') card.completed += 1;
      if (status === 'QUA_HAN') card.overdue += 1;
    });

    return Array.from(pvtMap.values()).sort((a, b) => {
      if (a.roomCode && b.roomCode) {
        return a.roomCode.localeCompare(b.roomCode, 'vi', { numeric: true });
      }
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [dispatches]);

  // 🎯 Filter theo PVT đang chọn
  const filteredByPvt = useMemo(() => {
    if (!selectedPvtId) return dispatches;
    const selected = pvtCards.find(p => p.id === selectedPvtId);
    if (!selected) return dispatches;

    return dispatches.filter(d => {
      if (d.assignedPvtId && d.assignedPvtId === selected.id) return true;
      const cleanAssigned = (d.assignedPvtName || '')
        .replace(/^Đồng chí\s+/i, '')
        .replace(/^Đ\/c\s+/i, '')
        .trim();
      if (cleanAssigned === selected.name) return true;
      if (selected.roomCode && (d.assignedPvtName || '').includes(selected.roomCode)) {
        return true;
      }
      return false;
    });
  }, [dispatches, selectedPvtId, pvtCards]);

  const stats = useMemo(() => {
    let dangXuLy = 0, sapDenHan = 0, quaHan = 0, hoanThanh = 0;
    filteredByPvt.forEach(d => {
      const st = resolveDispatchStatus(d);
      if (st === 'HOAN_THANH') hoanThanh++;
      else if (st === 'QUA_HAN') quaHan++;
      else if (st === 'SAP_DEN_HAN') sapDenHan++;
      else dangXuLy++;
    });
    return { total: filteredByPvt.length, dangXuLy, sapDenHan, quaHan, hoanThanh };
  }, [filteredByPvt]);

  const displayDispatches = useMemo(
    () => sortDispatchesNewestFirst(filteredByPvt),
    [filteredByPvt]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(displayDispatches.length / pageSize));

  useEffect(() => { setCurrentPage(1); }, [selectedPvtId]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const paginatedDispatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayDispatches.slice(start, start + pageSize);
  }, [displayDispatches, currentPage, pageSize]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollToTable = () => {
    document.getElementById('public-table-section')?.scrollIntoView({
      behavior: 'smooth', block: 'start',
    });
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    // Reload trang để reset state
    window.location.reload();
  };

  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);
    const text = disp.thoiHanXuLy || '';
    if (status === 'HOAN_THANH') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{text || 'Đã hoàn thành'}
      </span>
    );
    if (status === 'QUA_HAN') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />{text || 'Quá hạn'}
      </span>
    );
    if (status === 'SAP_DEN_HAN') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-amber-600" />{text || 'Sắp đến hạn'}
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-blue-500" />{text || 'Đang xử lý'}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900" style={{ backgroundColor: '#F5F5F0' }}>

      {/* ═══════════ HEADER ═══════════ */}
      <header
        className="text-white sticky top-0 z-30 shadow-md border-b-2 w-full"
        style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
      >
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.svg"
                alt="Huy hiệu VKSND"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-0.5">
                <div
                  className="text-xs sm:text-sm font-bold tracking-wider uppercase"
                  style={{ color: '#FFD700' }}
                >
                  VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
                </div>
                <h1 className="text-lg sm:text-2xl font-black tracking-wide uppercase text-white">
                  Công văn gửi lãnh đạo
                </h1>
                {currentTime && (
                  <p className="text-[11px] sm:text-xs text-white/80 capitalize font-medium">
                    {currentTime}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              {/* 🎯 Nếu CHƯA login → nút Đăng nhập */}
              {!currentUser && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shadow-xs whitespace-nowrap"
                >
                  Đăng nhập vai trò
                </Link>
              )}

              {/* 🎯 Nếu ĐÃ login → thêm nút "Về bàn làm việc" + user menu */}
              {currentUser && (
                <>
                  {/* 🎯 Nút VỀ BÀN LÀM VIỆC — chỉ hiện với role có dashboard */}
                  {currentUser.role !== 'ADMIN' && (
                    <Link
                      to={
                        currentUser.role === 'VIEN_TRUONG' ? '/vt'
                          : currentUser.role === 'PHO_VIEN_TRUONG' ? '/pvt'
                            : currentUser.role === 'TRUONG_PHONG' ? '/tp'
                              : '/'
                      }
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400/90 hover:bg-amber-300 text-red-950 border border-amber-300 transition shadow-xs whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Về bàn làm việc
                    </Link>
                  )}

                  {/* Nếu là ADMIN → nút "Quản trị" */}
                  {currentUser.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400/90 hover:bg-amber-300 text-red-950 border border-amber-300 transition shadow-xs whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Quản trị
                    </Link>
                  )}

                  {/* User menu dropdown */}
                  <div className="relative">
                    {/* ... user menu button ... (giữ nguyên) */}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full py-5">
        <div className="max-w-[1200px] mx-auto w-full px-3 sm:px-4 lg:px-6 space-y-4">

          {/* HERO — truyền pvtCards + logic click */}
          <PublicHeroSection
            totalDispatches={stats.total}
            totalCompleted={stats.hoanThanh}
            totalOverdue={stats.quaHan}
            onScrollToTable={scrollToTable}
            pvtCards={pvtCards}
            selectedPvtId={selectedPvtId}
            onSelectPvt={(pvtId) => {
              // 🎯 Chỉ cho phép click nếu có quyền
              if (!pvtId) {
                setSelectedPvtId(null);
                return;
              }
              const card = pvtCards.find(c => c.id === pvtId);
              if (!card) return;
              if (canClickPvtCard(card)) {
                setSelectedPvtId(pvtId);
              }
            }}
            // 🎯 Truyền thêm flag để Hero biết card nào bấm được
            canClickPvtCard={canClickPvtCard}
          />

          {/* BẢNG CÔNG VĂN */}
          <div
            id="public-table-section"
            className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden w-full"
          >
            <div
              className="text-white text-center py-2.5 px-4 border-b shadow-xs flex items-center justify-between"
              style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
            >
              <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-white flex-1 text-center">
                CÔNG VĂN GỬI LÃNH ĐẠO
                {selectedPvtId && (
                  <span className="ml-2 text-amber-300 font-black">
                    — {pvtCards.find(p => p.id === selectedPvtId)?.name}
                  </span>
                )}
              </h2>
              {selectedPvtId && (
                <button
                  onClick={() => setSelectedPvtId(null)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition cursor-pointer whitespace-nowrap"
                >
                  ✕ Bỏ lọc
                </button>
              )}
            </div>

            <div
              id="public-table-scroll-container"
              className="overflow-x-auto overflow-y-auto h-[800px] border-t border-slate-200"
            >
              <table className="w-full text-left border-collapse min-w-[1500px]">
                <thead className="sticky top-0 z-10 shadow-2xs">
                  <tr className="bg-[#b9d1ea] text-[#0f2942] border-b-2 border-slate-400">
                    {[
                      'STT', 'SỐ CÔNG VĂN', 'NGÀY GỬI', 'TÊN CÔNG VĂN', 'HẠN BÁO CÁO',
                      'THỜI HẠN XỬ LÝ', 'ĐƠN VỊ BAN HÀNH', 'NGƯỜI THỰC HIỆN', 'GHI CHÚ'
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center last:border-r-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                  {displayDispatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-28 px-4 text-slate-400 bg-slate-50/40">
                        <p className="text-sm text-slate-400 font-medium">
                          {selectedPvtId
                            ? 'Không có công văn nào cho lãnh đạo này'
                            : 'Hiện không có công văn nào để hiển thị'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedDispatches.map((disp, idx) => {
                      const status = resolveDispatchStatus(disp);
                      const isOverdue = status === 'QUA_HAN';
                      const isCompleted = status === 'HOAN_THANH';
                      return (
                        <tr
                          key={disp.id || idx}
                          className={`transition-colors ${isOverdue ? 'bg-rose-50/30 hover:bg-rose-50/60'
                            : isCompleted ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                              : idx % 2 === 0 ? 'bg-white hover:bg-slate-50'
                                : 'bg-slate-50/40 hover:bg-slate-100/60'
                            }`}
                        >
                          <td className="px-3 py-5 sm:py-6 text-center border-r border-slate-100 text-slate-600 font-semibold">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="font-semibold text-xs text-slate-900 bg-slate-100/90 px-2 py-1 rounded border border-slate-200 inline-block w-fit">
                              {disp.soCongVan || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                              {formatDate(disp.ngayGui)}
                            </span>
                          </td>
                          <td className="px-5 py-5 sm:py-6 border-r border-slate-100 min-w-[320px] max-w-[500px]">
                            <span
                              className="text-left font-semibold text-slate-900 text-sm leading-relaxed block"
                              title={disp.tenCongVan}
                            >
                              {disp.tenCongVan || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                              {formatDate(disp.hanBaoCaoXuLy)}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-center">
                            {renderStatusBadge(disp)}
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium text-xs whitespace-nowrap">
                              {disp.donViBanHanh || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="font-medium text-slate-800 text-xs whitespace-nowrap">
                              {disp.nguoiThucHien || 'Chưa giao'}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 min-w-[180px]">
                            <div className="text-xs text-slate-600 leading-relaxed" title={disp.ghiChu}>
                              {disp.ghiChu || <span className="text-slate-300 italic">-</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={displayDispatches.length}
                pageSize={pageSize}
                onPageChange={p => {
                  setCurrentPage(p);
                  document.getElementById('public-table-scroll-container')
                    ?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </div>

          {/* <PublicFooter /> */}
        </div>
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          style={{ backgroundColor: '#B71C1C', border: '2px solid #FFD700' }}
          title="Về đầu trang"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdated={() => refreshCurrentUser()}
      />

      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userId={currentUser.id}
          userName={currentUser.fullName}
        />
      )}
    </div>
  );
};

export default PublicHome;