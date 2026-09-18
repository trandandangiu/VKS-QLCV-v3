import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AssignTpModal } from '../components/AssignTpModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { User } from '../types/auth';
import { DEFAULT_COLUMNS } from '../services/dispatchStorage';
import { exportDispatchesToExcel } from '../services/excelService';
import { 
  Users, 
  CornerDownRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  RefreshCw, 
  Download,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';

export const PhoVienTruongDashboard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { allUsers, currentUser } = useAuth();
  const navigate = useNavigate();

  // Determine which PVT is being viewed
  // Can be from URL param (/pvt/1, /pvt/u_pvt_1, /pvt1) or currentUser
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isAssignTpModalOpen, setIsAssignTpModalOpen] = useState(false);
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDispatches = async () => {
    if (!pvtUser) return;
    setIsLoading(true);
    try {
      const list = await apiClient.getDispatches({
        role: 'PHO_VIEN_TRUONG',
        userId: pvtUser.id,
        roomCode: pvtUser.roomCode
      });
      setDispatches(list);
    } catch (err) {
      console.error('Lỗi khi tải công văn của PVT:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [pvtUser]);

  // Subordinate departments (Lãnh đạo phòng dưới quyền PVT này)
  const subordinateRooms = useMemo(() => {
    if (!pvtUser) return [];
    return allUsers.filter(u => u.role === 'TRUONG_PHONG' && (u.pvtManagerId === pvtUser.id || u.pvtManagerId === pvtUser.roomCode));
  }, [pvtUser, allUsers]);

  const allTpUsers = useMemo(() => {
    return allUsers.filter(u => u.role === 'TRUONG_PHONG');
  }, [allUsers]);

  // Filtered dispatches for this PVT
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = (d.soCongVan || '').toLowerCase().includes(q);
        const matchTitle = (d.tenCongVan || '').toLowerCase().includes(q);
        const matchTp = (d.assignedTpName || '').toLowerCase().includes(q);
        const matchOfficer = (d.nguoiThucHien || '').toLowerCase().includes(q);
        if (!matchNumber && !matchTitle && !matchTp && !matchOfficer) return false;
      }
      if (selectedStatus !== 'ALL' && d.trangThai !== selectedStatus) return false;
      return true;
    });
  }, [dispatches, searchQuery, selectedStatus]);

  // Statistics for this PVT
  const pvtStats = useMemo(() => {
    let hoanThanh = 0;
    let quaHan = 0;
    let dangXuLy = 0;
    let chuaGiaoPhong = 0;

    dispatches.forEach(d => {
      if (d.trangThai === 'HOAN_THANH') hoanThanh++;
      else if (d.trangThai === 'QUA_HAN') quaHan++;
      else dangXuLy++;

      if (!d.assignedTpId) chuaGiaoPhong++;
    });

    return {
      total: dispatches.length,
      hoanThanh,
      quaHan,
      dangXuLy,
      chuaGiaoPhong
    };
  }, [dispatches]);

  // Handle assign to TP
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Banner PVT */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-red-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-400/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {pvtUser?.roomCode || 'PVT'} • {pvtUser?.fullName || 'Phó Viện Trưởng'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Chỉ Đạo Cấp Phòng Dưới Quyền
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wide mt-1">
                Công Văn Viện Trưởng Phân Công & Chỉ Đạo Cấp Phòng
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Switch to other PVT 1..12 */}
            <select
              value={pvtUser?.roomCode || ''}
              onChange={e => {
                const targetPvt = allUsers.find(u => u.roomCode === e.target.value);
                if (targetPvt) navigate(`/${targetPvt.username}`);
              }}
              className="px-3 py-2 text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl transition cursor-pointer"
            >
              {allUsers
                .filter(u => u.role === 'PHO_VIEN_TRUONG')
                .map(p => (
                  <option key={p.id} value={p.roomCode} className="text-slate-800">
                    {p.roomCode}: {p.fullName}
                  </option>
                ))}
            </select>

            <button
              onClick={() => exportDispatchesToExcel(filteredDispatches, DEFAULT_COLUMNS)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/20 cursor-pointer"
              title="Xuất bảng Excel"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>

            <button
              onClick={loadDispatches}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/20 cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Subordinate Departments Card */}
        <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Các Phòng Ban Nghiệp Vụ Trực Thuộc Quyền Phụ Trách:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {subordinateRooms.length > 0 ? (
              subordinateRooms.map(r => (
                <span
                  key={r.id}
                  className="px-2.5 py-1 bg-white text-amber-950 font-bold rounded-lg border border-amber-300 shadow-2xs"
                >
                  {r.code || r.roomCode}: {r.fullName}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">
                Chưa gán phòng cố định (PVT có thể chỉ đạo bất kỳ phòng ban nào bên dưới)
              </span>
            )}
          </div>
        </div>

        {/* Summary Cards for this PVT */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Việc Được VT Giao</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{pvtStats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Viện Trưởng phân công</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chưa Giao Phòng</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{pvtStats.chuaGiaoPhong}</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Cần chỉ đạo cấp phòng</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Đang Xử Lý</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{pvtStats.dangXuLy}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cấp phòng đang làm</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã Hoàn Thành</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{pvtStats.hoanThanh}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Đạt tiến độ 100%</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Quá Hạn</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{pvtStats.quaHan}</div>
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Cần đôn đốc gấp</div>
          </div>
        </div>

        {/* Table of Dispatches assigned to PVT */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm số CV, tên CV, phòng ban..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-600 focus:outline-none bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
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
              </select>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-3.5 w-12 text-center">STT</th>
                  <th className="py-3 px-3.5 w-36">Số Công Văn</th>
                  <th className="py-3 px-3.5 min-w-[260px]">Nội Dung & Chỉ Đạo Của Viện Trưởng</th>
                  <th className="py-3 px-3.5 w-48">Chỉ Đạo & Giao Phòng (TP)</th>
                  <th className="py-3 px-3.5 w-32">Hạn Xử Lý</th>
                  <th className="py-3 px-3.5 w-28 text-center">Tiến Độ</th>
                  <th className="py-3 px-3.5 w-28 text-center">Trạng Thái</th>
                  <th className="py-3 px-3.5 w-28 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Chưa có công văn nào được Viện Trưởng giao cho Phó Viện Trưởng này.
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
                          <span className="block text-[10px] text-rose-600 font-sans font-bold">
                            [{disp.mucDoKhan}]
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        <div
                          onClick={() => setDetailDispatch(disp)}
                          className="font-semibold text-slate-900 hover:text-amber-800 cursor-pointer line-clamp-2"
                        >
                          {disp.tenCongVan}
                        </div>
                        {disp.vtChiDao && (
                          <div className="text-[11px] text-rose-800 bg-rose-50/80 p-1.5 rounded-lg mt-1 border border-rose-200">
                            <strong>Chỉ đạo của Viện Trưởng:</strong> {disp.vtChiDao}
                          </div>
                        )}
                        {disp.baoCaoTienDo && (
                          <div className="text-[10px] text-slate-600 bg-slate-50 p-1 rounded mt-1">
                            <strong>Báo cáo cấp phòng:</strong> {disp.baoCaoTienDo}
                          </div>
                        )}
                      </td>

                      {/* Phân công cho Trưởng phòng */}
                      <td className="py-3 px-3.5">
                        {disp.assignedTpName ? (
                          <div>
                            <span className="font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-300 block truncate">
                              {disp.assignedTpName}
                            </span>
                            {disp.pvtChiDao && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                                {disp.pvtChiDao}
                              </p>
                            )}
                            <button
                              onClick={() => handleOpenAssignTp(disp)}
                              className="text-[10px] text-amber-700 hover:underline mt-0.5 cursor-pointer block"
                            >
                              Đổi chỉ đạo / phòng
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssignTp(disp)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            Giao Trưởng Phòng
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-medium">{disp.hanBaoCaoXuLy || '—'}</span>
                        {disp.thoiHanXuLy && (
                          <span className={`block text-[10px] font-semibold ${
                            disp.thoiHanXuLy.includes('Quá hạn') ? 'text-rose-600' : 'text-slate-500'
                          }`}>
                            {disp.thoiHanXuLy}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span className="font-bold text-slate-800">{disp.tienDo || 0}%</span>
                        <div className="h-1.5 w-14 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              (disp.tienDo || 0) === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${disp.tienDo || 0}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            disp.trangThai === 'HOAN_THANH'
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
                            : 'Đang xử lý'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAssignTp(disp)}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg border border-amber-200 transition cursor-pointer"
                        >
                          Chỉ Đạo
                        </button>
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
      <AssignTpModal
        isOpen={isAssignTpModalOpen}
        onClose={() => setIsAssignTpModalOpen(false)}
        dispatch={dispatchToAssign}
        tpList={allTpUsers}
        currentPvt={pvtUser || null}
        onAssign={handleSaveAssignTp}
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
export default PhoVienTruongDashboard;
