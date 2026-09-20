// src/pages/VienTruongDashboard.tsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AssignPvtModal } from '../components/AssignPvtModal';
import { AssignTpModal } from '../components/AssignTpModal';
import { DispatchModal } from '../components/DispatchModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { ConfirmModal } from '../components/ConfirmModal';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import { useVtDashboard } from '../hooks/vt/useVtDashboard';
import { VtFilters, DEFAULT_VT_FILTERS } from '../types/vt';

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

import { CheckCircle2, Download, Plus } from 'lucide-react';

export const VienTruongDashboard: React.FC = () => {
  const { allUsers, currentUser } = useAuth();

  // Dashboard data
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

  // Filters
  const [filters, setFilters] = useState<VtFilters>(DEFAULT_VT_FILTERS);
  // Sidebar Tab
  const [activeSidebarTab, setActiveSidebarTab] = useState<VtSidebarTab>('report-overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals / Drawers
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignTpDirectOpen, setIsAssignTpDirectOpen] = useState(false);
  const [isAssignTpModalOpen, setIsAssignTpModalOpen] = useState(false); // Đã bổ sung state này
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [pvtDetailStat, setPvtDetailStat] = useState<any>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Lists
  const pvtList = useMemo(
    () => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'),
    [allUsers]
  );

  // Pending counts for badges
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

  // Filtered dispatches (dùng cho table + xuất Excel)
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      // Search
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

      // PVT multi-select
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

      // Dept multi-select
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

      // Status
      if (filters.status !== 'ALL' && d.trangThai !== filters.status) return false;

      // Urgency
      if (filters.urgency !== 'ALL' && d.mucDoKhan !== filters.urgency) return false;

      // Date range
      if (filters.dateFrom || filters.dateTo) {
        const dateStr = (d.ngayGui || d.ngayPhatHanh || '').slice(0, 10);
        if (filters.dateFrom && dateStr < filters.dateFrom) return false;
        if (filters.dateTo && dateStr > filters.dateTo) return false;
      }

      return true;
    });
  }, [dispatches, filters, pvtList]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Mobile menu button */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            {isMobileSidebarOpen ? '✕ Đóng menu' : '☰ Mở menu'}
          </button>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* SIDEBAR */}
          <VtSidebar
            activeTab={activeSidebarTab}
            onChangeTab={setActiveSidebarTab}
            pendingCount={pendingCount}
            approveCount={approveCount}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* MAIN CONTENT */}
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

            {/* TAB: THAO TÁC */}
            {(activeSidebarTab === 'action-all' ||
              activeSidebarTab === 'action-assigned' ||
              activeSidebarTab === 'action-pending' ||
              activeSidebarTab === 'action-approve') && (
                <>
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

                  <VtFilterBar
                    filters={filters}
                    onChange={setFilters}
                    pvtList={pvtList}
                    deptList={deptList}
                    totalResults={filteredDispatches.length}
                  />

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-3 w-10 text-center">STT</th>
                            <th className="py-3 px-3 w-32">Số CV</th>
                            <th className="py-3 px-3 min-w-[280px]">Trích yếu</th>
                            <th className="py-3 px-3 w-44">PVT phụ trách</th>
                            <th className="py-3 px-3 w-32">Phòng</th>
                            <th className="py-3 px-3 w-28">Hạn</th>
                            <th className="py-3 px-3 w-28 text-center">Trạng thái</th>
                            <th className="py-3 px-3 w-40 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDispatches.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-16 text-center text-slate-400 italic">
                                Không có công văn nào
                              </td>
                            </tr>
                          ) : (
                            filteredDispatches.map((d, idx) => (
                              <tr key={d.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 px-3 text-center text-slate-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {d.soCongVan}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div
                                    onClick={() => setDetailDispatch(d)}
                                    className="font-semibold text-slate-900 hover:text-red-700 cursor-pointer line-clamp-2"
                                  >
                                    {d.tenCongVan}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  {d.assignedPvtName ? (
                                    <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                                      {d.assignedPvtName.replace('Đ/c ', '')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      Chưa giao
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-slate-700 text-[11px]">
                                  {d.assignedTpName || '—'}
                                </td>
                                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                                  {d.hanBaoCaoXuLy
                                    ? new Date(d.hanBaoCaoXuLy).toLocaleDateString('vi-VN')
                                    : '—'}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${d.trangThai === 'HOAN_THANH'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : d.trangThai === 'QUA_HAN'
                                        ? 'bg-rose-100 text-rose-800'
                                        : d.trangThai === 'CHO_VT_DUYET'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                  >
                                    {d.trangThai === 'HOAN_THANH'
                                      ? 'Xong'
                                      : d.trangThai === 'QUA_HAN'
                                        ? 'Quá hạn'
                                        : d.trangThai === 'CHO_VT_DUYET'
                                          ? 'Chờ duyệt'
                                          : 'Đang xử lý'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* Nút giao PVT */}
                                    <button
                                      onClick={() => {
                                        setDispatchToAssign(d);
                                        setIsAssignModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-bold text-white rounded-lg transition cursor-pointer active:scale-95"
                                      style={{ backgroundColor: '#B71C1C' }}
                                    >
                                      {d.assignedPvtId ? 'Đổi PVT' : 'Giao PVT'}
                                    </button>

                                    {/* Nút giao TP trực tiếp */}
                                    <button
                                      onClick={() => {
                                        setDispatchToAssign(d);
                                        setIsAssignTpDirectOpen(true);
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition cursor-pointer active:scale-95"
                                    >
                                      {d.assignedTpId ? 'Đổi TP' : 'Giao TP'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
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
                  Nhấn nút bên dưới để mở form tạo công văn. Sau khi tạo xong, bạn có thể
                  giao ngay cho Phó Viện trưởng.
                </p>
                <button
                  onClick={() => { setDispatchToEdit(null); setIsAddEditModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl shadow-md transition cursor-pointer active:scale-95"
                  style={{ backgroundColor: '#B71C1C' }}
                >
                  <Plus className="w-4 h-4" />
                  Mở form tạo công văn
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
      {/* MODALS */}
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
        onClose={() => {
          setIsAddEditModalOpen(false);
          reload();
        }}
        dispatchToEdit={dispatchToEdit}
        columns={DEFAULT_COLUMNS}
        onSave={async (formData: any) => {
          try {
            // Tách danh sách file đính kèm ra khỏi formData
            const { __attachments, ...dispatchData } = formData;

            if (dispatchToEdit) {
              // ===== SỬA CÔNG VIỆC =====
              const updated = await apiClient.updateDispatch(dispatchToEdit.id, dispatchData);
              if (updated) {
                showToast('Đã cập nhật công việc');
                reload();
              } else {
                showToast('Lỗi cập nhật', 'error');
              }
            } else {
              // ===== TẠO CÔNG VIỆC MỚI =====
              const created = await apiClient.createDispatch(dispatchData);
              if (!created) {
                showToast('Lỗi tạo công việc', 'error');
                return;
              }

              // Upload từng file đính kèm (nếu có)
              const fileList = (__attachments || []) as any[];
              if (fileList.length > 0) {
                let uploadedCount = 0;
                for (const fileItem of fileList) {
                  // fileItem có thể chứa File object (chưa upload) hoặc đã có id
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
                  showToast(
                    `Đã tạo công việc và upload ${uploadedCount} file`,
                    'success'
                  );
                } else {
                  showToast('Đã tạo công việc mới', 'success');
                }
              } else {
                showToast('Đã tạo công việc mới', 'success');
              }
              reload();
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

      {/* TOAST */}
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