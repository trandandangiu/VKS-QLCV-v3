// src/pages/PublicHome.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/format';
import { PublicMobileCards } from '../components/public/PublicMobileCards';
import { PublicDesktopTable } from '../components/public/PublicDesktopTable';
import { apiClient } from '../services/apiClient';
import { PushPermissionBanner } from '../components/header/PushPermissionBanner';
import {
  Clock, AlertTriangle, CheckCircle2, ArrowUp,
  LogOut, KeyRound, User as UserIcon, ChevronDown,
  X, Search, Filter,
} from 'lucide-react';
import { Dispatch } from '../types/dispatch';
import { resolveDispatchStatus } from '../services/excelService';
import { Pagination } from '../components/Pagination';
import { sortDispatchesNewestFirst } from '../services/dateSort';
import { PublicHeroSection } from '../components/public/PublicHeroSection';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from '../components/header/ProfileModal';
import { ChangePasswordModal } from '../components/header/ChangePasswordModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { DEFAULT_COLUMNS } from '../constants/columns';

export const PublicHome: React.FC = () => {
  const { currentUser, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedPvtId, setSelectedPvtId] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // ⭐ Dispatch đang xem chi tiết (mở Drawer)
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);

  // 🎯 Mobile filters
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [mobileStatusFilter, setMobileStatusFilter] = useState('ALL');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // 🎯 Xác định role
  const isPvt = currentUser?.role === 'PHO_VIEN_TRUONG';
  const isVt = currentUser?.role === 'VIEN_TRUONG';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isTp = currentUser?.role === 'TRUONG_PHONG';

  // 🎯 Chỉ PVT mới được bấm card của chính mình
  const canClickPvtCard = (pvtCard: { id: string; name: string }) => {
    if (!currentUser) return true;
    if (isVt || isAdmin) return true;
    if (isPvt) {
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
    return true;
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

  // 🎯 Auto-select PVT khi login bằng tài khoản PVT
  useEffect(() => {
    if (!currentUser || !isPvt) return;
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
  }, [currentUser, isPvt, pvtCards, selectedPvtId]);

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

  // 🎯 Filter theo search + status trên mobile
  const filteredDispatches = useMemo(() => {
    let result = filteredByPvt;

    if (mobileSearchQuery.trim()) {
      const q = mobileSearchQuery.toLowerCase();
      result = result.filter(d =>
        (d.soCongVan || '').toLowerCase().includes(q) ||
        (d.tenCongVan || '').toLowerCase().includes(q) ||
        (d.donViBanHanh || '').toLowerCase().includes(q) ||
        (d.nguoiThucHien || '').toLowerCase().includes(q)
      );
    }

    if (mobileStatusFilter !== 'ALL') {
      result = result.filter(d => {
        const st = resolveDispatchStatus(d);
        return st === mobileStatusFilter;
      });
    }

    return result;
  }, [filteredByPvt, mobileSearchQuery, mobileStatusFilter]);

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
    () => sortDispatchesNewestFirst(filteredDispatches),
    [filteredDispatches]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(displayDispatches.length / pageSize));

  useEffect(() => { setCurrentPage(1); }, [selectedPvtId, mobileSearchQuery, mobileStatusFilter]);

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
    window.location.reload();
  };

  // 🎯 Status badge
  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);
    const text = disp.thoiHanXuLy || '';
    if (status === 'HOAN_THANH') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />{text || 'Hoàn thành'}
      </span>
    );
    if (status === 'QUA_HAN') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-xs">
        <AlertTriangle className="w-3 h-3 text-rose-600" />{text || 'Quá hạn'}
      </span>
    );
    if (status === 'SAP_DEN_HAN') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
        <Clock className="w-3 h-3 text-amber-600" />{text || 'Sắp đến hạn'}
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3 h-3 text-blue-500" />{text || 'Đang xử lý'}
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
        <div className="w-full px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between gap-2">

            {/* LEFT: Logo + Title */}
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
              <img
                src="/logo.svg"
                alt="Huy hiệu VKSND"
                className="w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain shrink-0 drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-0.5 min-w-0 flex-1">
                <div
                  className="text-[9px] sm:text-xs lg:text-sm font-bold tracking-wider uppercase truncate"
                  style={{ color: '#FFD700' }}
                >
                  <span className="hidden sm:inline">VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH</span>
                  <span className="sm:hidden">VKSND TP.HCM</span>
                </div>

                <h1 className="text-sm sm:text-lg lg:text-2xl font-black tracking-wide uppercase text-white leading-tight truncate">
                  Công văn gửi lãnh đạo
                </h1>

                {currentTime && (
                  <p className="hidden sm:block text-[10px] sm:text-[11px] lg:text-xs text-white/80 capitalize font-medium truncate">
                    {currentTime}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">

              {!currentUser && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shadow-xs whitespace-nowrap"
                  title="Dành cho Quản trị viên & cán bộ nhập liệu"
                >
                  <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline">Đăng nhập</span>
                </Link>
              )}

              {currentUser && (
                <>
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
                      Bàn làm việc
                    </Link>
                  )}

                  {currentUser.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400/90 hover:bg-amber-300 text-red-950 border border-amber-300 transition shadow-xs whitespace-nowrap"
                    >
                      Quản trị
                    </Link>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 transition cursor-pointer"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs font-black text-white">
                          {currentUser.fullName.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-white/80" />
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                          <div className="px-4 py-3 bg-gradient-to-br from-red-900 to-amber-900 text-white">
                            <div className="text-xs font-bold text-amber-200 uppercase">
                              {currentUser.role === 'ADMIN' ? 'Quản trị viên'
                                : currentUser.role === 'VIEN_TRUONG' ? 'Viện trưởng'
                                  : currentUser.role === 'PHO_VIEN_TRUONG' ? 'Phó Viện trưởng'
                                    : 'Trưởng phòng'}
                            </div>
                            <div className="text-sm font-black truncate">{currentUser.fullName}</div>
                          </div>

                          <div className="py-1">
                            <button
                              onClick={() => { setIsUserMenuOpen(false); setIsProfileOpen(true); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                            >
                              <UserIcon className="w-4 h-4 text-blue-600" />
                              Thông tin cá nhân
                            </button>
                            <button
                              onClick={() => { setIsUserMenuOpen(false); setIsChangePasswordOpen(true); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                            >
                              <KeyRound className="w-4 h-4 text-amber-600" />
                              Đổi mật khẩu
                            </button>
                          </div>

                          <div className="border-t border-slate-100">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                            >
                              <LogOut className="w-4 h-4" />
                              Đăng xuất
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <PushPermissionBanner />

      {/* Main */}
      <main className="flex-1 w-full py-3 sm:py-5">
        <div className="max-w-[1200px] mx-auto w-full px-2 sm:px-4 lg:px-6 space-y-3 sm:space-y-4">

          <PublicHeroSection
            totalDispatches={stats.total}
            totalCompleted={stats.hoanThanh}
            totalOverdue={stats.quaHan}
            onScrollToTable={scrollToTable}
            pvtCards={pvtCards}
            selectedPvtId={selectedPvtId}
            onSelectPvt={(pvtId) => {
              if (!pvtId) { setSelectedPvtId(null); return; }
              const card = pvtCards.find(c => c.id === pvtId);
              if (!card) return;
              if (canClickPvtCard(card)) setSelectedPvtId(pvtId);
            }}
            canClickPvtCard={canClickPvtCard}
          />

          {/* MOBILE FILTER BAR */}
          <div className="sm:hidden bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm số CV, tên, đơn vị..."
                  value={mobileSearchQuery}
                  onChange={e => setMobileSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                {mobileSearchQuery && (
                  <button
                    onClick={() => setMobileSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className={`p-2 rounded-lg border transition ${showMobileFilter || mobileStatusFilter !== 'ALL'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-slate-50 border-slate-300 text-slate-600'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            {showMobileFilter && (
              <div className="px-2.5 pb-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                {[
                  { key: 'ALL', label: 'Tất cả', count: stats.total },
                  { key: 'DANG_XU_LY', label: 'Đang XL', count: stats.dangXuLy },
                  { key: 'SAP_DEN_HAN', label: 'Sắp hạn', count: stats.sapDenHan },
                  { key: 'QUA_HAN', label: 'Quá hạn', count: stats.quaHan },
                  { key: 'HOAN_THANH', label: 'Xong', count: stats.hoanThanh },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setMobileStatusFilter(item.key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${mobileStatusFilter === item.key
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                  >
                    {item.label}
                    <span className={`ml-1 ${mobileStatusFilter === item.key ? 'text-white/80' : 'text-slate-500'}`}>
                      ({item.count})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BẢNG / CARDS */}
          <div
            id="public-table-section"
            className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden w-full"
          >
            {/* Title */}
            <div
              className="text-white text-center py-2 sm:py-2.5 px-3 sm:px-4 border-b shadow-xs flex items-center justify-between gap-2"
              style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
            >
              <h2 className="text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase text-white flex-1 text-center truncate">
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
                  className="px-2 py-0.5 text-[10px] font-bold bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition cursor-pointer whitespace-nowrap"
                >
                  ✕ Bỏ lọc
                </button>
              )}
            </div>

            {/* MOBILE VIEW */}
            <div className="sm:hidden">
              <PublicMobileCards
                dispatches={paginatedDispatches}
                currentPage={currentPage}
                pageSize={pageSize}
                selectedPvtId={selectedPvtId}
                onSelectDispatch={(d) => setDetailDispatch(d)}
              />
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden sm:block">
              <PublicDesktopTable
                dispatches={paginatedDispatches}
                currentPage={currentPage}
                pageSize={pageSize}
                selectedPvtId={selectedPvtId}
                onSelectDispatch={(d) => setDetailDispatch(d)}
              />
            </div>

            {/* Pagination */}
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
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </div>
        </div>
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
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

      {/* ⭐ DRAWER CHI TIẾT CÔNG VĂN — hiện file đính kèm */}
      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
      />
    </div>
  );
};

export default PublicHome;