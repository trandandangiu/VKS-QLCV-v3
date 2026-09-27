// src/components/public/PublicDesktopTable.tsx
import React from 'react';
import { formatDate } from '../../utils/format';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { resolveDispatchStatus } from '../../services/excelService';

interface Props {
  dispatches: Dispatch[];
  currentPage: number;
  pageSize: number;
  selectedPvtId: string | null;
  onSelectDispatch?: (d: Dispatch) => void;
}

export const PublicDesktopTable: React.FC<Props> = ({
  dispatches,
  currentPage,
  pageSize,
  selectedPvtId,
  onSelectDispatch,
}) => {
  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);
    const text = disp.thoiHanXuLy || '';

    if (status === 'HOAN_THANH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {text || 'Hoàn thành'}
        </span>
      );
    }
    if (status === 'QUA_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          {text || 'Quá hạn'}
        </span>
      );
    }
    if (status === 'SAP_DEN_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <Clock className="w-3 h-3 text-amber-600" />
          {text || 'Sắp đến hạn'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3 h-3 text-blue-500" />
        {text || 'Đang xử lý'}
      </span>
    );
  };

  return (
    <div
      id="public-table-scroll-container"
      className="overflow-x-auto overflow-y-auto h-[700px] lg:h-[800px] border-t border-slate-200"
    >
      <table className="w-full text-left border-collapse min-w-[1500px]">
        <thead className="sticky top-0 z-10 shadow-2xs">
          <tr className="bg-[#b9d1ea] text-[#0f2942] border-b-2 border-slate-400">
            {[
              'STT', 'SỐ CÔNG VĂN', 'NGÀY GỬI', 'TÊN CÔNG VĂN', 'HẠN BÁO CÁO',
              'THỜI HẠN XỬ LÝ', 'ĐƠN VỊ BAN HÀNH', 'NGƯỜI THỰC HIỆN', 'GHI CHÚ',
            ].map(h => (
              <th
                key={h}
                className="px-3.5 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center last:border-r-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
          {dispatches.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="text-center py-28 px-4 text-slate-400 bg-slate-50/40"
              >
                <p className="text-sm text-slate-400 font-medium">
                  {selectedPvtId
                    ? 'Không có công văn nào cho lãnh đạo này'
                    : 'Hiện không có công văn nào để hiển thị'}
                </p>
              </td>
            </tr>
          ) : (
            dispatches.map((disp, idx) => {
              const status = resolveDispatchStatus(disp);
              const isOverdue = status === 'QUA_HAN';
              const isCompleted = status === 'HOAN_THANH';

              return (
                <tr
                  key={disp.id || idx}
                  onClick={() => onSelectDispatch?.(disp)}
                  className={`transition-colors cursor-pointer ${
                    isOverdue
                      ? 'bg-rose-50/30 hover:bg-rose-50/60'
                      : isCompleted
                      ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                      : idx % 2 === 0
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-slate-50/40 hover:bg-slate-100/60'
                  }`}
                >
                  <td className="px-3 py-5 sm:py-6 text-center border-r border-slate-100 text-slate-600 font-semibold">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                    <span className="font-semibold text-xs text-slate-900 bg-slate-100/90 px-2 py-1 rounded border border-slate-200 inline-block w-fit">
                      {disp.soCongVan || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                    <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                      {formatDate(disp.ngayGui)}
                    </span>
                  </td>
                  <td className="px-5 py-5 sm:py-6 border-r border-slate-100 min-w-[320px] max-w-[500px]">
                    <span
                      className="text-left font-semibold text-slate-900 text-sm leading-relaxed block"
                      title={disp.tenCongVan}
                    >
                      {disp.tenCongVan || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                    <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                      {formatDate(disp.hanBaoCaoXuLy)}
                    </span>
                  </td>
                  <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-center">
                    {renderStatusBadge(disp)}
                  </td>
                  <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                    <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium text-xs whitespace-nowrap">
                      {disp.donViBanHanh || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                    <span className="font-medium text-slate-800 text-xs whitespace-nowrap">
                      {disp.nguoiThucHien || 'Chưa giao'}
                    </span>
                  </td>
                  <td className="px-4 py-5 sm:py-6 min-w-[180px]">
                    <div className="text-xs text-slate-600 leading-relaxed" title={disp.ghiChu}>
                      {disp.ghiChu || <span className="text-slate-300 italic">-</span>}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PublicDesktopTable;