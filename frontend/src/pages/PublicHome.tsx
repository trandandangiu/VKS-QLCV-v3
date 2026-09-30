// src/pages/PublicHome.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/format';
import { PublicMobileCards } from '../components/public/PublicMobileCards';
import { PublicDesktopTable } from '../components/public/PublicDesktopTable';
import { apiClient } from '../services/apiClient';
import { ChuyenDeDrawer } from '../components/chuyende/ChuyenDeDrawer';
import { isChuyenDe } from '../utils/chuyenDe';

import {
  Clock, AlertTriangle, CheckCircle2, ArrowUp,
  LogOut, KeyRound, ChevronDown,
  X, Search, Filter,
} from 'lucide-react';
import { Dispatch } from '../types/dispatch';
import { User } from '../types/auth';
import { resolveDispatchStatus } from '../services/excelService';
import { Pagination } from '../components/Pagination';
import { sortDispatchesNewestFirst } from '../services/dateSort';
import { PublicHeroSection } from '../components/public/PublicHeroSection';
import { useAuth } from '../context/AuthContext';

import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { DEFAULT_COLUMNS } from '../constants/columns';

export const PublicHome: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [allPvts, setAllPvts] = useState<User[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedPvtId, setSelectedPvtId] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // ⭐ TÁCH RIÊNG 2 STATE: công văn thường vs chuyên đề
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [detailChuyenDe, setDetailChuyenDe] = useState<Dispatch | null>(null);

  // 🎯 Mobile filters
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [mobileStatusFilter, setMobileStatusFilter] = useState('ALL');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [isOverdueFilterActive, setIsOverdueFilterActive] = useState(false);
  const [sortMode, setSortMode] = useState<'deadline_asc' | 'deadline_desc' | 'newest' | 'oldest' | 'overdue_desc' | 'priority'>('priority');

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

  // ⭐ Load TẤT CẢ PVT + dispatches
  useEffect(() => {
    const loadAllPvts = async () => {
      try {
        const users = await apiClient.getAllUsers({ role: 'PHO_VIEN_TRUONG', limit: 100 });
        setAllPvts(users);
      } catch (err) {
        console.error('Lỗi load danh sách PVT:', err);
      }
    };

    const loadDispatches = async () => {
      try {
        const data = await apiClient.getDispatches({ limit: 500 });
        setDispatches(data);
      } catch (err) {
        console.error('Lỗi load dispatches:', err);
      }
    };

    loadAllPvts();
    loadDispatches();

    const interval = setInterval(loadDispatches, 60000);
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

  // ⭐ Tính PVT cards
  const pvtCards = useMemo(() => {
    if (allPvts.length === 0) {
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

      return Array.from(pvtMap.values());
    }

    return allPvts
      .filter(u => u.role === 'PHO_VIEN_TRUONG' && u.active !== false)
      .map(pvt => {
        const pvtDispatches = dispatches.filter(d => {
          if (d.assignedPvtId && d.assignedPvtId === pvt.id) return true;
          const cleanAssigned = (d.assignedPvtName || '')
            .replace(/^Đồng chí\s+/i, '')
            .replace(/^Đ\/c\s+/i, '')
            .trim();
          const cleanPvt = (pvt.fullName || '')
            .replace(/^Đồng chí\s+/i, '')
            .replace(/^Đ\/c\s+/i, '')
            .trim();
          if (cleanAssigned && cleanPvt && cleanAssigned === cleanPvt) return true;
          if (pvt.roomCode && (d.assignedPvtName || '').includes(pvt.roomCode)) return true;
          return false;
        });

        const total = pvtDispatches.length;
        const overdue = pvtDispatches.filter(d =>
          resolveDispatchStatus(d) === 'QUA_HAN'
        ).length;
        const completed = pvtDispatches.filter(d =>
          resolveDispatchStatus(d) === 'HOAN_THANH'
        ).length;

        return {
          id: pvt.id,
          name: pvt.fullName,
          roomCode: pvt.roomCode || '',
          total,
          overdue,
          completed,
        };
      })
      .sort((a, b) => {
        if (a.overdue > 0 && b.overdue === 0) return -1;
        if (a.overdue === 0 && b.overdue > 0) return 1;
        if (a.total > 0 && b.total === 0) return -1;
        if (a.total === 0 && b.total > 0) return 1;
        if (a.total !== b.total) return b.total - a.total;
        return a.roomCode.localeCompare(b.roomCode, 'vi', { numeric: true });
      });
  }, [allPvts, dispatches]);

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
    let result = dispatches;

    if (selectedPvtId) {
      const selected = pvtCards.find(p => p.id === selectedPvtId);
      if (selected) {
        const norm = (s?: string) =>
          (s || '')
            .replace(/^Đồng chí\s+/i, '')
            .replace(/^Đ\/c\s+/i, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        const selectedName = norm(selected.name);
        const selectedRoom = (selected.roomCode || '').toUpperCase();

        result = result.filter(d => {
          if (d.assignedPvtId && d.assignedPvtId === selected.id) return true;
          const assignedName = norm(d.assignedPvtName);
          if (assignedName && selectedName && assignedName === selectedName) return true;
          if (selectedRoom) {
            const assignedNameUpper = (d.assignedPvtName || '').toUpperCase();
            if (assignedNameUpper.includes(selectedRoom)) return true;
          }
          if (selectedName && assignedName) {
            if (assignedName.includes(selectedName) || selectedName.includes(assignedName)) {
              return true;
            }
          }
          return false;
        });
      }
    }

    if (isOverdueFilterActive) {
      result = result.filter(d => resolveDispatchStatus(d) === 'QUA_HAN');
    }

    return result;
  }, [dispatches, selectedPvtId, pvtCards, isOverdueFilterActive]);

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
    dispatches.forEach(d => {
      const st = resolveDispatchStatus(d);
      if (st === 'HOAN_THANH') hoanThanh++;
      else if (st === 'QUA_HAN') quaHan++;
      else if (st === 'SAP_DEN_HAN') sapDenHan++;
      else dangXuLy++;
    });
    return {
      total: dispatches.length,
      dangXuLy,
      sapDenHan,
      quaHan,
      hoanThanh,
    };
  }, [dispatches]);

  const displayDispatches = useMemo(() => {
    const list = [...filteredDispatches];

    const daysToDeadline = (d: Dispatch): number => {
      if (!d.hanBaoCaoXuLy) return 9999;
      const deadline = new Date(d.hanBaoCaoXuLy);
      deadline.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return Math.round((deadline.getTime() - today.getTime()) / 86400000);
    };

    const priorityScore = (d: Dispatch): number => {
      if (d.trangThai === 'HOAN_THANH') return 5;
      const days = daysToDeadline(d);
      if (days < 0) return 1;
      if (days === 0) return 2;
      if (days <= 3) return 3;
      if (days <= 10) return 4;
      return 4;
    };

    switch (sortMode) {
      case 'deadline_asc':
        return list.sort((a, b) => {
          const aDone = a.trangThai === 'HOAN_THANH' ? 1 : 0;
          const bDone = b.trangThai === 'HOAN_THANH' ? 1 : 0;
          if (aDone !== bDone) return aDone - bDone;
          return daysToDeadline(a) - daysToDeadline(b);
        });

      case 'deadline_desc':
        return list.sort((a, b) => daysToDeadline(b) - daysToDeadline(a));

      case 'overdue_desc':
        return list.sort((a, b) => {
          const aDays = daysToDeadline(a);
          const bDays = daysToDeadline(b);
          if (aDays >= 0 && bDays >= 0) return aDays - bDays;
          if (aDays >= 0) return 1;
          if (bDays >= 0) return -1;
          return aDays - bDays;
        });

      case 'oldest':
        return list.sort((a, b) => {
          const da = new Date(a.ngayGui || a.ngayPhatHanh || 0).getTime();
          const db = new Date(b.ngayGui || b.ngayPhatHanh || 0).getTime();
          return da - db;
        });

      case 'priority':
        return list.sort((a, b) => {
          const pa = priorityScore(a);
          const pb = priorityScore(b);
          if (pa !== pb) return pa - pb;
          return daysToDeadline(a) - daysToDeadline(b);
        });

      case 'newest':
      default:
        return sortDispatchesNewestFirst(list);
    }
  }, [filteredDispatches, sortMode]);

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

  // ⭐ FIX: Handler duy nhất mở detail — phân loại chuyên đề vs công văn
  const handleOpenDetail = (d: Dispatch) => {
    if (isChuyenDe(d)) {
      setDetailChuyenDe(d);
    } else {
      setDetailDispatch(d);
    }
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
                  VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
                </div>
                <h1 className="text-sm sm:text-lg lg:text-2xl font-black tracking-wide uppercase text-white leading-tight truncate">
                  THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN
                </h1>
                {currentTime && (
                  <p className="hidden sm:block text-[10px] sm:text-[11px] lg:text-xs text-white/80 capitalize font-medium truncate">
                    {currentTime}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
              {!currentUser && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shadow-xs whitespace-nowrap"
                  title="Dành cho Quản trị viên & cán bộ nhập liệu"
                >
                  <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline"></span>
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
                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                          <div className="px-4 py-3 bg-gradient-to-br from-red-900 to-amber-900 text-white">
                            <div className="text-xs font-bold text-amber-200 uppercase">
                              {currentUser.role === 'ADMIN' ? 'Quản trị viên'
                                : currentUser.role === 'VIEN_TRUONG' ? 'Viện trưởng'
                                  : currentUser.role === 'PHO_VIEN_TRUONG' ? 'Phó Viện trưởng'
                                    : 'Trưởng phòng'}
                            </div>
                          </div>

                          <div className="py-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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

      {/* Main */}
      <main className="flex-1 w-full py-2 sm:py-3">
        <div className="max-w-[1600px] mx-auto w-full px-2 sm:px-3 lg:px-4 space-y-2 sm:space-y-3">

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
            onFilterOverdue={() => {
              setIsOverdueFilterActive(prev => !prev);
              setTimeout(() => {
                document.getElementById('public-table-section')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }, 100);
            }}
            isOverdueFilterActive={isOverdueFilterActive}
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
              <>
                <div className="px-2.5 pb-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                  {[
                    { value: 'ALL', label: 'Tất cả' },
                    { value: 'DANG_XU_LY', label: 'Đang xử lý' },
                    { value: 'SAP_DEN_HAN', label: 'Sắp hạn' },
                    { value: 'QUA_HAN', label: 'Quá hạn' },
                    { value: 'HOAN_THANH', label: 'Hoàn thành' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMobileStatusFilter(opt.value)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${mobileStatusFilter === opt.value
                        ? 'bg-red-700 text-white border-red-700'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="px-2.5 pb-2.5 border-t border-slate-100 pt-2.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sắp xếp theo
                  </label>
                  <select
                    value={sortMode}
                    onChange={e => setSortMode(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
                  >
                    <option value="priority">⭐ Ưu tiên (quá hạn → sắp hạn)</option>
                    <option value="deadline_asc">📅 Hạn gần nhất lên trước</option>
                    <option value="deadline_desc">📅 Hạn xa nhất lên trước</option>
                    <option value="overdue_desc">🚨 Quá hạn lâu nhất</option>
                    <option value="newest">🆕 Mới nhất</option>
                    <option value="oldest">🕰️ Cũ nhất</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* BẢNG / CARDS */}
          <div
            id="public-table-section"
            className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden w-full"
          >
            <div
              className="text-white py-2 sm:py-2.5 px-3 sm:px-4 border-b shadow-xs"
              style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase text-white flex-1 text-center">
                  THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN
                </h2>
                {(selectedPvtId || isOverdueFilterActive) && (
                  <button
                    onClick={() => {
                      setSelectedPvtId(null);
                      setIsOverdueFilterActive(false);
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    ✕ Bỏ lọc
                  </button>
                )}
              </div>

              {selectedPvtId && (
                <div className="mt-1.5 flex items-center justify-center gap-1.5 flex-wrap text-[10px] sm:text-xs">
                  <span className="text-white/70"></span>
                  <span className="px-2 py-0.5 bg-amber-400 text-red-950 font-black rounded">
                    {pvtCards.find(p => p.id === selectedPvtId)?.name}
                  </span>
                  <span className="text-white/70">· {displayDispatches.length} công văn</span>
                </div>
              )}

              {isOverdueFilterActive && !selectedPvtId && (
                <div className="mt-1.5 text-center text-[10px] sm:text-xs">
                  <span className="px-2 py-0.5 bg-rose-400 text-white font-black rounded">
                    🚨 CHỈ HIỆN QUÁ HẠN
                  </span>
                </div>
              )}
            </div>

            <div className="sm:hidden">
              <PublicMobileCards
                dispatches={paginatedDispatches}
                currentPage={currentPage}
                pageSize={pageSize}
                selectedPvtId={selectedPvtId}
                onSelectDispatch={handleOpenDetail}
              />
            </div>

            <div className="hidden sm:block">
              <PublicDesktopTable
                dispatches={paginatedDispatches}
                currentPage={currentPage}
                pageSize={pageSize}
                selectedPvtId={selectedPvtId}
                onSelectDispatch={handleOpenDetail}
              />
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

      {/* ⭐ FIX: Công văn thường → DispatchDetailDrawer */}
      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        readOnly={true}
      />

      {/* ⭐ FIX: Chuyên đề → ChuyenDeDrawer (TÁCH RIÊNG STATE) */}
      <ChuyenDeDrawer
        chuyenDe={detailChuyenDe}
        onClose={() => setDetailChuyenDe(null)}
        readOnly={true}
        canEdit={false}
      />
    </div>
  );
};

export default PublicHome;