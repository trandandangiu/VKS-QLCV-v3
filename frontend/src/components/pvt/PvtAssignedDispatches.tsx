import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  CornerDownRight, 
  Eye, 
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { DEFAULT_COLUMNS } from '../../constants/columns';
import { exportDispatchesToExcel } from '../../services/excelService';

interface PvtAssignedDispatchesProps {
  dispatches: Dispatch[];
  onOpenAssignTp: (disp: Dispatch) => void;
  onOpenDetail: (disp: Dispatch) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const PvtAssignedDispatches: React.FC<PvtAssignedDispatchesProps> = ({
  dispatches,
  onOpenAssignTp,
  onOpenDetail,
  onRefresh,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');

  const filtered = useMemo(() => {
    return dispatches.filter(d => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = (d.soCongVan || '').toLowerCase().includes(q);
        const matchTitle = (d.tenCongVan || '').toLowerCase().includes(q);
        const matchTp = (d.assignedTpName || '').toLowerCase().includes(q);
        const matchIssuer = (d.donViBanHanh || '').toLowerCase().includes(q);
        if (!matchNo && !matchTitle && !matchTp && !matchIssuer) return false;
      }
      if (selectedStatus !== 'ALL' && d.trangThai !== selectedStatus) return false;
      if (selectedUrgency !== 'ALL' && d.mucDoKhan !== selectedUrgency) return false;
      return true;
    });
  }, [dispatches, searchQuery, selectedStatus, selectedUrgency]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Công Văn Được Viện Trưởng Giao ({dispatches.length})
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Toàn bộ công văn, văn bản chỉ đạo từ Viện Trưởng giao Phó Viện Trưởng trực tiếp chỉ đạo giải quyết
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDispatchesToExcel(filtered, DEFAULT_COLUMNS)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-amber-900 bg-white hover:bg-amber-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Xuất Excel
          </button>
          <button
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-amber-900 bg-white hover:bg-amber-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo số công văn, trích yếu nội dung, đơn vị ban hành..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-600 focus:outline-none bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50/50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DANG_XU_LY">Đang xử lý</option>
            <option value="CHO_TP_XU_LY">Chờ TP xử lý</option>
            <option value="CHO_TRINH_VT">Chờ trình VT</option>
            <option value="SAP_DEN_HAN">Sắp đến hạn</option>
            <option value="QUA_HAN">Quá hạn</option>
            <option value="HOAN_THANH">Đã hoàn thành</option>
          </select>

          <select
            value={selectedUrgency}
            onChange={e => setSelectedUrgency(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50/50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tất cả độ khẩn</option>
            <option value="HOA_TOC">Hỏa tốc</option>
            <option value="THUONG_KHAN">Thượng khẩn</option>
            <option value="KHAN">Khẩn</option>
            <option value="THUONG">Thường</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5 w-12 text-center">STT</th>
              <th className="py-3 px-3.5 w-32">Số Công Văn</th>
              <th className="py-3 px-3.5 min-w-[260px]">Nội Dung & Chỉ Đạo Của Viện Trưởng</th>
              <th className="py-3 px-3.5 w-44">Trưởng Phòng Phụ Trách</th>
              <th className="py-3 px-3.5 w-32">Hạn Xử Lý</th>
              <th className="py-3 px-3.5 w-28 text-center">Tiến Độ</th>
              <th className="py-3 px-3.5 w-28 text-center">Trạng Thái</th>
              <th className="py-3 px-3.5 w-32 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                  Không tìm thấy công văn nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filtered.map((disp, idx) => (
                <tr key={disp.id} className="hover:bg-amber-50/30 transition">
                  <td className="py-3.5 px-3.5 text-center font-medium text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">
                    {disp.soCongVan}
                    {disp.mucDoKhan && disp.mucDoKhan !== 'THUONG' && (
                      <span className="block text-[10px] font-sans font-bold text-rose-600">
                        [{disp.mucDoKhan}]
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div
                      onClick={() => onOpenDetail(disp)}
                      className="font-semibold text-slate-900 hover:text-amber-800 cursor-pointer line-clamp-2"
                    >
                      {disp.tenCongVan}
                    </div>
                    {disp.vtChiDao && (
                      <div className="text-[11px] text-rose-800 bg-rose-50/80 p-1.5 rounded-lg mt-1 border border-rose-200">
                        <strong>Chỉ đạo của Viện Trưởng:</strong> {disp.vtChiDao}
                      </div>
                    )}
                    {disp.pvtChiDao && (
                      <div className="text-[10px] text-amber-800 italic mt-0.5">
                        <strong>Chỉ đạo của PVT:</strong> {disp.pvtChiDao}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3.5">
                    {disp.assignedTpName ? (
                      <div>
                        <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300 block truncate">
                          {disp.assignedTpName}
                        </span>
                        <button
                          onClick={() => onOpenAssignTp(disp)}
                          className="text-[10px] text-amber-700 hover:underline mt-0.5 cursor-pointer"
                        >
                          Đổi Trưởng phòng
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenAssignTp(disp)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-amber-700 hover:bg-amber-800 px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        Giao Trưởng Phòng
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{disp.hanBaoCaoXuLy || '—'}</div>
                    {disp.thoiHanXuLy && (
                      <span className={`text-[10px] font-semibold ${
                        disp.thoiHanXuLy.includes('Quá hạn') ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {disp.thoiHanXuLy}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3.5 text-center">
                    <span className="font-bold text-slate-900">{disp.tienDo || 0}%</span>
                    <div className="h-1.5 w-16 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          (disp.tienDo || 0) >= 80
                            ? 'bg-emerald-600'
                            : (disp.tienDo || 0) >= 40
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${disp.tienDo || 0}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        disp.trangThai === 'HOAN_THANH'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : disp.trangThai === 'QUA_HAN'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : disp.trangThai === 'SAP_DEN_HAN'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : disp.trangThai === 'CHO_TP_XU_LY'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {disp.trangThai || 'DANG_XU_LY'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenDetail(disp)}
                        className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenAssignTp(disp)}
                        className="px-2 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition cursor-pointer"
                      >
                        Chỉ đạo
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
  );
};
