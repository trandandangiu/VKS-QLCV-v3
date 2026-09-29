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
import { PublicDesktopTable } from '../components/public/PublicDesktopTable';
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
    // ⭐ SORT theo sortMode
    const sortMode = filters.sortMode || 'deadline_asc';
    const daysToDeadline = (d: Dispatch): number => {
      if (!d.hanBaoCaoXuLy) return 9999;
      const dl = new Date(d.hanBaoCaoXuLy);
      dl.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return Math.round((dl.getTime() - today.getTime()) / 86400000);
    };

    switch (sortMode) {
      case 'priority':
        return list.sort((a, b) => {
          const pa = getStatusPriority(a);
          const pb = getStatusPriority(b);
          if (pa !== pb) return pa - pb;
          return daysToDeadline(a) - daysToDeadline(b);
        });

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
          const aD = daysToDeadline(a);
          const bD = daysToDeadline(b);
          if (aD >= 0 && bD >= 0) return aD - bD;
          if (aD >= 0) return 1;
          if (bD >= 0) return -1;
          return aD - bD;
        });

      case 'oldest':
        return list.sort((a, b) => {
          const da = new Date(a.ngayGui || a.ngayPhatHanh || 0).getTime();
          const db = new Date(b.ngayGui || b.ngayPhatHanh || 0).getTime();
          return da - db;
        });

      case 'newest':
      default:
        return list.sort((a, b) => {
          const da = new Date(a.ngayGui || a.ngayPhatHanh || 0).getTime();
          const db = new Date(b.ngayGui || b.ngayPhatHanh || 0).getTime();
          return db - da;
        });
    }
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



                    <PublicDesktopTable
                      dispatches={filteredDispatches}
                      currentPage={1}
                      pageSize={filteredDispatches.length || 20}
                      selectedPvtId={null}
                      onSelectDispatch={d => setDetailDispatch(d)}
                      onViewFiles={handleViewFiles}
                    />
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
        canEdit={true}
        onUpdate={async (id, updates) => {
          await apiClient.updateDispatch(id, updates);
          reload();
        }}

        onMarkComplete={async (d) => {
          const res = await apiClient.markComplete(d.id);
          if (!res?.success) throw new Error(res?.message || 'Lỗi');
          // Update detailDispatch để refresh drawer
          setDetailDispatch(prev => prev ? { ...prev, trangThai: 'HOAN_THANH', tienDo: 100 } : prev);
          reload();
        }}
        onDelete={async (d) => {                              // ⭐ THÊM
          const ok = await apiClient.deleteDispatch(d.id);
          if (!ok) throw new Error('Không thể xoá công văn');
          setDetailDispatch(null);
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
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${toast.type === 'success'
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