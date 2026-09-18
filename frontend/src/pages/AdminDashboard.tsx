import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { ActionBar } from '../components/ActionBar';
import { DashboardStats } from '../components/DashboardStats';
import { FilterBar } from '../components/FilterBar';
import { DispatchTable } from '../components/DispatchTable';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { DispatchModal } from '../components/DispatchModal';
import { ColumnManagerModal } from '../components/ColumnManagerModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { ConfirmModal } from '../components/ConfirmModal';
import { GoogleSheetModal } from '../components/GoogleSheetModal';
import { useDispatches } from '../hooks/useDispatches';
import { apiClient } from '../services/apiClient';
import { exportDispatchesToExcel, exportLeadershipReportToExcel } from '../services/excelService';
import { Dispatch } from '../types/dispatch';
import { User, UserRole } from '../types/auth';
import { 
  Users, 
  Database, 
  Wifi, 
  Copy, 
  Check, 
  Key, 
  Edit3, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Server,
  Building,
  FileSpreadsheet,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  ShieldCheck,
  Download,
  ArrowUpDown,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Filter,
  Layers,
  SlidersHorizontal,
  X,
  UserCheck,
  Briefcase,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

type SortMode = 'category' | 'alpha' | 'frequent';

interface AdminFunctionItem {
  id: string;
  title: string;
  category: 'user' | 'dispatch';
  categoryName: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  description: string;
  action: () => void;
  tabKey?: 'dispatches' | 'users';
  priority: number;
}

export const AdminDashboard: React.FC = () => {
  const { allUsers, reloadUsers } = useAuth();
  const {
    dispatches,
    filteredDispatches,
    columns,
    filters,
    setFilters,
    filterOptions,
    sortConfig,
    handleSort,
    dashboardStats,
    selectedIds,
    toggleSelectRow,
    toggleSelectAll,
    addDispatch,
    updateDispatch,
    deleteDispatch,
    bulkDeleteDispatches,
    clearAllDispatches,
    restoreSampleDispatches,
    bulkUpdateStatus,
    commitExcelImport,
    addCustomColumn,
    toggleColumnVisibility,
    removeColumn,
    resetToDefaultColumns
  } = useDispatches();

  type AdminModule = 'create-user' | 'transfer-dept' | 'assign-pvt' | 'tab-users' | 'export-leadership-excel' | 'tab-dispatches';
  const [activeModule, setActiveModule] = useState<AdminModule>('tab-users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFunctionsCollapsed, setIsFunctionsCollapsed] = useState(false);

  // Sidebar sorting & filtering
  const [sidebarSortMode, setSidebarSortMode] = useState<SortMode>('category');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Network info
  const [networkInfo, setNetworkInfo] = useState<{
    networks: any[];
    primaryUrl: string;
    hostname: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editPvtManager, setEditPvtManager] = useState('');

  // 1. Create User State
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'TRUONG_PHONG' as UserRole,
    roomCode: 'TP1',
    pvtManagerId: '',
    phone: '',
    email: ''
  });

  // 2. Transfer Department State
  const [transferUser, setTransferUser] = useState<User | null>(null);
  const [transferRoomCode, setTransferRoomCode] = useState('');
  const [transferRole, setTransferRole] = useState<UserRole>('TRUONG_PHONG');
  const [transferPvtManagerId, setTransferPvtManagerId] = useState('');

  // 3. Assign Leadership / Supervision State
  const [assignTpUser, setAssignTpUser] = useState<User | null>(null);
  const [assignPvtId, setAssignPvtId] = useState('');

  // Modals from original App
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    apiClient.getNetworkInfo().then(res => {
      if (res.success) {
        setNetworkInfo(res);
      }
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    showToast(`Đã sao chép đường dẫn: ${text}`);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // User list helpers
  const pvtUsers = useMemo(() => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'), [allUsers]);
  const tpUsers = useMemo(() => allUsers.filter(u => u.role === 'TRUONG_PHONG'), [allUsers]);

  // Handle Edit User
  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditPassword('');
    setEditPvtManager(u.pvtManagerId || '');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload: any = { fullName: editFullName };
    if (editPassword.trim()) payload.password = editPassword.trim();
    if (editingUser.role === 'TRUONG_PHONG') payload.pvtManagerId = editPvtManager;

    const res = await apiClient.updateUser(editingUser.id, payload);
    if (res) {
      showToast(`Đã cập nhật thông tin tài khoản ${res.username}`);
      setEditingUser(null);
      reloadUsers();
    } else {
      showToast('Lỗi khi cập nhật thông tin', 'error');
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.fullName.trim()) {
      showToast('Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Họ tên', 'warning');
      return;
    }

    const payload = {
      username: newUser.username.trim().toLowerCase(),
      password: newUser.password.trim(),
      fullName: newUser.fullName.trim(),
      role: newUser.role,
      roomCode: newUser.roomCode.trim().toUpperCase() || newUser.role,
      pvtManagerId: newUser.role === 'TRUONG_PHONG' ? newUser.pvtManagerId : undefined,
      phone: newUser.phone.trim(),
      email: newUser.email.trim()
    };

    const res = await apiClient.createUser(payload);
    if (res.success) {
      showToast(`Đã tạo tài khoản "${newUser.username}" thành công!`);
      setNewUser({
        username: '',
        password: '',
        fullName: '',
        role: 'TRUONG_PHONG',
        roomCode: 'TP1',
        pvtManagerId: '',
        phone: '',
        email: ''
      });
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast(res.message || 'Lỗi khi tạo tài khoản', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = (u: User) => {
    if (u.id === 'u_admin') {
      showToast('Không thể xóa tài khoản Quản trị viên tối cao (Admin)!', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa tài khoản',
      message: `Đồng chí có chắc chắn muốn xóa tài khoản "${u.username}" (${u.fullName} - ${u.roomCode}) khỏi hệ thống CSDL? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa tài khoản',
      onConfirm: async () => {
        const res = await apiClient.deleteUser(u.id);
        if (res.success) {
          showToast(`Đã xóa tài khoản "${u.username}" thành công!`);
          reloadUsers();
        } else {
          showToast(res.message || 'Lỗi khi xóa tài khoản', 'error');
        }
      }
    });
  };

  // Handle Transfer Department
  const handleOpenTransferModal = (u?: User) => {
    const target = u || allUsers.find(user => user.role === 'TRUONG_PHONG') || allUsers[0];
    if (!target) return;
    setTransferUser(target);
    setTransferRoomCode(target.roomCode);
    setTransferRole(target.role);
    setTransferPvtManagerId(target.pvtManagerId || '');
    setActiveModule('transfer-dept');
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferUser) return;

    const res = await apiClient.updateUser(transferUser.id, {
      roomCode: transferRoomCode.trim().toUpperCase(),
      role: transferRole,
      pvtManagerId: transferRole === 'TRUONG_PHONG' ? (transferPvtManagerId || null) : null
    });

    if (res) {
      showToast(`Đã điều chuyển đồng chí ${transferUser.fullName} sang bộ phận "${transferRoomCode}"`);
      setTransferUser(null);
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast('Lỗi khi điều chuyển bộ phận', 'error');
    }
  };

  // Handle Assign Supervision to PVT
  const handleOpenAssignPvtModal = (tp?: User) => {
    const target = tp || tpUsers[0];
    if (!target) {
      showToast('Không có tài khoản Trưởng phòng nào trong hệ thống', 'warning');
      return;
    }
    setAssignTpUser(target);
    setAssignPvtId(target.pvtManagerId || (pvtUsers[0]?.id || ''));
    setActiveModule('assign-pvt');
  };

  const handleSaveAssignPvt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTpUser) return;

    const res = await apiClient.updateUser(assignTpUser.id, {
      pvtManagerId: assignPvtId || null
    });

    if (res) {
      const pvt = allUsers.find(u => u.id === assignPvtId);
      showToast(`Đã phân công ${pvt ? pvt.fullName : 'Chưa gán'} phụ trách ${assignTpUser.fullName}`);
      setAssignTpUser(null);
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast('Lỗi khi gán quyền phụ trách', 'error');
    }
  };

  // Handle Export Leadership Excel
  const handleExportLeadershipExcel = () => {
    const targetDispatches = selectedIds.length > 0
      ? dispatches.filter(d => selectedIds.includes(d.id))
      : filteredDispatches;

    if (targetDispatches.length === 0) {
      showToast('Không có công văn nào để xuất báo cáo lãnh đạo', 'warning');
      return;
    }

    exportLeadershipReportToExcel(targetDispatches);
    showToast(`Đã xuất báo cáo Excel ${targetDispatches.length} công văn gửi Lãnh đạo Viện Kiểm Sát!`);
  };

  // Define Admin Functions for Left Sidebar
  const allFunctions: AdminFunctionItem[] = [
    {
      id: 'create-user',
      title: 'Tạo tài khoản mới',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: UserPlus,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-700',
      description: 'Thêm tài khoản lãnh đạo, kiểm sát viên, phòng ban',
      action: () => {
        setActiveModule('create-user');
      },
      priority: 1
    },
    {
      id: 'transfer-dept',
      title: 'Chuyển bộ phận tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: ArrowRightLeft,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-700',
      description: 'Điều chuyển phòng ban, mã đơn vị phụ trách',
      action: () => {
        handleOpenTransferModal();
        setActiveModule('transfer-dept');
      },
      priority: 2
    },
    {
      id: 'assign-pvt',
      title: 'Gán quyền phụ trách tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: ShieldCheck,
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      iconColor: 'text-purple-700',
      description: 'Phân bổ thẩm quyền PVT phụ trách Trưởng phòng',
      action: () => {
        handleOpenAssignPvtModal();
        setActiveModule('assign-pvt');
      },
      priority: 3
    },
    {
      id: 'tab-users',
      title: 'Danh sách tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: Users,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-700',
      description: 'Danh sách 1 VT, 12 PVT, 12 Trưởng phòng, Admin',
      action: () => setActiveModule('tab-users'),
      priority: 4
    },
    {
      id: 'export-leadership-excel',
      title: 'Xuất công văn gửi Lãnh đạo (Excel)',
      category: 'dispatch',
      categoryName: 'Quản Lý Công Văn',
      icon: Download,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-700',
      description: 'File Excel đầy đủ chỉ đạo VT, PVT, tiến độ, hạn xử lý',
      action: () => setActiveModule('export-leadership-excel'),
      priority: 5
    },
    {
      id: 'tab-dispatches',
      title: 'Quản lý công văn toàn diện',
      category: 'dispatch',
      categoryName: 'Quản Lý Công Văn',
      icon: FileSpreadsheet,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-700',
      description: 'Bảng theo dõi, tìm kiếm, nhập liệu và xử lý văn bản',
      action: () => setActiveModule('tab-dispatches'),
      priority: 6
    }
  ];

  // Filter and sort functions for the left sidebar
  const processedFunctions = useMemo(() => {
    let result = [...allFunctions];

    // Filter by search query
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.toLowerCase();
      result = result.filter(f => 
        f.title.toLowerCase().includes(q) || 
        f.description.toLowerCase().includes(q) ||
        f.categoryName.toLowerCase().includes(q)
      );
    }

    // Apply sort mode
    if (sidebarSortMode === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    } else if (sidebarSortMode === 'frequent') {
      result.sort((a, b) => a.priority - b.priority);
    } else {
      // 'category': group user -> dispatch -> system
      const catOrder: Record<string, number> = { user: 1, dispatch: 2, system: 3 };
      result.sort((a, b) => {
        if (catOrder[a.category] !== catOrder[b.category]) {
          return catOrder[a.category] - catOrder[b.category];
        }
        return a.priority - b.priority;
      });
    }

    return result;
  }, [allFunctions, sidebarSearch, sidebarSortMode]);

  return (
    <div className="min-h-screen flex flex-col text-slate-900 bg-slate-100">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4">
        {/* 2-COLUMN LAYOUT: LEFT SIDEBAR + RIGHT WORKSPACE */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR: ADMIN FUNCTION PANEL */}
          {/* ========================================================================= */}
          {isSidebarOpen && (
            <aside 
              id="admin-left-sidebar"
              className={`w-full lg:w-80 shrink-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 ${
                isSidebarMobileOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Sidebar Top: Header with Close Sidebar Button */}
              <div className="p-3.5 bg-slate-900 text-white border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                      Chức năng
                    </h2>
                  </div>

                  {/* Close Sidebar Button */}
                  <button
                    id="admin-sort-functions-button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsSidebarMobileOpen(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer shadow-xs"
                    title="Đóng thanh bên"
                  >
                    <span>Đóng thanh bên</span>
                  </button>
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh chức năng..."
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    className="w-full bg-slate-800 text-white pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-red-500 placeholder-slate-400"
                  />
                  {sidebarSearch && (
                    <button
                      onClick={() => setSidebarSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* List of Functions */}
              {!isFunctionsCollapsed ? (
                <div className="p-3 space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto divide-y divide-slate-100">
                  {processedFunctions.map((item) => {
                    const IconComponent = item.icon;
                    const isCurrentTab = activeModule === item.id;

                    return (
                      <div
                        key={item.id}
                        id={`admin-func-${item.id}`}
                        onClick={() => {
                          item.action();
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`group p-2.5 rounded-2xl transition cursor-pointer border ${
                          isCurrentTab 
                            ? 'bg-red-50/80 border-red-200 shadow-xs ring-1 ring-red-200' 
                            : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${item.iconBg}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className={`text-xs font-bold truncate ${
                              isCurrentTab ? 'text-red-900 font-extrabold' : 'text-slate-900 group-hover:text-red-700'
                            }`}>
                              {item.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {processedFunctions.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Không tìm thấy chức năng phù hợp với từ khóa "{sidebarSearch}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setIsFunctionsCollapsed(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    👁️ Hiện lại danh sách ({processedFunctions.length} chức năng)
                  </button>
                </div>
              )}
            </aside>
          )}

          {/* ========================================================================= */}
          {/* RIGHT WORKSPACE: ACTIVE MODULE VIEW */}
          {/* ========================================================================= */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {!isSidebarOpen && (
              <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5 text-red-700" />
                  <span>Mở thanh bên</span>
                </button>
              </div>
            )}

            {/* MODULE 1: CREATE USER INLINE VIEW */}
            {activeModule === 'create-user' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Tạo tài khoản người dùng mới</h2>
                      <p className="text-xs text-slate-500">Khởi tạo tài khoản lãnh đạo, kiểm sát viên hoặc phòng ban trong hệ thống</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="max-w-2xl space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Tên Đăng Nhập <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="ví dụ: pvt13, tp13, ksv_nam..."
                        value={newUser.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Mật Khẩu Khởi Tạo <span className="text-red-500">*</span></label>
                      <input
                        type="password"
                        required
                        placeholder="Nhập mật khẩu ban đầu..."
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Họ Và Tên / Chức Danh <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Đ/c Nguyễn Văn A..."
                      value={newUser.fullName}
                      onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Vai Trò Phân Quyền</label>
                      <select
                        value={newUser.role}
                        onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="TRUONG_PHONG">TRUONG_PHONG (Lãnh đạo phòng)</option>
                        <option value="PHO_VIEN_TRUONG">PHO_VIEN_TRUONG (Phó Viện Trưởng)</option>
                        <option value="VIEN_TRUONG">VIEN_TRUONG (Viện Trưởng)</option>
                        <option value="ADMIN">ADMIN (Quản trị viên)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Bộ Phận / Ký Hiệu Đơn Vị</label>
                      <input
                        type="text"
                        placeholder="TP1, TP2, PVT1, VT..."
                        value={newUser.roomCode}
                        onChange={e => setNewUser({ ...newUser, roomCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-blue-900"
                      />
                    </div>
                  </div>

                  {newUser.role === 'TRUONG_PHONG' && (
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Phó Viện Trưởng Phụ Trách Trực Tiếp</label>
                      <select
                        value={newUser.pvtManagerId}
                        onChange={e => setNewUser({ ...newUser, pvtManagerId: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="">-- Chưa phân bổ --</option>
                        {pvtUsers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.roomCode}: {p.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Số Điện Thoại Liên Hệ</label>
                      <input
                        type="text"
                        placeholder="090..."
                        value={newUser.phone}
                        onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Hộp Thư Công Vụ (Email)</label>
                      <input
                        type="email"
                        placeholder="canbo@vks.gov.vn"
                        value={newUser.email}
                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Hủy thao tác
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Lưu & Tạo Tài Khoản
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE 2: TRANSFER DEPARTMENT INLINE VIEW */}
            {activeModule === 'transfer-dept' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Chuyển bộ phận tài khoản</h2>
                      <p className="text-xs text-slate-500">Điều chuyển cán bộ sang phòng ban, phân bổ vai trò và đơn vị mới</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleSaveTransfer} className="max-w-2xl space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Tài Khoản Cần Điều Chuyển</label>
                    <select
                      value={transferUser?.id || ''}
                      onChange={e => {
                        const u = allUsers.find(user => user.id === e.target.value);
                        if (u) {
                          setTransferUser(u);
                          setTransferRoomCode(u.roomCode);
                          setTransferRole(u.role);
                          setTransferPvtManagerId(u.pvtManagerId || '');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold"
                    >
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.roomCode} - {u.fullName} ({u.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Mã Bộ Phận / Ký Hiệu Đơn Vị Mới</label>
                    <input
                      type="text"
                      required
                      placeholder="TP1, TP2... hoặc tên đơn vị mới"
                      value={transferRoomCode}
                      onChange={e => setTransferRoomCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-amber-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Vai Trò Nhiệm Vụ Mới</label>
                    <select
                      value={transferRole}
                      onChange={e => setTransferRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="TRUONG_PHONG">TRUONG_PHONG (Lãnh đạo phòng)</option>
                      <option value="PHO_VIEN_TRUONG">PHO_VIEN_TRUONG (Phó Viện Trưởng)</option>
                      <option value="VIEN_TRUONG">VIEN_TRUONG (Viện Trưởng)</option>
                      <option value="ADMIN">ADMIN (Quản trị viên)</option>
                    </select>
                  </div>

                  {transferRole === 'TRUONG_PHONG' && (
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Phó Viện Trưởng Phụ Trách Mới</label>
                      <select
                        value={transferPvtManagerId}
                        onChange={e => setTransferPvtManagerId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="">-- Chưa gán --</option>
                        {pvtUsers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.roomCode}: {p.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Hủy thao tác
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Xác Nhận Điều Chuyển
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE 3: ASSIGN PVT SUPERVISION INLINE VIEW */}
            {activeModule === 'assign-pvt' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Gán quyền phụ trách tài khoản</h2>
                      <p className="text-xs text-slate-500">Phân công Phó Viện Trưởng trực tiếp phụ trách các đơn vị nghiệp vụ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleSaveAssignPvt} className="max-w-2xl space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Trưởng Phòng / Bộ Phận Cần Phân Bổ</label>
                    <select
                      value={assignTpUser?.id || ''}
                      onChange={e => {
                        const tp = tpUsers.find(u => u.id === e.target.value);
                        if (tp) {
                          setAssignTpUser(tp);
                          setAssignPvtId(tp.pvtManagerId || (pvtUsers[0]?.id || ''));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-semibold"
                    >
                      {tpUsers.map(tp => (
                        <option key={tp.id} value={tp.id}>
                          {tp.roomCode} - {tp.fullName} ({tp.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Lãnh Đạo Viện / Phó Viện Trưởng Phụ Trách</label>
                    <select
                      value={assignPvtId}
                      onChange={e => setAssignPvtId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="">-- Chưa gán (Bỏ quyền phụ trách) --</option>
                      {pvtUsers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.roomCode}: {p.fullName} ({p.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Hủy thao tác
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Lưu Phân Công Phụ Trách
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE 4: EXPORT LEADERSHIP EXCEL INLINE VIEW */}
            {activeModule === 'export-leadership-excel' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Xuất công văn gửi Lãnh đạo (Excel)</h2>
                      <p className="text-xs text-slate-500">File Excel tổng hợp đầy đủ nội dung ý kiến chỉ đạo VT, PVT, tiến độ và hạn xử lý</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại
                  </button>
                </div>

                <div className="max-w-xl space-y-4 text-xs">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                    <p className="font-bold text-emerald-900">Tổng quan dữ liệu xuất báo cáo:</p>
                    <ul className="list-disc list-inside text-emerald-800 space-y-1">
                      <li>Tổng số công văn hiện có: <strong>{dispatches.length}</strong></li>
                      <li>Số công văn đang chọn: <strong>{selectedIds.length}</strong> {selectedIds.length > 0 ? '(Chỉ xuất những văn bản đã tích chọn)' : '(Sẽ xuất toàn bộ danh sách hiện tại)'}</li>
                      <li>Bao gồm cột: Số CV, Trích yếu, Ý kiến VT, Ý kiến PVT, Đơn vị thực hiện, Hạn xử lý, Trạng thái.</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleExportLeadershipExcel}
                      className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Tải File Excel Ngay
                    </button>
                    <button
                      onClick={() => setActiveModule('tab-dispatches')}
                      className="px-4 py-2.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Xem bảng công văn
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 5: USERS TABLE VIEW */}
            {activeModule === 'tab-users' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-red-700" />
                      Danh Sách Tài Khoản & Phân Bổ Quyền Hạn ({allUsers.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quản lý tài khoản cán bộ, điều chuyển bộ phận, gán Phó Viện Trưởng phụ trách và phân quyền
                    </p>
                  </div>

                  {/* Action Buttons Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="btn-create-user-header"
                      onClick={() => setActiveModule('create-user')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Tạo tài khoản mới
                    </button>

                    <button
                      onClick={() => {
                        handleOpenTransferModal();
                        setActiveModule('transfer-dept');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                      Chuyển bộ phận
                    </button>

                    <button
                      onClick={() => {
                        handleOpenAssignPvtModal();
                        setActiveModule('assign-pvt');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                      Gán quyền phụ trách
                    </button>

                    <button
                      onClick={reloadUsers}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Làm mới
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                        <th className="py-3 px-3 w-10 text-center">STT</th>
                        <th className="py-3 px-3 w-28">Tên Đăng Nhập</th>
                        <th className="py-3 px-3 min-w-[180px]">Họ Và Tên / Chức Danh</th>
                        <th className="py-3 px-3 w-32">Vai Trò</th>
                        <th className="py-3 px-3 w-28">Bộ Phận / Ký Hiệu</th>
                        <th className="py-3 px-3 w-48">Phó Viện Trưởng Phụ Trách</th>
                        <th className="py-3 px-3 min-w-[210px] text-center">Thao Tác Quản Trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.map((u, idx) => {
                        const manager = u.pvtManagerId ? allUsers.find(p => p.id === u.pvtManagerId || p.roomCode === u.pvtManagerId) : null;

                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-center font-medium text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-red-700">
                              {u.username}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {u.fullName}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.role === 'ADMIN'
                                  ? 'bg-slate-200 text-slate-800'
                                  : u.role === 'VIEN_TRUONG'
                                  ? 'bg-red-100 text-red-800'
                                  : u.role === 'PHO_VIEN_TRUONG'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">
                              {u.roomCode}
                            </td>
                            <td className="py-2.5 px-3">
                              {u.role === 'TRUONG_PHONG' ? (
                                manager ? (
                                  <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                    {manager.roomCode}: {manager.fullName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Chưa phân bổ</span>
                                )
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition cursor-pointer"
                                  title="Chỉnh sửa họ tên hoặc đổi mật khẩu"
                                >
                                  Sửa / MK
                                </button>

                                <button
                                  onClick={() => {
                                    handleOpenTransferModal(u);
                                    setActiveModule('transfer-dept');
                                  }}
                                  className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded-lg border border-amber-200 transition cursor-pointer"
                                  title="Chuyển bộ phận / phòng ban phụ trách"
                                >
                                  Bộ phận
                                </button>

                                {u.role === 'TRUONG_PHONG' && (
                                  <button
                                    onClick={() => {
                                      handleOpenAssignPvtModal(u);
                                      setActiveModule('assign-pvt');
                                    }}
                                    className="px-2 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-50 rounded-lg border border-purple-200 transition cursor-pointer"
                                    title="Gán PVT phụ trách phòng này"
                                  >
                                    Gán PVT
                                  </button>
                                )}

                                {u.id !== 'u_admin' ? (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1 text-red-600 hover:text-white hover:bg-red-600 rounded-lg border border-red-200 transition cursor-pointer"
                                    title="Xóa tài khoản khỏi hệ thống"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-semibold px-1">Admin</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MODULE 6: DISPATCHES MANAGEMENT VIEW */}
            {activeModule === 'tab-dispatches' && (
              <div className="space-y-4 animate-fadeIn">
                <ActionBar
                  onOpenImport={() => setIsImportModalOpen(true)}
                  onOpenGoogleSheets={() => setIsGoogleSheetModalOpen(true)}
                  onExportExcel={() => exportDispatchesToExcel(filteredDispatches, columns)}
                  onOpenAddModal={() => { setDispatchToEdit(null); setIsDispatchModalOpen(true); }}
                  onOpenColumnManager={() => setIsColumnManagerOpen(true)}
                />

                <DashboardStats
                  stats={dashboardStats}
                  currentFilter={filters}
                  onFilterChange={updates => setFilters(prev => ({ ...prev, ...updates }))}
                />

                <FilterBar
                  filters={filters}
                  onFilterChange={updates => setFilters(prev => ({ ...prev, ...updates }))}
                  onResetFilters={() => setFilters({
                    searchQuery: '',
                    status: 'ALL',
                    donViBanHanh: 'ALL',
                    nguoiThucHien: 'ALL',
                    urgency: 'ALL',
                    dateFrom: '',
                    dateTo: '',
                    overdueOnly: false
                  })}
                  units={filterOptions.units}
                  assignees={filterOptions.assignees}
                  selectedCount={selectedIds.length}
                  totalDispatches={dispatches.length}
                  onBulkComplete={() => bulkUpdateStatus(selectedIds, 'HOAN_THANH')}
                  onBulkDelete={() => bulkDeleteDispatches(selectedIds)}
                  onClearAll={clearAllDispatches}
                  onExportSelected={() => exportLeadershipReportToExcel(dispatches.filter(d => selectedIds.includes(d.id)))}
                />

                <DispatchTable
                  dispatches={filteredDispatches}
                  columns={columns}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  selectedIds={selectedIds}
                  totalRawCount={dispatches.length}
                  onToggleSelectRow={toggleSelectRow}
                  onToggleSelectAll={toggleSelectAll}
                  onViewDetail={disp => setDetailDispatch(disp)}
                  onEdit={disp => { setDispatchToEdit(disp); setIsDispatchModalOpen(true); }}
                  onDelete={id => deleteDispatch(id)}
                  onQuickStatusChange={(id, st) => updateDispatch(id, { trangThai: st })}
                  onOpenAddModal={() => { setDispatchToEdit(null); setIsDispatchModalOpen(true); }}
                  onOpenImport={() => setIsImportModalOpen(true)}
                  onRestoreSamples={restoreSampleDispatches}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="px-6 py-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
              <span>Chỉnh Sửa Tài Khoản: {editingUser.username}</span>
              <button onClick={() => setEditingUser(null)} className="text-white/70 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Họ Và Tên</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {editingUser.role === 'TRUONG_PHONG' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phó Viện Trưởng Phụ Trách</label>
                  <select
                    value={editPvtManager}
                    onChange={e => setEditPvtManager(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- Chưa gán --</option>
                    {pvtUsers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.roomCode}: {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Đặt Lại Mật Khẩu (Để trống nếu không đổi)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Other Modals */}
      <ExcelImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} existingDispatches={dispatches} columns={columns} onCommitImport={commitExcelImport} />
      <DispatchModal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} dispatchToEdit={dispatchToEdit} columns={columns} onSave={addDispatch} />
      <ColumnManagerModal isOpen={isColumnManagerOpen} onClose={() => setIsColumnManagerOpen(false)} columns={columns} onAddCustomColumn={addCustomColumn} onToggleVisibility={toggleColumnVisibility} onRemoveColumn={removeColumn} onResetDefault={resetToDefaultColumns} />
      <DispatchDetailDrawer dispatch={detailDispatch} onClose={() => setDetailDispatch(null)} columns={columns} onUpdate={(id, updates) => { updateDispatch(id, updates); showToast('Đã cập nhật tiến độ công văn'); }} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} />
      <GoogleSheetModal isOpen={isGoogleSheetModalOpen} onClose={() => setIsGoogleSheetModalOpen(false)} showToast={showToast} sampleDispatch={dispatches[0]} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounceIn">
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
