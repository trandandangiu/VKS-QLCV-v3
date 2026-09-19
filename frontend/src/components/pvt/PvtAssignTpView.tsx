import React, { useState } from 'react';
import { 
  CornerDownRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Building2, 
  Search,
  Eye
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { User } from '../../types/auth';

interface PvtAssignTpViewProps {
  dispatches: Dispatch[];
  subordinateRooms: User[];
  allTpUsers: User[];
  onOpenAssignTp: (disp: Dispatch) => void;
  onOpenDetail: (disp: Dispatch) => void;
}

export const PvtAssignTpView: React.FC<PvtAssignTpViewProps> = ({
  dispatches,
  subordinateRooms,
  allTpUsers,
  onOpenAssignTp,
  onOpenDetail
}) => {
  const [filterType, setFilterType] = useState<'UNASSIGNED' | 'ASSIGNED' | 'ALL'>('UNASSIGNED');
  const [searchQuery, setSearchQuery] = useState('');

  // Dispatches not yet assigned to any TP
  const unassignedDispatches = dispatches.filter(d => !d.assignedTpId);
  // Dispatches already assigned to TP
  const assignedDispatches = dispatches.filter(d => !!d.assignedTpId);

  const displayedList = (
    filterType === 'UNASSIGNED'
      ? unassignedDispatches
      : filterType === 'ASSIGNED'
      ? assignedDispatches
      : dispatches
  ).filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.soCongVan || '').toLowerCase().includes(q) ||
      (d.tenCongVan || '').toLowerCase().includes(q) ||
      (d.assignedTpName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <CornerDownRight className="w-4 h-4" />
            </div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Phân Công & Chỉ Đạo Cấp Trưởng Phòng
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Giao việc trực tiếp cho các Trưởng phòng nghiệp vụ thuộc quyền phụ trách ({subordinateRooms.map(r => r.roomCode).join(', ') || 'TP1, TP2'})
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterType('UNASSIGNED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'UNASSIGNED'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Cần Giao Ngay ({unassignedDispatches.length})
          </button>
          <button
            onClick={() => setFilterType('ASSIGNED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'ASSIGNED'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã Phân Công ({assignedDispatches.length})
          </button>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả ({dispatches.length})
          </button>
        </div>
      </div>

      {/* Main content table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công văn cần giao..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-600 bg-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {displayedList.length} văn bản hiển thị
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-12 text-center">STT</th>
                <th className="py-3 px-3.5 w-32">Số Công Văn</th>
                <th className="py-3 px-3.5 min-w-[240px]">Tên Công Văn & Yêu Cầu Viện Trưởng</th>
                <th className="py-3 px-3.5 w-48">Phòng Đang Phân Công</th>
                <th className="py-3 px-3.5 w-32">Hạn Xử Lý</th>
                <th className="py-3 px-3.5 w-24 text-center">Tiến Độ</th>
                <th className="py-3 px-3.5 w-36 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    {filterType === 'UNASSIGNED'
                      ? 'Tuyệt vời! Toàn bộ công văn được giao đều đã được phân công chỉ đạo cho cấp phòng.'
                      : 'Không có công văn nào trong danh sách này.'}
                  </td>
                </tr>
              ) : (
                displayedList.map((disp, idx) => (
                  <tr key={disp.id} className="hover:bg-amber-50/30 transition">
                    <td className="py-3.5 px-3.5 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">
                      {disp.soCongVan}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div
                        onClick={() => onOpenDetail(disp)}
                        className="font-semibold text-slate-900 hover:text-amber-800 cursor-pointer line-clamp-2"
                      >
                        {disp.tenCongVan}
                      </div>
                      {disp.vtChiDao && (
                        <div className="text-[11px] text-rose-800 mt-1 line-clamp-1">
                          <strong>Chỉ đạo của VT:</strong> {disp.vtChiDao}
                        </div>
                      )}
                      {disp.pvtChiDao && (
                        <div className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded mt-1 border border-amber-200 line-clamp-2">
                          <strong>Chỉ đạo của PVT:</strong> {disp.pvtChiDao}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5">
                      {disp.assignedTpName ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-900">
                            {disp.assignedTpName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block text-[11px]">
                          Chưa phân công
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className="font-medium">{disp.hanBaoCaoXuLy || '—'}</span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <span className="font-bold text-slate-800">{disp.tienDo || 0}%</span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenAssignTp(disp)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-2xs transition cursor-pointer"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          {disp.assignedTpId ? 'Giao Lại' : 'Giao TP'}
                        </button>
                        <button
                          onClick={() => onOpenDetail(disp)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
    </div>
  );
};
