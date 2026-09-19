import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { PieChart, PieChartSegment } from '../components/PieChart';
import { AssignPvtModal } from '../components/AssignPvtModal';
import { DispatchModal } from '../components/DispatchModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { ConfirmModal } from '../components/ConfirmModal';
import { apiClient } from '../services/apiClient';
import { Dispatch, UrgencyLevel, DispatchStatus } from '../types/dispatch';
import { VTDashboardStatsResponse, User } from '../types/auth';
import { DEFAULT_COLUMNS } from '../constants/columns';

import { exportDispatchesToExcel } from '../services/excelService';
import {
  Crown,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plus,
  Download,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  Edit,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';

const PVT_COLORS = [
  '#2563EB', '#3B82F6', '#60A5FA', '#0284C7',
  '#0EA5E9', '#38BDF8', '#0D9488', '#14B8A6',
  '#059669', '#10B981', '#65A30D', '#84CC16'
];

const TP_COLORS = [
  '#7C3AED', '#8B5CF6', '#A78BFA', '#C084FC',
  '#D946EF', '#EC4899', '#F43F5E', '#E11D48',
  '#EA580C', '#F97316', '#F59E0B', '#EAB308'
];

export const VienTruongDashboard: React.FC = () => {
  const { allUsers } = useAuth();

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [statsData, setStatsData] = useState<VTDashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active filter for table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPvtFilter, setSelectedPvtFilter] = useState<string | null>(null);
  const [selectedTpFilter, setSelectedTpFilter] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dispList, stats] = await Promise.all([
        apiClient.getDispatches({ role: 'VIEN_TRUONG' }),
        apiClient.getVTDashboardStats()
      ]);
      setDispatches(dispList);
      setStatsData(stats);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Viện Trưởng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pvtList = useMemo(() => {
    return allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG');
  }, [allUsers]);

  // Convert stats to Pie Chart Segments
  const pvtPieData: PieChartSegment[] = useMemo(() => {
    if (!statsData?.pvtStats) return [];
    return statsData.pvtStats.map((pvt, idx) => ({
      id: pvt.id,
      label: pvt.name.replace('Đ/c ', ''),
      subLabel: `${pvt.completed}/${pvt.total} xong`,
      value: pvt.total,
      color: PVT_COLORS[idx % PVT_COLORS.length]
    }));
  }, [statsData]);

  const tpPieData: PieChartSegment[] = useMemo(() => {
    if (!statsData?.tpStats) return [];
    return statsData.tpStats.map((tp, idx) => ({
      id: tp.id,
      label: tp.code,
      subLabel: tp.name.split('(')[1]?.replace(')', '') || tp.name,
      value: tp.total,
      color: TP_COLORS[idx % TP_COLORS.length]
    }));
  }, [statsData]);

  // Handle Pie Slice Click Filters
  const handleSelectPvtSegment = (seg: PieChartSegment | null) => {
    setSelectedPvtFilter(seg ? seg.id : null);
  };

  const handleSelectTpSegment = (seg: PieChartSegment | null) => {
    setSelectedTpFilter(seg ? seg.id : null);
  };

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = (d.soCongVan || '').toLowerCase().includes(q);
        const matchTitle = (d.tenCongVan || '').toLowerCase().includes(q);
        const matchUnit = (d.donViBanHanh || '').toLowerCase().includes(q);
        const matchPvt = (d.assignedPvtName || '').toLowerCase().includes(q);
        const matchTp = (d.assignedTpName || '').toLowerCase().includes(q);
        if (!matchNumber && !matchTitle && !matchUnit && !matchPvt && !matchTp) return false;
      }

      if (selectedStatus !== 'ALL' && d.trangThai !== selectedStatus) {
        return false;
      }

      if (selectedPvtFilter && d.assignedPvtId !== selectedPvtFilter) {
        const pvtObj = pvtList.find(p => p.id === selectedPvtFilter);
        if (!pvtObj || d.assignedPvtId !== pvtObj.roomCode) return false;
      }

      if (selectedTpFilter && d.assignedTpId !== selectedTpFilter) {
        const tpObj = allUsers.find(u => u.id === selectedTpFilter);
        if (!tpObj || d.assignedTpId !== tpObj.roomCode) return false;
      }

      return true;
    });
  }, [dispatches, searchQuery, selectedStatus, selectedPvtFilter, selectedTpFilter, pvtList, allUsers]);

  // Handle Assigning PVT
  const handleOpenAssign = (disp: Dispatch) => {
    setDispatchToAssign(disp);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignPvt = async (data: any) => {
    if (!dispatchToAssign) return;
    const updated = await apiClient.assignToPvt(dispatchToAssign.id, data);
    if (updated) {
      showToast(`Đã phân công công văn số ${updated.soCongVan} cho ${data.pvtName}`);
      loadData();
    }
  };

  // Handle Add/Edit Dispatch
  const handleSaveDispatch = async (formData: any) => {
    if (dispatchToEdit) {
      const updated = await apiClient.updateDispatch(dispatchToEdit.id, formData);
      if (updated) showToast(`Đã cập nhật công văn số ${formData.soCongVan}`);
    } else {
      const created = await apiClient.createDispatch(formData);
      if (created) showToast(`Đã thêm mới công văn số ${formData.soCongVan}`);
    }
    loadData();
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!confirmDeleteModal.id) return;
    const ok = await apiClient.deleteDispatch(confirmDeleteModal.id);
    if (ok) {
      showToast(`Đã xóa công văn "${confirmDeleteModal.name}" thành công`);
      setConfirmDeleteModal({ isOpen: false, id: '', name: '' });
      loadData();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Title Bar for Viện Trưởng */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-500/20">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  Không Gian Làm Việc Viện Trưởng (/vt)
                </span>
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Toàn Quyền Quản Trị & Phân Công
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wide mt-1">
                Bảng Chỉ Đạo Điều Hành & Phân Công 12 Phó Viện Trưởng
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setDispatchToEdit(null); setIsAddEditModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-red-950 rounded-xl transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Công Văn Mới
            </button>

            <button
              onClick={() => exportDispatchesToExcel(filteredDispatches, DEFAULT_COLUMNS)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/20 cursor-pointer"
              title="Xuất bảng ra Excel"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>

            <button
              onClick={loadData}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/20 cursor-pointer"
              title="Làm mới dữ liệu CSDL"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 1. KHỐI THỐNG KÊ TỔNG QUAN (KPI CARDS) */}
        {statsData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Công Văn</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{statsData.summary.total}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Toàn Viện theo dõi</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Đã Phân PVT</div>
              <div className="text-2xl font-black text-blue-700 mt-1">{statsData.summary.daPhanCongPvt}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Còn <span className="text-rose-600 font-bold">{statsData.summary.chuaPhanCongPvt}</span> chưa giao
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã Hoàn Thành</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{statsData.summary.hoanThanh}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Đạt {statsData.summary.rateOnTime}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Đang Xử Lý</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{statsData.summary.dangXuLy}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tiến độ bình thường</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">Sắp Đến Hạn</div>
              <div className="text-2xl font-black text-orange-700 mt-1">{statsData.summary.sapDenHan}</div>
              <div className="text-[11px] text-orange-600 mt-0.5">Cần đôn đốc</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Quá Hạn Xử Lý</div>
              <div className="text-2xl font-black text-rose-700 mt-1">{statsData.summary.quaHan}</div>
              <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Cần chỉ đạo gấp</div>
            </div>
          </div>
        )}

        {/* 2. KHỐI BIỂU ĐỒ TRÒN (PIE CHARTS) THEO 12 PVT VÀ CÁC TP */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Biểu đồ tròn 1: Tiến độ theo 12 Phó Viện Trưởng */}
          <PieChart
            title="Biểu Đồ Tròn: Phân Bổ Tiến Độ 12 Phó Viện Trưởng"
            subtitle="Tỷ trọng công việc và tỷ lệ hoàn thành được Viện Trưởng giao (Bấm để lọc bảng bên dưới)"
            data={pvtPieData}
            selectedId={selectedPvtFilter}
            onSelectSegment={handleSelectPvtSegment}
            size={270}
            donut={true}
            emptyMessage="Chưa có công văn phân công cho Phó Viện Trưởng"
          />

          {/* Biểu đồ tròn 2: Tiến độ theo các Phòng Ban (TP) */}
          <PieChart
            title="Biểu Đồ Tròn: Tình Hình Giải Quyết Của Các Phòng Ban"
            subtitle="Số lượng văn bản giải quyết tại các phòng chuyên môn (Bấm để lọc)"
            data={tpPieData}
            selectedId={selectedTpFilter}
            onSelectSegment={handleSelectTpSegment}
            size={270}
            donut={true}
            emptyMessage="Chưa có công văn phân công về các phòng ban"
          />
        </div>

        {/* 3. BẢNG CÔNG VĂN & TÍNH NĂNG PHÂN CÔNG PVT */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm số CV, tên CV, PVT, phòng ban..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto">
              {/* Lọc PVT */}
              <select
                value={selectedPvtFilter || ''}
                onChange={e => setSelectedPvtFilter(e.target.value || null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700"
              >
                <option value="">Tất cả 12 PVT</option>
                {pvtList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.roomCode}: {p.fullName}
                  </option>
                ))}
              </select>

              {/* Lọc Trạng thái */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DANG_XU_LY">Đang xử lý</option>
                <option value="SAP_DEN_HAN">Sắp đến hạn</option>
                <option value="QUA_HAN">Quá hạn</option>
                <option value="HOAN_THANH">Đã hoàn thành</option>
                <option value="CHO_Y_KIEN_LANH_DAO">Chờ ý kiến Lãnh đạo</option>
              </select>

              {(selectedPvtFilter || selectedTpFilter || selectedStatus !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedPvtFilter(null);
                    setSelectedTpFilter(null);
                    setSelectedStatus('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Indicator */}
          {(selectedPvtFilter || selectedTpFilter) && (
            <div className="px-5 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Đang lọc theo:{' '}
                  <strong>
                    {selectedPvtFilter ? pvtList.find(p => p.id === selectedPvtFilter)?.fullName : ''}
                    {selectedTpFilter ? ` • ${allUsers.find(u => u.id === selectedTpFilter)?.fullName}` : ''}
                  </strong>
                </span>
              </div>
              <span className="font-semibold">{filteredDispatches.length} kết quả</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-3.5 w-12 text-center">STT</th>
                  <th className="py-3 px-3.5 w-36">Số Công Văn</th>
                  <th className="py-3 px-3.5 min-w-[280px]">Tên Công Văn / Trích Yếu</th>
                  <th className="py-3 px-3.5 w-44">Phó Viện Trưởng Phụ Trách</th>
                  <th className="py-3 px-3.5 w-40">Lãnh Đạo Phòng (TP)</th>
                  <th className="py-3 px-3.5 w-32">Hạn Xử Lý</th>
                  <th className="py-3 px-3.5 w-28 text-center">Tiến Độ</th>
                  <th className="py-3 px-3.5 w-32 text-center">Trạng Thái</th>
                  <th className="py-3 px-3.5 w-28 text-center">Chỉ Đạo / Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Không tìm thấy công văn nào phù hợp điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredDispatches.map((disp, idx) => (
                    <tr key={disp.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-3.5 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                        {disp.soCongVan}
                        {disp.mucDoKhan && disp.mucDoKhan !== 'THUONG' && (
                          <span className={`block text-[10px] font-sans font-extrabold mt-0.5 ${disp.mucDoKhan === 'HOA_TOC' ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                            [{disp.mucDoKhan}]
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        <div
                          onClick={() => setDetailDispatch(disp)}
                          className="font-semibold text-slate-900 hover:text-red-700 cursor-pointer line-clamp-2"
                        >
                          {disp.tenCongVan}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Đơn vị gửi: {disp.donViBanHanh}
                        </div>
                        {disp.vtChiDao && (
                          <div className="text-[11px] text-rose-800 bg-rose-50/70 p-1 rounded mt-1 italic border border-rose-100">
                            <strong>Ý kiến VT:</strong> {disp.vtChiDao}
                          </div>
                        )}
                      </td>

                      {/* Phó Viện Trưởng Phụ Trách */}
                      <td className="py-3 px-3.5">
                        {disp.assignedPvtName ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              {disp.assignedPvtName.replace('Đ/c ', '')}
                            </span>
                            <button
                              onClick={() => handleOpenAssign(disp)}
                              className="block text-[10px] text-blue-600 hover:text-blue-800 hover:underline mt-0.5 cursor-pointer"
                            >
                              Đổi phân công
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssign(disp)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-red-700 hover:bg-red-800 px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Phân Công PVT
                          </button>
                        )}
                      </td>

                      {/* Lãnh Đạo Phòng (TP) */}
                      <td className="py-3 px-3.5">
                        {disp.assignedTpName ? (
                          <div>
                            <span className="font-semibold text-slate-700 block truncate max-w-[150px]">
                              {disp.assignedTpName}
                            </span>
                            {disp.nguoiThucHien && (
                              <span className="text-[10px] text-slate-500 block">
                                KSV: {disp.nguoiThucHien}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chờ PVT giao</span>
                        )}
                      </td>

                      {/* Hạn Báo Cáo */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-medium">{disp.hanBaoCaoXuLy || '—'}</span>
                        {disp.thoiHanXuLy && (
                          <span className={`block text-[10px] font-semibold ${disp.thoiHanXuLy.includes('Quá hạn') ? 'text-rose-600' : 'text-slate-500'
                            }`}>
                            {disp.thoiHanXuLy}
                          </span>
                        )}
                      </td>

                      {/* Tiến độ % */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="w-16 mx-auto">
                          <div className="text-[11px] font-bold text-slate-700 mb-0.5">
                            {disp.tienDo || 0}%
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${(disp.tienDo || 0) === 100
                                  ? 'bg-emerald-500'
                                  : (disp.tienDo || 0) >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                              style={{ width: `${disp.tienDo || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Trạng Thái */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${disp.trangThai === 'HOAN_THANH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : disp.trangThai === 'QUA_HAN'
                                ? 'bg-rose-100 text-rose-800'
                                : disp.trangThai === 'SAP_DEN_HAN'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          {disp.trangThai === 'HOAN_THANH'
                            ? 'Hoàn thành'
                            : disp.trangThai === 'QUA_HAN'
                              ? 'Quá hạn'
                              : disp.trangThai === 'SAP_DEN_HAN'
                                ? 'Sắp đến hạn'
                                : 'Đang xử lý'}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenAssign(disp)}
                            className="p-1 text-slate-500 hover:text-red-700 rounded transition cursor-pointer"
                            title="Phân công / Chỉ đạo PVT"
                          >
                            <UserCheck className="w-4 h-4 text-red-700" />
                          </button>
                          <button
                            onClick={() => { setDispatchToEdit(disp); setIsAddEditModalOpen(true); }}
                            className="p-1 text-slate-500 hover:text-blue-700 rounded transition cursor-pointer"
                            title="Chỉnh sửa công văn"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteModal({ isOpen: true, id: disp.id, name: disp.soCongVan })}
                            className="p-1 text-slate-500 hover:text-rose-700 rounded transition cursor-pointer"
                            title="Xóa công văn"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </main>

      {/* Modals */}
      <AssignPvtModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        dispatch={dispatchToAssign}
        pvtList={pvtList}
        onAssign={handleSaveAssignPvt}
      />

      <DispatchModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        dispatchToEdit={dispatchToEdit}
        columns={DEFAULT_COLUMNS}
        onSave={handleSaveDispatch}
      />

      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        onUpdate={(id, updates) => {
          apiClient.updateDispatch(id, updates);
          loadData();
        }}
      />

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa công văn"
        message={`Viện Trưởng có chắc chắn muốn xóa công văn "${confirmDeleteModal.name}" khỏi cơ sở dữ liệu?`}
        confirmText="Xác nhận xóa"
      />

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
export default VienTruongDashboard;
