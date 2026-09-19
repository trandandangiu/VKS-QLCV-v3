import React from 'react';
import { 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Eye, 
  User, 
  Building2,
  Check
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';

interface PvtPendingVtViewProps {
  dispatches: Dispatch[];
  onOpenSubmitVt: (disp: Dispatch) => void;
  onOpenDetail: (disp: Dispatch) => void;
}

export const PvtPendingVtView: React.FC<PvtPendingVtViewProps> = ({
  dispatches,
  onOpenSubmitVt,
  onOpenDetail
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-800">
              <Send className="w-4 h-4" />
            </div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Hồ Sơ Cấp Phòng Trình — Chờ Phó Viện Trưởng Phê Duyệt Trình VT ({dispatches.length})
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Các dự thảo kết luận, báo cáo tổng hợp, hồ sơ nghiệp vụ do các phòng phụ trách (TP1, TP2) hoàn tất và trình lên
          </p>
        </div>
      </div>

      {/* Cards List */}
      {dispatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs italic">
          Hiện tại không có văn bản nào chờ trình Viện Trưởng. Mọi hồ sơ đã được xử lý hoặc đang được cấp phòng hoàn thiện.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {dispatches.map((disp, idx) => {
            const submittedBy = disp.customFields?.submittedBy || disp.assignedTpName || 'Trưởng phòng';
            const timeAgo = disp.customFields?.submittedTimeAgo || 'Gần đây';

            return (
              <div
                key={disp.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-md transition p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {disp.soCongVan}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {submittedBy} gửi
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {timeAgo}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Tiến độ đạt {disp.tienDo || 90}%
                      </span>
                    </div>

                    <h3 
                      onClick={() => onOpenDetail(disp)}
                      className="text-sm sm:text-base font-bold text-slate-900 hover:text-amber-800 cursor-pointer transition"
                    >
                      {disp.tenCongVan}
                    </h3>

                    {disp.vtChiDao && (
                      <p className="text-xs text-rose-800 bg-rose-50/80 p-2 rounded-xl border border-rose-200">
                        <strong className="font-bold">Yêu cầu ban đầu của Viện Trưởng:</strong> {disp.vtChiDao}
                      </p>
                    )}

                    {disp.baoCaoTienDo && (
                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <strong className="text-slate-900 block mb-1">
                          Nội dung báo cáo kết quả của cấp phòng:
                        </strong>
                        <p className="whitespace-pre-line leading-relaxed text-slate-600">
                          {disp.baoCaoTienDo}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => onOpenSubmitVt(disp)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Ký Duyệt & Trình VT
                    </button>
                    <button
                      onClick={() => onOpenSubmitVt(disp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Yêu Cầu Sửa Đổi
                    </button>
                    <button
                      onClick={() => onOpenDetail(disp)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem toàn bộ hồ sơ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
