import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  User, 
  CheckCircle2, 
  Clock, 
  CornerDownRight 
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { User as AuthUser } from '../../types/auth';
import { DEFAULT_COLUMNS } from '../../constants/columns';
import { exportDispatchesToExcel } from '../../services/excelService';

interface PvtRoomsDispatchesViewProps {
  dispatches: Dispatch[];
  subordinateRooms: AuthUser[];
  onOpenDetail: (disp: Dispatch) => void;
  onOpenAssignTp: (disp: Dispatch) => void;
}

export const PvtRoomsDispatchesView: React.FC<PvtRoomsDispatchesViewProps> = ({
  dispatches,
  subordinateRooms,
  onOpenDetail,
  onOpenAssignTp
}) => {
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Subordinate room IDs or codes
  const subordinateCodes = subordinateRooms.map(r => r.roomCode);
  const subordinateIds = subordinateRooms.map(r => r.id);

  // Filter dispatches that belong to any subordinate room (or currently selected room)
  const filtered = useMemo(() => {
    return dispatches.filter(d => {
      // Must belong to subordinate rooms
      const matchesSubordinate = 
        (d.assignedTpId && subordinateIds.includes(d.assignedTpId)) ||
        (d.assignedTpName && subordinateCodes.some(code => d.assignedTpName?.includes(code))) ||
        (d.donViBanHanh && subordinateCodes.some(code => d.donViBanHanh.includes(code)));

      if (!matchesSubordinate) return false;

      // Filter by specific room if not ALL
      if (selectedRoomCode !== 'ALL') {
        const matchesRoom = 
          d.assignedTpId === selectedRoomCode ||
          (d.assignedTpName && d.assignedTpName.includes(selectedRoomCode)) ||
          (d.donViBanHanh && d.donViBanHanh.includes(selectedRoomCode));
        if (!matchesRoom) return false;
      }

      if (selectedStatus !== 'ALL' && d.trangThai !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const m1 = (d.soCongVan || '').toLowerCase().includes(q);
        const m2 = (d.tenCongVan || '').toLowerCase().includes(q);
        const m3 = (d.nguoiThucHien || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }

      return true;
    });
  }, [dispatches, subordinateIds, subordinateCodes, selectedRoomCode, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Công Văn Của Các Phòng Ban Phụ Trách ({filtered.length})
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tất cả hồ sơ, văn bản đến và đi của các phòng chuyên môn trực thuộc ({subordinateRooms.map(r => r.roomCode).join(', ') || 'TP1, TP2'})
          </p>
        </div>

        <button
          onClick={() => exportDispatchesToExcel(filtered, DEFAULT_COLUMNS)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Xuất Danh Sách
        </button>
      </div>

      {/* Room Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedRoomCode('ALL')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            selectedRoomCode === 'ALL'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          Tất cả phòng phụ trách ({subordinateRooms.length})
        </button>

        {subordinateRooms.map(room => (
          <button
            key={room.id}
            onClick={() => setSelectedRoomCode(room.roomCode)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              selectedRoomCode === room.roomCode
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span>{room.roomCode}: {room.fullName}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo số hiệu, trích yếu, cán bộ..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
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
              <option value="CHO_TP_XU_LY">Chờ TP xử lý</option>
              <option value="CHO_TRINH_VT">Chờ trình VT</option>
              <option value="SAP_DEN_HAN">Sắp đến hạn</option>
              <option value="QUA_HAN">Quá hạn</option>
              <option value="HOAN_THANH">Đã hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-12 text-center">STT</th>
                <th className="py-3 px-3.5 w-32">Số Công Văn</th>
                <th className="py-3 px-3.5 min-w-[260px]">Nội Dung Văn Bản</th>
                <th className="py-3 px-3.5 w-40">Phòng Ban / Cán Bộ</th>
                <th className="py-3 px-3.5 w-32">Hạn Báo Cáo</th>
                <th className="py-3 px-3.5 w-24 text-center">Tiến Độ</th>
                <th className="py-3 px-3.5 w-28 text-center">Trạng Thái</th>
                <th className="py-3 px-3.5 w-24 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                    Không tìm thấy công văn nào của phòng trong danh mục này.
                  </td>
                </tr>
              ) : (
                filtered.map((disp, idx) => (
                  <tr key={disp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3.5 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">
                      {disp.soCongVan}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div
                        onClick={() => onOpenDetail(disp)}
                        className="font-semibold text-slate-900 hover:text-emerald-800 cursor-pointer line-clamp-2"
                      >
                        {disp.tenCongVan}
                      </div>
                      {disp.baoCaoTienDo && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded mt-1 border border-slate-200 line-clamp-1">
                          <strong>Báo cáo:</strong> {disp.baoCaoTienDo}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-slate-900">
                        {disp.assignedTpName || disp.donViBanHanh}
                      </div>
                      {disp.nguoiThucHien && (
                        <span className="text-[11px] text-slate-500 block">
                          Cán bộ: {disp.nguoiThucHien}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      {disp.hanBaoCaoXuLy || '—'}
                    </td>
                    <td className="py-3.5 px-3.5 text-center font-bold">
                      {disp.tienDo || 0}%
                    </td>
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          disp.trangThai === 'HOAN_THANH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : disp.trangThai === 'QUA_HAN'
                            ? 'bg-rose-100 text-rose-800'
                            : disp.trangThai === 'SAP_DEN_HAN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {disp.trangThai || 'DANG_XU_LY'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => onOpenDetail(disp)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
