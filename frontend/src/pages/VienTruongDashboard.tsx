// src/pages/VienTruongDashboard.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AssignPvtModal } from '../components/AssignPvtModal';
import { AssignTpModal } from '../components/AssignTpModal';
import { DispatchModal } from '../components/DispatchModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import { useVtDashboard } from '../hooks/vt/useVtDashboard';
import { VtFilters, DEFAULT_VT_FILTERS } from '../types/vt';
import { formatDate } from '../utils/format';

// VT Components
import { VtHeroHeader } from '../components/vt/VtHeroHeader';
import { VtKpiGrid } from '../components/vt/VtKpiGrid';
import { VtPvtLeaderboard } from '../components/vt/VtPvtLeaderboard';
import { VtDeptHeatmap } from '../components/vt/VtDeptHeatmap';
import {
  VtTrendChart,
  VtTopPvtChart,
  VtDeptChart,
} from '../components/vt/VtAdvancedCharts';
import { VtFilterBar } from '../components/vt/VtFilterBar';
import { VtPvtDetailDrawer } from '../components/vt/VtPvtDetailDrawer';
import { VtSidebar, VtSidebarTab } from '../components/vt/VtSidebar';

import {
  CheckCircle2,
  Download,
  Plus,
  Pencil,
  Paperclip,
  Trash2,
} from 'lucide-react';

// ============================================
// 🎯 HELPER — XẾP HẠNG ƯU TIÊN TRẠNG THÁI
// ============================================
function getStatusPriority(d: Dispatch): number {
  if (d.trangThai === 'HOAN_THANH') return 5;
  if (!d.hanBaoCaoXuLy) return 4;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = parseToDate(d.hanBaoCaoXuLy);
  if (!deadline) return 4;

  const days = Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) return 1;   // QUÁ HẠN
  if (days === 1) return 2;   // ĐẾN HẠN
  if (days <= 10) return 3;   // SẮP HẾT HẠN
  return 4;                    // CÒN NHIỀU
}

// ============================================
// 🎯 HELPER — PARSE NGÀY AN TOÀN
//    Chấp nhận: "2026-09-20", "2026-09-20T00:00:00.000Z",
//               "20/09/2026", Date, broken ISO...
// ============================================
function parseToDate(input?: string | null): Date | null {
  if (!input) return null;

  // 1. Thử parse trực tiếp (ISO đầy đủ có timezone)
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // 2. Fallback qua formatDate → "DD/MM/YYYY" → parse lại
  const formatted = formatDate(input);
  const parts = formatted.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d2 = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
}

// ============================================
// 🎯 HELPER — TÍNH SỐ NGÀY GIỮA 2 NGÀY
// ============================================
function diffDaysBetween(fromISO?: string, toISO?: string): number | null {
  const a = parseToDate(fromISO);
  const b = parseToDate(toISO);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// 🎯 HELPER — TÍNH SỐ NGÀY CÒN LẠI
// ============================================
function daysUntil(deadlineISO?: string): number | null {
  const deadline = parseToDate(deadlineISO);
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// MAIN
// ============================================
export const VienTruongDashboard: React.FC = () => {
  const { allUsers, currentUser } = useAuth();

  const {
    dispatches,
    summary,
    pvtStats,
    tpStats,
    trendData,
    heatmapData,
    isLoading,
    reload,
  } = useVtDashboard(allUsers);

  const [filters, setFilters] = useState<VtFilters>(DEFAULT_VT_FILTERS);
  const [activeSidebarTab, setActiveSidebarTab] = useState<VtSidebarTab>('action-all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignTpDirectOpen, setIsAssignTpDirectOpen] = useState(false);
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [pvtDetailStat, setPvtDetailStat] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pvtList = useMemo(
    () => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'),
    [allUsers]
  );

  const pendingCount = useMemo(
    () => dispatches.filter(d => !d.assignedPvtId && d.trangThai !== 'HOAN_THANH').length,
    [dispatches]
  );

  const approveCount = useMemo(
    () => dispatches.filter(d => d.trangThai === 'CHO_VT_DUYET').length,
    [dispatches]
  );

  const deptList = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'TRUONG_PHONG' && u.roomCode)
      .map(u => ({ code: u.roomCode || '', name: u.fullName }))
      .sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }));
  }, [allUsers]);

  // ============================================
  // FILTER + SORT THEO TRẠNG THÁI
  // ============================================
  const filteredDispatches = useMemo(() => {
    const list = dispatches.filter(d => {
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          (d.soCongVan || '').toLowerCase().includes(q) ||
          (d.tenCongVan || '').toLowerCase().includes(q) ||
          (d.donViBanHanh || '').toLowerCase().includes(q) ||
          (d.assignedPvtName || '').toLowerCase().includes(q) ||
          (d.assignedTpName || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filters.pvtIds.length > 0) {
        const matchPvt = filters.pvtIds.some(id => {
          const pvt = pvtList.find(p => p.id === id);
          return (
            d.assignedPvtId === id ||
            (pvt && d.assignedPvtName === pvt.fullName) ||
            (pvt?.roomCode && d.assignedPvtName?.includes(pvt.roomCode))
          );
        });
        if (!matchPvt) return false;
      }

      if (filters.deptCodes.length > 0) {
        const matchDept = filters.deptCodes.some(code => {
          return (
            d.assignedTpId === code ||
            (d.assignedTpName && d.assignedTpName.includes(code)) ||
            (d.phongBan && d.phongBan.toUpperCase() === code.toUpperCase())
          );
        });
        if (!matchDept) return false;
      }

      if (filters.status !== 'ALL' && d.trangThai !== filters.status) return false;
      if (filters.urgency !== 'ALL' && d.mucDoKhan !== filters.urgency) return false;

      if (filters.dateFrom || filters.dateTo) {
        const dateStr = (d.ngayGui || d.ngayPhatHanh || '').slice(0, 10);
        if (filters.dateFrom && dateStr < filters.dateFrom) return false;
        if (filters.dateTo && dateStr > filters.dateTo) return false;
      }

      return true;
    });

    // Sort: quá hạn > đến hạn > sắp hết hạn > còn nhiều > hoàn thành
    return list.sort((a, b) => {
      const pa = getStatusPriority(a);
      const pb = getStatusPriority(b);
      if (pa !== pb) return pa - pb;

      const da = a.hanBaoCaoXuLy || '9999-12-31';
      const db = b.hanBaoCaoXuLy || '9999-12-31';
      return da.localeCompare(db);
    });
  }, [dispatches, filters, pvtList]);

  // Clear selection khi filter đổi
  useEffect(() => {
    setSelectedIds([]);
  }, [filters]);

  // ============================================
  // SELECTION HANDLERS
  // ============================================
  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.length === filteredDispatches.length
        ? []
        : filteredDispatches.map(d => d.id)
    );
  };

  // ============================================
  // TÍNH NÚT BULK "HOÀN THÀNH" CÓ KHẢ DỤNG KHÔNG
  // ============================================
  const selectedDispatches = useMemo(
    () => dispatches.filter(d => selectedIds.includes(d.id)),
    [dispatches, selectedIds]
  );

  const completableSelected = useMemo(
    () => selectedDispatches.filter(d => d.trangThai !== 'HOAN_THANH'),
    [selectedDispatches]
  );

  const canBulkComplete = completableSelected.length > 0;

  // ============================================
  // BULK ACTIONS
  // ============================================
  const handleBulkComplete = async () => {
    if (!canBulkComplete) return;
    const ids = completableSelected.map(d => d.id);
    const confirmed = window.confirm(
      `Xác nhận đánh dấu HOÀN THÀNH ${ids.length} công văn?`
    );
    if (!confirmed) return;

    let ok = 0;
    for (const id of ids) {
      try {
        const res = await apiClient.markComplete(id);
        if (res?.success) ok++;
      } catch (err) {
        console.error('Lỗi hoàn thành:', id, err);
      }
    }
    showToast(`Đã hoàn thành ${ok}/${ids.length} công văn`, 'success');
    setSelectedIds([]);
    reload();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `Xác nhận XÓA ${selectedIds.length} công văn? Hành động không thể hoàn tác.`
    );
    if (!confirmed) return;

    let ok = 0;
    for (const id of selectedIds) {
      try {
        const success = await apiClient.deleteDispatch(id);
        if (success) ok++;
      } catch (err) {
        console.error('Lỗi xóa:', id, err);
      }
    }
    showToast(`Đã xóa ${ok}/${selectedIds.length} công văn`, 'success');
    setSelectedIds([]);
    reload();
  };

  const handleEditSingle = () => {
    if (selectedIds.length !== 1) return;
    const target = dispatches.find(d => d.id === selectedIds[0]);
    if (!target) return;
    setDispatchToEdit(target);
    setIsAddEditModalOpen(true);
  };

  // Khi đóng modal edit → clear tick
  const handleCloseEditModal = () => {
    setIsAddEditModalOpen(false);
    setSelectedIds([]);
    reload();
  };

  // ============================================
  // VIEW FILE TRỰC TIẾP
  // ============================================
  const handleViewFiles = async (d: Dispatch) => {
    try {
      const items = await apiClient.getAttachments(d.id);
      if (!items || items.length === 0) {
        showToast('Không có file đính kèm', 'info');
        return;
      }
      const first = items[0];
      await apiClient.downloadAttachment(first.id);
    } catch (err: any) {
      console.error('Lỗi xem file:', err);
      showToast(err?.message || 'Không mở được file', 'error');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            {isMobileSidebarOpen ? '✕ Đóng menu' : '☰ Mở menu'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <VtSidebar
            activeTab={activeSidebarTab}
            onChangeTab={setActiveSidebarTab}
            pendingCount={pendingCount}
            approveCount={approveCount}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          <div className="flex-1 min-w-0 w-full space-y-5">

            {/* TAB: BÁO CÁO — TỔNG QUAN */}
            {activeSidebarTab === 'report-overview' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <VtKpiGrid
                  summary={summary}
                  onCardClick={key => {
                    if (key === 'overdue') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'QUA_HAN' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'due-soon') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'SAP_DEN_HAN' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'completed') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'HOAN_THANH' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'assigned') {
                      setActiveSidebarTab('action-assigned');
                    } else if (key === 'total') {
                      setActiveSidebarTab('action-all');
                    }
                  }}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtTrendChart data={trendData} />
                  <VtTopPvtChart pvtStats={pvtStats} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtPvtLeaderboard
                    pvtStats={pvtStats}
                    onSelectPvt={pvt => setPvtDetailStat(pvt)}
                  />
                  <VtDeptHeatmap heatmapData={heatmapData} tpStats={tpStats} />
                </div>
                <VtDeptChart tpStats={tpStats} />
              </>
            )}

            {/* TAB: BÁO CÁO — THEO PHÒNG BAN */}
            {activeSidebarTab === 'report-by-dept' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtDeptHeatmap heatmapData={heatmapData} tpStats={tpStats} />
                  <VtDeptChart tpStats={tpStats} />
                </div>
              </>
            )}

            {/* TAB: BÁO CÁO — THEO THỜI GIAN */}
            {activeSidebarTab === 'report-by-time' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <VtTrendChart data={trendData} />
              </>
            )}

            {/* TAB: BÁO CÁO — XẾP HẠNG PVT */}
            {activeSidebarTab === 'report-leaderboard' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtPvtLeaderboard
                    pvtStats={pvtStats}
                    onSelectPvt={pvt => setPvtDetailStat(pvt)}
                  />
                  <VtTopPvtChart pvtStats={pvtStats} />
                </div>
              </>
            )}

            {/* ============================================
                TAB: THAO TÁC — BẢNG CÔNG VĂN
                ============================================ */}
            {(activeSidebarTab === 'action-all' ||
              activeSidebarTab === 'action-assigned' ||
              activeSidebarTab === 'action-pending' ||
              activeSidebarTab === 'action-approve') && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                    <div>
                      <h1 className="text-base font-black text-slate-900">
                        {activeSidebarTab === 'action-all' && '📋 Tất cả công văn'}
                        {activeSidebarTab === 'action-assigned' && '👥 Đã phân công'}
                        {activeSidebarTab === 'action-pending' && '⏳ Chờ phân công PVT'}
                        {activeSidebarTab === 'action-approve' && '✅ Chờ phê duyệt'}
                      </h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {filteredDispatches.length} công văn
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportDispatchesToExcel(filteredDispatches, DEFAULT_COLUMNS)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Xuất Excel
                      </button>
                      <button
                        onClick={() => { setDispatchToEdit(null); setIsAddEditModalOpen(true); }}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                        style={{ backgroundColor: '#B71C1C' }}
                      >
                        <span className="text-base leading-none">+</span>
                        Tạo công văn
                      </button>
                    </div>
                  </div>

                  {/* Filter */}
                  <VtFilterBar
                    filters={filters}
                    onChange={setFilters}
                    pvtList={pvtList}
                    deptList={deptList}
                    totalResults={filteredDispatches.length}
                  />

                  {/* BẢNG */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

                    {/* Thanh bulk actions */}
                    {selectedIds.length > 0 && (
                      <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between gap-3 animate-fadeIn">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-700 text-white rounded-lg font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã chọn {selectedIds.length}
                          </span>
                          <button
                            onClick={() => setSelectedIds([])}
                            className="text-[11px] text-slate-600 hover:text-red-700 underline font-medium cursor-pointer"
                          >
                            Bỏ chọn
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleBulkComplete}
                            disabled={!canBulkComplete}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg shadow-xs transition ${
                              canBulkComplete
                                ? 'text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-95'
                                : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                            }`}
                            title={
                              canBulkComplete
                                ? `Hoàn thành ${completableSelected.length} công văn`
                                : 'Tất cả công văn đã chọn đều đã hoàn thành'
                            }
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hoàn thành
                            {canBulkComplete && ` (${completableSelected.length})`}
                          </button>

                          <button
                            onClick={handleBulkDelete}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa ({selectedIds.length})
                          </button>

                          <button
                            onClick={handleEditSingle}
                            disabled={selectedIds.length !== 1}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg shadow-xs transition ${
                              selectedIds.length === 1
                                ? 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer active:scale-95'
                                : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                            }`}
                            title={
                              selectedIds.length === 1
                                ? 'Chỉnh sửa công văn đã chọn'
                                : 'Chỉ có thể chỉnh sửa khi chọn đúng 1 công văn'
                            }
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Chỉnh sửa
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[1350px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-3 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  filteredDispatches.length > 0 &&
                                  selectedIds.length === filteredDispatches.length
                                }
                                ref={el => {
                                  if (el) {
                                    el.indeterminate =
                                      selectedIds.length > 0 &&
                                      selectedIds.length < filteredDispatches.length;
                                  }
                                }}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-slate-300 text-red-700 focus:ring-red-500 cursor-pointer accent-red-700"
                              />
                            </th>
                            <th className="py-3 px-3 w-10 text-center">STT</th>
                            <th className="py-3 px-3 w-32">Số văn bản</th>
                            <th className="py-3 px-3 w-28">Ngày phát hành</th>
                            <th className="py-3 px-3 min-w-[280px]">Trích yếu</th>
                            <th className="py-3 px-3 w-36">Đơn vị ban hành</th>
                            <th className="py-3 px-3 w-44">Lãnh đạo viện xử lý</th>
                            <th className="py-3 px-3 w-40">Đơn vị xử lý</th>
                            <th className="py-3 px-3 w-28">Thời hạn xử lý</th>
                            <th className="py-3 px-3 w-32 text-center">Cảnh báo</th>
                            <th className="py-3 px-3 w-32">File đính kèm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDispatches.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="py-16 text-center text-slate-400 italic">
                                Không có công văn nào
                              </td>
                            </tr>
                          ) : (
                            filteredDispatches.map((d, idx) => {
                              const isSelected = selectedIds.includes(d.id);

                              const daysFromToday = daysUntil(d.hanBaoCaoXuLy);

                              const warnMeta = (() => {
                                if (d.trangThai === 'HOAN_THANH') {
                                  return { warning: 'HOÀN THÀNH', daysLeft: '—', cls: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
                                }
                                if (daysFromToday === null) {
                                  return { warning: 'CHƯA CÓ HẠN', daysLeft: '—', cls: 'bg-white text-slate-500 border-slate-200' };
                                }
                                if (daysFromToday < 0) {
                                  return { warning: 'QUÁ HẠN', daysLeft: `${Math.abs(daysFromToday)} NGÀY`, cls: 'bg-rose-50 text-rose-800 border-rose-300' };
                                }
                                if (daysFromToday === 0) {
                                  return { warning: 'QUÁ HẠN', daysLeft: '0 NGÀY', cls: 'bg-rose-50 text-rose-800 border-rose-300' };
                                }
                                if (daysFromToday === 1) {
                                  return { warning: 'ĐẾN HẠN', daysLeft: '1 NGÀY', cls: 'bg-orange-50 text-orange-800 border-orange-300' };
                                }
                                if (daysFromToday <= 10) {
                                  return { warning: 'SẮP HẾT HẠN', daysLeft: `${daysFromToday} NGÀY`, cls: 'bg-yellow-50 text-yellow-800 border-yellow-300' };
                                }
                                return { warning: 'CÒN NHIỀU', daysLeft: `${daysFromToday} NGÀY`, cls: 'bg-white text-slate-800 border-slate-200' };
                              })();

                              // Lãnh đạo viện xử lý — BẮT BUỘC
                              const leaderName = d.assignedPvtName
                                ? d.assignedPvtName.replace('Đ/c ', '').replace('Đồng chí ', '')
                                : '—';

                              // Đơn vị xử lý — không bắt buộc
                              const deptLabel = d.assignedTpName || '';
                              const deptCode =
                                (d as any).assignedTpRoomCode ||
                                (d.assignedTpName && d.assignedTpName.match(/TP\d+/)?.[0]) ||
                                '';

                              // Thời hạn xử lý = Hạn báo cáo − Ngày phát hành
                              const processingDays = diffDaysBetween(d.ngayPhatHanh, d.hanBaoCaoXuLy);

                              const fileCount = (d as any)._count?.attachments || 0;

                              return (
                                <tr
                                  key={d.id}
                                  className={`transition ${
                                    isSelected
                                      ? 'bg-red-50/60 hover:bg-red-50'
                                      : 'hover:bg-slate-50/70'
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSelectRow(d.id)}
                                      className="w-4 h-4 rounded border-slate-300 text-red-700 focus:ring-red-500 cursor-pointer accent-red-700"
                                    />
                                  </td>

                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                    {idx + 1}
                                  </td>

                                  <td className="py-2.5 px-3">
                                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                      {d.soCongVan || '—'}
                                    </span>
                                  </td>

                                  {/* Ngày phát hành — dùng formatDate */}
                                  <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                                    {formatDate(d.ngayPhatHanh) || '—'}
                                  </td>

                                  <td className="py-2.5 px-3">
                                    <div
                                      onClick={() => setDetailDispatch(d)}
                                      className="font-semibold text-slate-900 hover:text-red-700 cursor-pointer line-clamp-2"
                                      title={d.tenCongVan}
                                    >
                                      {d.tenCongVan || '—'}
                                    </div>
                                  </td>

                                  <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                                    {d.donViBanHanh || <span className="text-slate-400 italic">—</span>}
                                  </td>

                                  <td className="py-2.5 px-3">
                                    <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold whitespace-nowrap">
                                      {leaderName}
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-3 text-[11px]">
                                    {deptLabel ? (
                                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                        {deptCode && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                                            {deptCode}
                                          </span>
                                        )}
                                        <span className="text-slate-700 font-medium">
                                          {deptLabel.replace('Đ/c ', '')}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>

                                  {/* Thời hạn xử lý */}
                                  <td className="py-2.5 px-3 text-center">
                                    {processingDays === null ? (
                                      <span className="text-slate-300">—</span>
                                    ) : processingDays >= 0 ? (
                                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold whitespace-nowrap">
                                        {processingDays} ngày
                                      </span>
                                    ) : (
                                      <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold whitespace-nowrap">
                                        {processingDays} ngày
                                      </span>
                                    )}
                                  </td>

                                  {/* Cảnh báo */}
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="inline-flex flex-col items-center gap-0.5">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border whitespace-nowrap ${warnMeta.cls}`}>
                                        {warnMeta.warning}
                                      </span>
                                      {warnMeta.daysLeft !== '—' && (
                                        <span className="text-[9px] text-slate-500 font-mono">
                                          {warnMeta.daysLeft}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* File đính kèm */}
                                  <td className="py-2.5 px-3">
                                    {fileCount === 0 ? (
                                      <span className="text-slate-300 text-[10px]">—</span>
                                    ) : (
                                      <button
                                        onClick={() => handleViewFiles(d)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold hover:bg-indigo-100 transition cursor-pointer whitespace-nowrap"
                                        title="Bấm để mở file trực tiếp"
                                      >
                                        <Paperclip className="w-3 h-3" />
                                        {fileCount} file
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            {/* TAB: TẠO CÔNG VĂN */}
            {activeSidebarTab === 'action-create' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-2">
                  Tạo công văn mới
                </h2>
                <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                  Nhấn nút bên dưới để mở form tạo công văn.
                </p>
                <button
                  onClick={() => { setDispatchToEdit(null); setIsAddEditModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl shadow-md transition cursor-pointer active:scale-95"
                  style={{ backgroundColor: '#B71C1C' }}
                >
                  <Plus className="w-4 h-4" />
                  Mở form tạo công việc
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Modal giao TP trực tiếp */}
      <AssignTpModal
        isOpen={isAssignTpDirectOpen}
        onClose={() => setIsAssignTpDirectOpen(false)}
        dispatch={dispatchToAssign}
        tpList={allUsers.filter(u => u.role === 'TRUONG_PHONG')}
        currentPvt={null}
        onAssign={async data => {
          if (!dispatchToAssign) return;
          try {
            const res = await apiClient.assignToTps(dispatchToAssign.id, {
              tps: [{
                tpId: data.tpId,
                tpName: data.tpName,
                roomCode: allUsers.find(u => u.id === data.tpId)?.roomCode || '',
                isPrimary: true,
              }],
              pvtChiDao: data.pvtChiDao || undefined,
              hanBaoCaoXuLy: data.hanBaoCaoXuLy || undefined,
            });
            if (res) {
              showToast(`Đã giao trực tiếp cho ${data.tpName}`);
              setIsAssignTpDirectOpen(false);
              setDispatchToAssign(null);
              reload();
            } else {
              showToast('Không thể giao TP', 'error');
            }
          } catch (err: any) {
            showToast(err.message || 'Lỗi', 'error');
          }
        }}
      />

      <AssignPvtModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        dispatch={dispatchToAssign}
        pvtList={pvtList}
        onAssign={async data => {
          if (!dispatchToAssign) return;
          const targetPvt = pvtList.find(p => p.id === data.pvtId);
          const updated = await apiClient.assignToPvts(dispatchToAssign.id, {
            pvts: [{
              pvtId: data.pvtId,
              pvtName: data.pvtName,
              roomCode: targetPvt?.roomCode || '',
              isPrimary: true,
            }],
            vtChiDao: data.vtChiDao,
            hanBaoCaoXuLy: data.hanBaoCaoXuLy,
            mucDoKhan: data.mucDoKhan,
          });
          if (updated) {
            showToast(`Đã giao công văn ${updated.soCongVan} cho ${data.pvtName}`);
            reload();
          }
        }}
      />

      <DispatchModal
        isOpen={isAddEditModalOpen}
        onClose={handleCloseEditModal}
        dispatchToEdit={dispatchToEdit}
        columns={DEFAULT_COLUMNS}
        onSave={async (formData: any) => {
          try {
            const { __attachments, __assignPvt, __assignTp, ...dispatchData } = formData;

            if (dispatchToEdit) {
              const updated = await apiClient.updateDispatch(dispatchToEdit.id, dispatchData);
              if (updated) {
                if (__assignPvt) {
                  try {
                    await apiClient.assignToPvts(dispatchToEdit.id, {
                      pvts: [__assignPvt],
                    });
                  } catch (err) {
                    console.error('Lỗi cập nhật PVT:', err);
                  }
                }
                if (__assignTp) {
                  try {
                    await apiClient.assignToTps(dispatchToEdit.id, {
                      tps: [__assignTp],
                    });
                  } catch (err) {
                    console.error('Lỗi cập nhật TP:', err);
                  }
                }
                showToast('Đã cập nhật công việc');
              } else {
                showToast('Lỗi cập nhật', 'error');
              }
            } else {
              const created = await apiClient.createDispatch(dispatchData);
              if (!created) {
                showToast('Lỗi tạo công việc', 'error');
                return;
              }

              if (__assignPvt) {
                try {
                  await apiClient.assignToPvts(created.id, { pvts: [__assignPvt] });
                } catch (err) {
                  console.error('Lỗi phân công PVT:', err);
                }
              }

              if (__assignTp) {
                try {
                  await apiClient.assignToTps(created.id, { tps: [__assignTp] });
                } catch (err) {
                  console.error('Lỗi phân công TP:', err);
                }
              }

              const fileList = (__attachments || []) as any[];
              if (fileList.length > 0) {
                let uploadedCount = 0;
                for (const fileItem of fileList) {
                  if (fileItem.file instanceof File) {
                    const res = await apiClient.uploadAttachment(
                      created.id,
                      fileItem.file,
                      fileItem.fileCategory || 'ORIGINAL'
                    );
                    if (res.success) uploadedCount++;
                  }
                }
                if (uploadedCount > 0) {
                  showToast(`Đã tạo công việc và upload ${uploadedCount} file`, 'success');
                } else {
                  showToast('Đã tạo công việc mới', 'success');
                }
              } else {
                showToast('Đã tạo công việc mới', 'success');
              }
            }
          } catch (err: any) {
            showToast(err.message || 'Lỗi', 'error');
            throw err;
          }
        }}
      />

      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        onUpdate={(id, updates) => {
          apiClient.updateDispatch(id, updates);
          reload();
        }}
      />

      <VtPvtDetailDrawer
        pvtStat={pvtDetailStat}
        allDispatches={dispatches}
        onClose={() => setPvtDetailStat(null)}
        onViewDispatch={d => {
          setPvtDetailStat(null);
          setDetailDispatch(d);
        }}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-amber-900 text-white border-amber-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VienTruongDashboard;