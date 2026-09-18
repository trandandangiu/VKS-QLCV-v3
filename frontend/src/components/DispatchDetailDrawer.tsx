import React from 'react';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  Building2, 
  User, 
  Calendar, 
  Flame,
  Paperclip,
  Download
} from 'lucide-react';
import { ColumnDefinition, Dispatch } from '../types/dispatch';

interface DispatchDetailDrawerProps {
  dispatch: Dispatch | null;
  onClose: () => void;
  columns: ColumnDefinition[];
  onUpdate?: (id: string, updates: Partial<Dispatch>) => void;
}

export const DispatchDetailDrawer: React.FC<DispatchDetailDrawerProps> = ({
  dispatch,
  onClose,
  columns
}) => {
  if (!dispatch) return null;

  const customColumns = columns.filter(c => c.isCustom);

  const formatDate = (val?: string) => {
    if (!val) return '(Không rõ)';
    if (typeof val === 'string' && val.includes('-')) {
      const parts = val.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
        {/* Drawer Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between text-white border-b"
          style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold bg-white/20 border border-white/30 px-2.5 py-0.5 rounded text-white">
                {dispatch.soCongVan}
              </span>
              {dispatch.mucDoKhan && dispatch.mucDoKhan !== 'THUONG' && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-700 text-white flex items-center gap-1 border border-rose-800">
                  <Flame className="w-3 h-3" /> {dispatch.mucDoKhan}
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-white mt-1 line-clamp-1">
              Chi tiết công văn gửi Lãnh đạo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {/* Dispatch Title */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              NỘI DUNG
            </label>
            <p className="text-base font-bold text-slate-900 leading-snug">
              {dispatch.tenCongVan}
            </p>
          </div>

          {/* Key dates and deadline */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Ngày gửi:
              </span>
              <p className="text-xs font-semibold text-slate-800">{formatDate(dispatch.ngayGui)}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Ngày phát hành:
              </span>
              <p className="text-xs font-semibold text-slate-800">{formatDate(dispatch.ngayPhatHanh)}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Hạn báo cáo, xử lý:
              </span>
              <p className="text-xs font-semibold text-blue-900">{formatDate(dispatch.hanBaoCaoXuLy)}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Tình trạng thời hạn:
              </span>
              <p className="text-xs font-bold text-slate-900">{dispatch.thoiHanXuLy}</p>
            </div>
          </div>

          {/* Agency & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5" /> Đơn vị ban hành
              </span>
              <p className="font-semibold text-xs text-slate-800">{dispatch.donViBanHanh}</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5" /> Người thực hiện
              </span>
              <p className="font-semibold text-xs text-slate-800">{dispatch.nguoiThucHien || 'Chưa phân công'}</p>
            </div>
          </div>

          {/* Ghi chú */}
          {dispatch.ghiChu && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Ghi chú
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {dispatch.ghiChu}
              </p>
            </div>
          )}

          {/* Custom Fields */}
          {customColumns.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 block">
                Thông tin bổ sung
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {customColumns.map(c => (
                  <div key={c.id} className={`p-2.5 rounded-lg bg-slate-50 border border-slate-200 ${c.type === 'file' ? 'col-span-2' : ''}`}>
                    <span className="text-[11px] text-slate-500 block font-medium">{c.label}</span>
                    {c.type === 'file' ? (
                      <div className="mt-1">
                        {dispatch.customFields?.[c.id] ? (
                          typeof dispatch.customFields[c.id] === 'object' && dispatch.customFields[c.id].dataUrl ? (
                            <a
                              href={dispatch.customFields[c.id].dataUrl}
                              download={dispatch.customFields[c.id].name}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                              <span className="truncate max-w-[240px]">{dispatch.customFields[c.id].name}</span>
                              <Download className="w-3 h-3 text-blue-500" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
                              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                              {typeof dispatch.customFields[c.id] === 'object' ? dispatch.customFields[c.id].name : dispatch.customFields[c.id]}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">(Chưa có tệp)</span>
                        )}
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800">
                        {dispatch.customFields?.[c.id] || '(Chưa có)'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
