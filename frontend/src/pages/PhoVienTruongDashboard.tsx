import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AssignTpModal } from '../components/AssignTpModal';
import { SubmitVtModal } from '../components/SubmitVtModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { PvtDashboardHome } from '../components/pvt/PvtDashboardHome';
import { PvtAssignedDispatches } from '../components/pvt/PvtAssignedDispatches';
import { PvtAssignTpView } from '../components/pvt/PvtAssignTpView';
import { PvtPendingVtView } from '../components/pvt/PvtPendingVtView';
import { PvtRoomsDispatchesView } from '../components/pvt/PvtRoomsDispatchesView';
import { PvtStatsView } from '../components/pvt/PvtStatsView';
import { PvtNotificationsView } from '../components/pvt/PvtNotificationsView';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { User } from '../types/auth';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import { 
  LayoutDashboard, 
  FileText, 
  CornerDownRight, 
  Send, 
  Building2, 
  BarChart3, 
  Bell, 
  CheckCircle2, 
  RefreshCw, 
  Download,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export type PvtTabKey = 
  | 'dashboard' 
  | 'cv-duoc-giao' 
  | 'giao-tp' 
  | 'cho-trinh-vt' 
  | 'cv-cua-phong' 
  | 'thong-ke' 
  | 'thong-bao';

export const PhoVienTruongDashboard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { allUsers, currentUser } = useAuth();
  const navigate = useNavigate();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<PvtTabKey>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Determine which PVT is being viewed (defaults to PVT1)
  const pvtUser = useMemo(() => {
    if (id) {
      const cleanId = id.toLowerCase().replace('pvt', '');
      const num = parseInt(cleanId, 10);
      if (!isNaN(num)) {
        return allUsers.find(u => u.roomCode === `PVT${num}` || u.username === `pvt${num}`);
      }
      return allUsers.find(u => u.id === id || u.username === id || u.roomCode === id);
    }
    if (currentUser?.role === 'PHO_VIEN_TRUONG') {
      return currentUser;
    }
    // Default fallback to PVT 1
    return allUsers.find(u => u.roomCode === 'PVT1');
  }, [id, allUsers, currentUser]);

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [allSystemDispatches, setAllSystemDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAssignTpModalOpen, setIsAssignTpModalOpen] = useState(false);
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [isSubmitVtModalOpen, setIsSubmitVtModalOpen] = useState(false);
  const [dispatchToSubmitVt, setDispatchToSubmitVt] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Subordinate departments (Phòng phụ trách)
  // For PVT1: explicitly includes TP1 and TP2
  const subordinateRooms = useMemo(() => {
    if (!pvtUser) return [];
    const subs = allUsers.filter(u => 
      u.role === 'TRUONG_PHONG' && 
      (u.pvtManagerId === pvtUser.id || u.pvtManagerId === pvtUser.roomCode)
    );
    // If this is PVT1 and list is empty or needs fallback, ensure TP1 and TP2 are present
    if (pvtUser.roomCode === 'PVT1' && subs.length === 0) {
      return allUsers.filter(u => u.roomCode === 'TP1' || u.roomCode === 'TP2');
    }
    return subs;
  }, [pvtUser, allUsers]);

  const allTpUsers = useMemo(() => {
    return allUsers.filter(u => u.role === 'TRUONG_PHONG');
  }, [allUsers]);

  // Load dispatches for this PVT
  const loadDispatches = async () => {
    if (!pvtUser) return;
    setIsLoading(true);
    try {
      // 1. Fetch PVT's dispatches from VT
      const pvtList = await apiClient.getDispatches({
        role: 'PHO_VIEN_TRUONG',
        userId: pvtUser.id,
        roomCode: pvtUser.roomCode
      });
      setDispatches(pvtList);

      // 2. Fetch all dispatches to get subordinate department dispatches
      const allList = await apiClient.getDispatches({});
      setAllSystemDispatches(allList);
    } catch (err) {
      console.error('Lỗi khi tải công văn của PVT:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [pvtUser]);

  // 1. CÔNG VĂN ĐƯỢC VT GIAO
  // All dispatches where assignedPvt matches this PVT
  const dispatchesFromVt = useMemo(() => {
    return dispatches.filter(d => 
      d.assignedPvtId === pvtUser?.id ||
      d.assignedPvtName === pvtUser?.fullName ||
      (pvtUser?.roomCode && d.assignedPvtName?.includes(pvtUser.roomCode))
    );
  }, [dispatches, pvtUser]);

  // 2. CHỜ TÔI TRÌNH VT
  // Dispatches with status CHO_TRINH_VT or submitted by subordinate rooms waiting for PVT approval
  const pendingSubmitVtDispatches = useMemo(() => {
    const subCodes = subordinateRooms.map(r => r.roomCode);
    const subIds = subordinateRooms.map(r => r.id);

    return allSystemDispatches.filter(d => {
      const isStatusPending = d.trangThai === 'CHO_TRINH_VT' || d.customFields?.trinhVtStatus === 'CHO_TRINH';
      const isPvtMatch = d.assignedPvtId === pvtUser?.id || (pvtUser?.roomCode && d.assignedPvtName?.includes(pvtUser.roomCode));
      const isTpMatch = (d.assignedTpId && subIds.includes(d.assignedTpId)) ||
                        (d.assignedTpName && subCodes.some(c => d.assignedTpName?.includes(c)));
      return isStatusPending && (isPvtMatch || isTpMatch);
    });
  }, [allSystemDispatches, subordinateRooms, pvtUser]);

  // Handlers
  const handleOpenAssignTp = (disp: Dispatch) => {
    setDispatchToAssign(disp);
    setIsAssignTpModalOpen(true);
  };

  const handleSaveAssignTp = async (data: any) => {
    if (!dispatchToAssign) return;
    const updated = await apiClient.assignToTp(dispatchToAssign.id, data);
    if (updated) {
      showToast(`Đã giao công văn số ${updated.soCongVan} cho ${data.tpName}`);
      loadDispatches();
    }
  };

  const handleOpenSubmitVt = (disp: Dispatch) => {
    setDispatchToSubmitVt(disp);
    setIsSubmitVtModalOpen(true);
  };

  const handleSubmitVt = async (dispatchId: string, yKienTrinhVt: string) => {
    const updated = await apiClient.submitToVt(dispatchId, {
      yKienTrinhVt,
      fromPvtName: pvtUser?.fullName || 'Phó Viện Trưởng'
    });
    if (updated) {
      showToast(`Đã ký duyệt và trình Viện Trưởng công văn số ${updated.soCongVan}!`, 'success');
      loadDispatches();
    }
  };

  const handleReturnTp = async (dispatchId: string, lyDoTraLai: string) => {
    const updated = await apiClient.returnToTp(dispatchId, { lyDoTraLai });
    if (updated) {
      showToast(`Đã trả lại hồ sơ công văn số ${updated.soCongVan} cho cấp phòng!`, 'info');
      loadDispatches();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* Top bar removed per request */}
        {/* Layout Grid: Left Sidebar + Main View Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ─────────────────────────────────────────────────────────────┐
              │  SIDEBAR NAVIGATION (EXACT USER SPECIFICATION)
              │  Dashboard (phòng phụ trách)
              │  ├─────────────────────────────────────┤
              │  │  CÔNG VĂN
              │  │  ├── Công văn được giao
              │  │  ├── Giao cho TP
              │  │  ├── Chờ tôi trình VT
              │  │  └── Công văn của phòng
              │  ├─────────────────────────────────────┤
              │  │  THỐNG KÊ
              │  │  └── Phòng phụ trách
              │  ├─────────────────────────────────────┤
              │  │  THÔNG BÁO
              └───────────────────────────────────────────────────────────── */}
          <aside className={`lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-4 ${
            isMobileSidebarOpen ? 'block' : 'hidden lg:block'
          }`}>
            {/* Item 1: Dashboard (phòng phụ trách) */}
            <div>
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Bảng điều khiển</span>
                </div>
                {activeTab === 'dashboard' && <ChevronRight className="w-4 h-4 text-amber-300" />}
              </button>
            </div>

            <div className="border-t border-slate-200/80 my-2" />

            {/* Group 2: CÔNG VĂN */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-black tracking-wider text-slate-400 uppercase">
                CÔNG VĂN
              </div>

              {/* ├── Công văn được giao */}
              <button
                onClick={() => {
                  setActiveTab('cv-duoc-giao');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer pl-6 ${
                  activeTab === 'cv-duoc-giao'
                    ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-xs">├──</span>
                  <span>Công văn được giao</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'cv-duoc-giao'
                    ? 'bg-amber-800 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {dispatchesFromVt.length}
                </span>
              </button>

              {/* ├── Giao cho TP */}
              <button
                onClick={() => {
                  setActiveTab('giao-tp');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer pl-6 ${
                  activeTab === 'giao-tp'
                    ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-xs">├──</span>
                  <span>Giao cho TP</span>
                </div>
                <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* ├── Chờ tôi trình VT */}
              <button
                onClick={() => {
                  setActiveTab('cho-trinh-vt');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer pl-6 ${
                  activeTab === 'cho-trinh-vt'
                    ? 'bg-rose-100 text-rose-950 font-bold border border-rose-300 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-xs">├──</span>
                  <span>Chờ tôi trình VT</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'cho-trinh-vt'
                    ? 'bg-rose-800 text-white'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {pendingSubmitVtDispatches.length}
                </span>
              </button>

              {/* └── Công văn của phòng */}
              <button
                onClick={() => {
                  setActiveTab('cv-cua-phong');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer pl-6 ${
                  activeTab === 'cv-cua-phong'
                    ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-xs">└──</span>
                  <span>Công văn của phòng</span>
                </div>
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="border-t border-slate-200/80 my-2" />

            {/* Group 3: THỐNG KÊ */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-black tracking-wider text-slate-400 uppercase">
                THỐNG KÊ
              </div>

              {/* └── Phòng phụ trách */}
              <button
                onClick={() => {
                  setActiveTab('thong-ke');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer pl-6 ${
                  activeTab === 'thong-ke'
                    ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-xs">└──</span>
                  <span>Phòng phụ trách</span>
                </div>
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="border-t border-slate-200/80 my-2" />

            {/* Group 4: THÔNG BÁO */}
            <div>
              <button
                onClick={() => {
                  setActiveTab('thong-bao');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'thong-bao'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4" />
                  <span>THÔNG BÁO</span>
                </div>
                {pendingSubmitVtDispatches.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            </div>
          </aside>

          {/* ─────────────────────────────────────────────────────────────┐
              │  MAIN CONTENT AREA
              └───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-9 space-y-6">
            {activeTab === 'dashboard' && (
              <PvtDashboardHome
                pvtUser={pvtUser || null}
                dispatchesFromVt={dispatchesFromVt}
                pendingSubmitVtDispatches={pendingSubmitVtDispatches}
                subordinateRooms={subordinateRooms}
                allDispatches={allSystemDispatches}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenSubmitVt={handleOpenSubmitVt}
                onOpenDetail={setDetailDispatch}
                onNavigateTab={(tab) => setActiveTab(tab as PvtTabKey)}
              />
            )}

            {activeTab === 'cv-duoc-giao' && (
              <PvtAssignedDispatches
                dispatches={dispatchesFromVt}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'giao-tp' && (
              <PvtAssignTpView
                dispatches={dispatchesFromVt}
                subordinateRooms={subordinateRooms}
                allTpUsers={allTpUsers}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
              />
            )}

            {activeTab === 'cho-trinh-vt' && (
              <PvtPendingVtView
                dispatches={pendingSubmitVtDispatches}
                onOpenSubmitVt={handleOpenSubmitVt}
                onOpenDetail={setDetailDispatch}
              />
            )}

            {activeTab === 'cv-cua-phong' && (
              <PvtRoomsDispatchesView
                dispatches={allSystemDispatches}
                subordinateRooms={subordinateRooms}
                onOpenDetail={setDetailDispatch}
                onOpenAssignTp={handleOpenAssignTp}
              />
            )}

            {activeTab === 'thong-ke' && (
              <PvtStatsView
                subordinateRooms={subordinateRooms}
                allDispatches={allSystemDispatches}
              />
            )}

            {activeTab === 'thong-bao' && (
              <PvtNotificationsView
                pendingSubmitVtDispatches={pendingSubmitVtDispatches}
                dispatchesFromVt={dispatchesFromVt}
                onOpenDetail={setDetailDispatch}
                onOpenSubmitVt={handleOpenSubmitVt}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AssignTpModal
        isOpen={isAssignTpModalOpen}
        onClose={() => setIsAssignTpModalOpen(false)}
        dispatch={dispatchToAssign}
        tpList={allTpUsers}
        currentPvt={pvtUser || null}
        onAssign={handleSaveAssignTp}
      />

      <SubmitVtModal
        isOpen={isSubmitVtModalOpen}
        onClose={() => setIsSubmitVtModalOpen(false)}
        dispatch={dispatchToSubmitVt}
        onSubmitVt={handleSubmitVt}
        onReturnTp={handleReturnTp}
      />

      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        onUpdate={(id, updates) => {
          apiClient.updateDispatch(id, updates);
          loadDispatches();
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-amber-900 text-white border-amber-700'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoVienTruongDashboard;
