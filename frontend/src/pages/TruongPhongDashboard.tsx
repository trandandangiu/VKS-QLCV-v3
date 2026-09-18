import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { ReportProgressModal } from '../components/ReportProgressModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { apiClient } from '../services/apiClient';
import { Dispatch, DispatchStatus } from '../types/dispatch';
import { DEFAULT_COLUMNS } from '../services/dispatchStorage';
import { exportDispatchesToExcel } from '../services/excelService';
import { 
  Briefcase, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  User, 
  Search, 
  RefreshCw, 
  Download,
  AlertCircle,
  Building,
  CheckCircle2
} from 'lucide-react';

export const TruongPhongDashboard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { allUsers, currentUser } = useAuth();
  const navigate = useNavigate();

  // Determine current department/TP user
  const tpUser = useMemo(() => {
    if (id) {
      const cleanId = id.toLowerCase().replace('tp', '');
      const num = parseInt(cleanId, 10);
      if (!isNaN(num)) {
        return allUsers.find(u => u.roomCode === `TP${num}` || u.username === `tp${num}`);
      }
      return allUsers.find(u => u.id === id || u.username === id || u.roomCode === id);
    }
    if (currentUser?.role === 'TRUONG_PHONG') {
      return currentUser;
    }
    // Default fallback to TP 1
    return allUsers.find(u => u.roomCode === 'TP1');
  }, [id, allUsers, currentUser]);

  // Find PVT managing this room
  const managingPvt = useMemo(() => {
    if (!tpUser || !tpUser.pvtManagerId) return null;
    return allUsers.find(u => u.id === tpUser.pvtManagerId || u.roomCode === tpUser.pvtManagerId);
  }, [tpUser, allUsers]);

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [dispatchToReport, setDispatchToReport] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDispatches = async () => {
    if (!tpUser) return;
    setIsLoading(true);
    try {
      const list = await apiClient.getDispatches({
        role: 'TRUONG_PHONG',
        userId: tpUser.id,
        roomCode: tpUser.roomCode
      });
      setDispatches(list);
    } catch (err) {
      console.error('Lỗi khi tải công văn cấp phòng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [tpUser]);

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = (d.soCongVan || '').toLowerCase().includes(q);
        const matchTitle = (d.tenCongVan || '').toLowerCase().includes(q);
        const matchOfficer = (d.nguoiThucHien || '').toLowerCase().includes(q);
        if (!matchNumber && !matchTitle && !matchOfficer) return false;
      }
      if (selectedStatus !== 'ALL' && d.trangThai !== selectedStatus) return false;
      return true;
    });
  }, [dispatches, searchQuery, selectedStatus]);

  // Statistics for this TP
  const tpStats = useMemo(() => {
    let hoanThanh = 0;
    let quaHan = 0;
    let dangXuLy = 0;

    dispatches.forEach(d => {
      if (d.trangThai === 'HOAN_THANH') hoanThanh++;
      else if (d.trangThai === 'QUA_HAN') quaHan++;
      else dangXuLy++;
    });

    return {
      total: dispatches.length,
      hoanThanh,
      quaHan,
      dangXuLy,
      rate: dispatches.length > 0 ? Math.round((hoanThanh / dispatches.length) * 100) : 0
    };
  }, [dispatches]);

  // Handle reporting progress
  const handleOpenReport = (disp: Dispatch) => {
    setDispatchToReport(disp);
    setIsReportModalOpen(true);
  };

  const handleSaveReport = async (data: any) => {
    if (!dispatchToReport) return;
    const updated = await apiClient.reportProgress(dispatchToReport.id, data);
    if (updated) {
      showToast(`Đã lưu báo cáo tiến độ cho công văn số ${updated.soCongVan}`);
      loadDispatches();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Banner TP */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-400/20">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-400/20 border border-blue-300/40 flex items-center justify-center text-blue-300 shadow-inner">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {tpUser?.roomCode || 'TP'} • {tpUser?.fullName}
                </span>
                {managingPvt && (
                  <span className="text-[11px] font-semibold text-blue-200 bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-400/30">
                    Dưới quyền chỉ đạo: {managingPvt.fullName}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wide mt-1">
                Không Gian Xử Lý & Báo Cáo Tiến Độ Cấp Phòng
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Switch to other TPs */}
            <select
              value={tpUser?.roomCode || ''}
              onChange={e => {
                const target = allUsers.find(u => u.roomCode === e.target.value);
                if (target) navigate(`/${target.username}`);
              }}
              className="px-3 py-2 text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl transition cursor-pointer"
            >
              {allUsers
                .filter(u => u.role === 'TRUONG_PHONG')
                .map(t => (
                  <option key={t.id} value={t.roomCode} className="text-slate-800">
                    {t.roomCode}: {t.fullName}
                  </option>
                ))}
            </select>

            <button
              onClick={() => exportDispatchesToExcel(filteredDispatches, DEFAULT_COLUMNS)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>

            <button
              onClick={loadDispatches}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/20 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Room KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Việc Phòng Được Giao</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{tpStats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Từ Lãnh đạo Viện & PVT</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Đang Giải Quyết</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{tpStats.dangXuLy}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Kiểm sát viên đang thụ lý</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã Hoàn Thành</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{tpStats.hoanThanh}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Tỷ lệ đạt {tpStats.rate}%</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Quá Hạn Báo Cáo</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{tpStats.quaHan}</div>
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Cần xử lý khẩn trương</div>
          </div>
        </div>

        {/* Dispatches Table for TP */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm số CV, tên CV, cán bộ thực hiện..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-3.5 w-12 text-center">STT</th>
                  <th className="py-3 px-3.5 w-36">Số Công Văn</th>
                  <th className="py-3 px-3.5 min-w-[260px]">Nội Dung & Ý Kiến Chỉ Đạo Của PVT / VT</th>
                  <th className="py-3 px-3.5 w-44">Cán Bộ (KSV) Thụ Lý</th>
                  <th className="py-3 px-3.5 w-32">Hạn Xử Lý</th>
                  <th className="py-3 px-3.5 w-28 text-center">Tiến Độ</th>
                  <th className="py-3 px-3.5 w-28 text-center">Trạng Thái</th>
                  <th className="py-3 px-3.5 w-32 text-center">Báo Cáo Tiến Độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Chưa có công văn nào được phân công cho phòng ban này.
                    </td>
                  </tr>
                ) : (
                  filteredDispatches.map((disp, idx) => (
                    <tr key={disp.id} className="hover:bg-blue-50/40 transition">
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
                          className="font-semibold text-slate-900 hover:text-blue-700 cursor-pointer line-clamp-2"
                        >
                          {disp.tenCongVan}
                        </div>
                        {disp.pvtChiDao && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded-lg mt-1 border border-amber-200">
                            <strong>Chỉ đạo của PVT:</strong> {disp.pvtChiDao}
                          </div>
                        )}
                        {disp.baoCaoTienDo && (
                          <div className="text-[11px] text-emerald-900 bg-emerald-50/80 p-1.5 rounded-lg mt-1 border border-emerald-200">
                            <strong>Nội dung báo cáo:</strong> {disp.baoCaoTienDo}
                          </div>
                        )}
                      </td>

                      {/* Cán bộ thụ lý */}
                      <td className="py-3 px-3.5">
                        {disp.nguoiThucHien ? (
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                            {disp.nguoiThucHien}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenReport(disp)}
                            className="text-[11px] text-blue-600 hover:underline italic cursor-pointer"
                          >
                            + Gán cán bộ thụ lý
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
                              (disp.tienDo || 0) === 100 ? 'bg-emerald-500' : 'bg-blue-500'
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
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {disp.trangThai === 'HOAN_THANH' ? 'Hoàn thành' : disp.trangThai === 'QUA_HAN' ? 'Quá hạn' : 'Đang xử lý'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReport(disp)}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Báo Cáo
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
      <ReportProgressModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        dispatch={dispatchToReport}
        onSave={handleSaveReport}
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
export default TruongPhongDashboard;
