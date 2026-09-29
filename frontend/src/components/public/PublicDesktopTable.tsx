// src/components/public/PublicDesktopTable.tsx
import React from 'react';
import { formatDate } from '../../utils/format';
import {
  Clock, AlertTriangle, CheckCircle2, User, Building2,
  CornerDownRight, Paperclip,
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { resolveDispatchStatus } from '../../services/excelService';

interface Props {
  dispatches: Dispatch[];
  currentPage: number;
  pageSize: number;
  selectedPvtId: string | null;
  onSelectDispatch?: (d: Dispatch) => void;

  // ⭐ CHỈ GIỮ CỜ HIỂN THỊ FILE (nếu cần)
  showFileColumn?: boolean;
  onViewFiles?: (d: Dispatch) => void;
}

export const PublicDesktopTable: React.FC<Props> = ({
  dispatches,
  currentPage,
  pageSize,
  selectedPvtId,
  onSelectDispatch,
  showFileColumn = true,
  onViewFiles,
}) => {
  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);
    const text = disp.thoiHanXuLy || '';

    if (status === 'HOAN_THANH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{text || 'Hoàn thành'}</span>
        </span>
      );
    }
    if (status === 'QUA_HAN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{text || 'Quá hạn'}</span>
        </span>
      );
    }
    if (status === 'SAP_DEN_HAN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{text || 'Sắp hạn'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span>{text || 'Đang xử lý'}</span>
      </span>
    );
  };

  const renderDonViBanHanh = (disp: Dispatch) => {
    if (!disp.donViBanHanh) {
      return <span className="text-slate-300 italic text-xs">—</span>;
    }
    return (
      <div className="flex items-start gap-1.5 min-w-0">
        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span className="text-[12px] text-slate-800 font-medium leading-snug break-words">
          {disp.donViBanHanh}
        </span>
      </div>
    );
  };

  const renderDonViThucHien = (disp: Dispatch) => {
    const hasTp = !!disp.assignedTpName;
    const hasPvt = !!disp.assignedPvtName;
    const hasNguoi = !!disp.nguoiThucHien;

    if (!hasTp && !hasPvt && !hasNguoi) {
      return (
        <span className="text-slate-300 italic text-[11px]">Chưa phân công</span>
      );
    }

    return (
      <div className="space-y-1 min-w-0">
        {/* ⭐ 1. PVT — TRÊN CÙNG */}
        {hasPvt && (
          <div className="flex items-start gap-1 min-w-0">
            <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            </span>
            <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 leading-tight break-words">
              PVT:{' '}
              {disp.assignedPvtName!
                .replace(/^Đ\/c\s+/, '')
                .replace(/^Đồng chí\s+/i, '')
                .trim()}
            </span>
          </div>
        )}

        {/* ⭐ 2. TP — DƯỚI PVT */}
        {hasTp && (
          <div className="flex items-start gap-1 min-w-0 ml-4">
            <CornerDownRight className="w-3 h-3 text-emerald-600 shrink-0 mt-1" />
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-tight break-words">
              TP:{' '}
              {disp.assignedTpName!
                .replace(/^Đ\/c\s+/, '')
                .replace(/^Đồng chí\s+/i, '')
                .trim()}
            </span>
          </div>
        )}

        {/* ⭐ 3. Người thực hiện */}
        {hasNguoi && (
          <div className="flex items-start gap-1 min-w-0 ml-4">
            <User className="w-3 h-3 text-slate-400 shrink-0 mt-1" />
            <span className="text-[10px] text-slate-600 font-medium leading-tight break-words italic">
              {disp.nguoiThucHien}
            </span>
          </div>
        )}
      </div>
    );
  };

  // ⭐ Tổng số cột data (không tính checkbox)
  const baseCols = 7;   // STT, Số VB, Ngày, Trích yếu, ĐV ban hành, ĐV thực hiện, Thời hạn, Trạng thái
  // Thực tế: 8 cột (STT, Số VB, Ngày, Trích yếu, ĐVBH, ĐVTH, Thời hạn, Trạng thái)
  const totalCols = 8 + (showFileColumn ? 1 : 0);

  return (
    <div
      id="public-table-scroll-container"
      className="overflow-y-auto max-h-[calc(100vh-320px)] border-t border-slate-200"
    >
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="sticky top-0 z-10 shadow-2xs">
          {/* HÀNG 1 */}
          <tr className="bg-[#b9d1ea] text-[#0f2942] border-b-2 border-slate-400">
            <th
              rowSpan={2}
              className="w-[4%] px-2 py-3 text-xs font-bold uppercase tracking-wide border-r-2 border-slate-400 select-none text-center align-middle"
            >
              STT
            </th>

            <th
              rowSpan={2}
              className="w-[9%] px-2 py-3 text-xs font-bold uppercase tracking-wide border-r-2 border-slate-400 select-none text-center align-middle"
            >
              Số / Ký hiệu VB
            </th>

            <th
              rowSpan={2}
              className="w-[9%] px-2 py-3 text-xs font-bold uppercase tracking-wide border-r-2 border-slate-400 select-none text-center align-middle"
            >
              Ngày tiếp nhận
            </th>

            <th
              rowSpan={2}
              className="w-[24%] px-2 py-3 text-xs font-bold uppercase tracking-wide border-r-2 border-slate-400 select-none text-center align-middle"
            >
              Trích yếu nội dung
            </th>

            <th
              colSpan={2}
              className="px-2 py-2 text-xs font-bold uppercase tracking-wide border-r-2 border-b-2 border-slate-400 select-none text-center"
            >
              Đơn vị
            </th>

            <th
              rowSpan={2}
              className="w-[10%] px-2 py-3 text-xs font-bold uppercase tracking-wide border-r-2 border-slate-400 select-none text-center align-middle"
            >
              Thời hạn hoàn thành
            </th>

            <th
              rowSpan={2}
              className="w-[11%] px-2 py-3 text-xs font-bold uppercase tracking-wide border-r-2 border-slate-400 select-none text-center align-middle"
            >
              Trạng thái tiến độ
            </th>

            {showFileColumn && (
              <th
                rowSpan={2}
                className="w-[9%] px-2 py-3 text-xs font-bold uppercase tracking-wide select-none text-center align-middle"
              >
                File
              </th>
            )}
          </tr>

          {/* HÀNG 2 */}
          <tr className="bg-[#b9d1ea] text-[#0f2942]">
            <th className="w-[10%] px-2 py-2 text-[11px] font-bold uppercase tracking-wide border-r border-slate-400 select-none text-center">
              Đơn vị ban hành
            </th>
            <th className="w-[10%] px-2 py-2 text-[11px] font-bold uppercase tracking-wide border-r-2 border-slate-400 select-none text-center">
              Đơn vị thực hiện
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {dispatches.length === 0 ? (
            <tr>
              <td
                colSpan={totalCols}
                className="text-center py-20 px-4 text-slate-400 bg-slate-50/40"
              >
                <p className="text-base text-slate-400 font-medium">
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
              // ⭐ Đếm từ field attachments (nếu có) hoặc _count
              const fileCount =
                (Array.isArray((disp as any).attachments)
                  ? (disp as any).attachments.filter((a: any) => !a.isDeleted).length
                  : null) ??
                (disp as any)._count?.attachments ??
                0;

              return (
                <tr
                  key={disp.id || idx}
                  onClick={() => onSelectDispatch?.(disp)}
                  className={`transition-colors cursor-pointer ${isOverdue
                    ? 'bg-rose-50/30 hover:bg-rose-50/60'
                    : isCompleted
                      ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                      : idx % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/40 hover:bg-slate-100/60'
                    }`}
                  title="Bấm để xem chi tiết"
                >
                  {/* STT */}
                  <td className="px-2 py-4 text-center border-r border-slate-100 text-slate-600 font-bold text-sm align-middle">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>

                  {/* Số / Ký hiệu VB */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle">
                    <span className="font-mono font-bold text-[13px] text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block break-all">
                      {disp.soCongVan || '—'}
                    </span>
                  </td>

                  {/* Ngày tiếp nhận */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle">
                    <span className="text-[13px] text-slate-800 font-medium">
                      {formatDate(disp.ngayGui) || '—'}
                    </span>
                  </td>

                  {/* Trích yếu nội dung */}
                  <td className="px-3 py-4 border-r border-slate-100 align-middle">
                    <p
                      className="font-semibold text-slate-900 text-sm leading-snug break-words"
                      title={disp.tenCongVan}
                    >
                      {disp.tenCongVan || '—'}
                    </p>
                  </td>

                  {/* Đơn vị ban hành */}
                  <td className="px-2 py-4 border-r border-slate-200 align-top">
                    {renderDonViBanHanh(disp)}
                  </td>

                  {/* Đơn vị thực hiện */}
                  <td className="px-2 py-4 border-r-2 border-slate-300 align-top">
                    {renderDonViThucHien(disp)}
                  </td>

                  {/* Thời hạn hoàn thành */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle text-center">
                    <span
                      className={`text-[13px] font-bold ${isOverdue
                        ? 'text-rose-700'
                        : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-800'
                        }`}
                    >
                      {formatDate(disp.hanBaoCaoXuLy) || '—'}
                    </span>
                  </td>

                  {/* Trạng thái tiến độ */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle text-center">
                    <div className="flex justify-center">{renderStatusBadge(disp)}</div>
                  </td>

                  {/* File — chỉ hiện nếu showFileColumn */}
                  {showFileColumn && (
                    <td className="px-2 py-4 align-middle text-center">
                      {fileCount === 0 ? (
                        <span className="text-slate-300 text-[10px]">—</span>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onViewFiles?.(disp);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold hover:bg-indigo-100 transition cursor-pointer whitespace-nowrap"
                          title="Bấm để xem file"
                        >
                          <Paperclip className="w-3 h-3" />
                          {fileCount}
                        </button>
                      )}
                    </td>
                  )}
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