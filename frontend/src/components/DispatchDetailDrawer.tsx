// src/components/DispatchDetailDrawer.tsx
import React, { useEffect, useState } from 'react';
import { formatDate } from '../utils/format';
import {
  X,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  Flame,
  Paperclip,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { ColumnDefinition, Dispatch } from '../types/dispatch';
import { apiClient } from '../services/apiClient';
import { calculateTimeRemaining } from '../services/excelService';

interface DispatchDetailDrawerProps {
  dispatch: Dispatch | null;
  onClose: () => void;
  columns: ColumnDefinition[];
  onUpdate?: (id: string, updates: Partial<Dispatch>) => void;
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileCategory?: string;
  createdAt?: string;
}

export const DispatchDetailDrawer: React.FC<DispatchDetailDrawerProps> = ({
  dispatch,
  onClose,
  columns,
}) => {
  // ⭐ State cho file đính kèm
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // ⭐ Load file mỗi khi dispatch thay đổi
  useEffect(() => {
    if (!dispatch) {
      setAttachments([]);
      setFilesError(null);
      return;
    }

    let cancelled = false;

    const loadFiles = async () => {
      setLoadingFiles(true);
      setFilesError(null);
      try {
        const items = await apiClient.getAttachments(dispatch.id);
        if (!cancelled) {
          setAttachments(items || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Lỗi load file đính kèm:', err);
          setFilesError(err?.message || 'Không tải được danh sách file');
          setAttachments([]);
        }
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    };

    loadFiles();
    return () => { cancelled = true; };
  }, [dispatch?.id]);

  // ⭐ Download file
  const handleDownload = async (att: Attachment) => {
    setDownloadingId(att.id);
    try {
      await apiClient.downloadAttachment(att.id);
    } catch (err: any) {
      console.error('Lỗi tải file:', err);
      alert('Không tải được file: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setDownloadingId(null);
    }
  };

  // ⭐ Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // ⭐ Đóng khi bấm ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dispatch) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, onClose]);

  if (!dispatch) return null;

  const customColumns = columns.filter(c => c.isCustom);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ Drawer Header ═══ */}
        <div
          className="px-4 sm:px-6 py-4 flex items-center justify-between text-white border-b shrink-0"
          style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold bg-white/20 border border-white/30 px-2.5 py-0.5 rounded text-white">
                {dispatch.soCongVan || '—'}
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
            className="text-white/80 hover:text-white p-1.5 rounded-lg transition cursor-pointer shrink-0 ml-2"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ═══ Drawer Body ═══ */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5 text-sm">

          {/* Nội dung */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              NỘI DUNG
            </label>
            <p className="text-base font-bold text-slate-900 leading-snug">
              {dispatch.tenCongVan || '—'}
            </p>
          </div>

          {/* Ngày tháng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Ngày gửi
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {formatDate(dispatch.ngayGui) || '—'}
              </p>
            </div> */}

            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Ngày phát hành
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {formatDate(dispatch.ngayPhatHanh) || '—'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Hạn báo cáo, xử lý
              </span>
              <p className="text-xs font-semibold text-blue-900">
                {formatDate(dispatch.hanBaoCaoXuLy) || '—'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Tình trạng thời hạn
              </span>
              {(() => {
                // ⭐ Tính số ngày còn lại động
                const { text, status } = calculateTimeRemaining(
                  dispatch.hanBaoCaoXuLy || '',
                  dispatch.trangThai,
                  dispatch.thoiHanXuLy
                );

                // Màu theo trạng thái
                const colorClass =
                  status === 'QUA_HAN' ? 'text-rose-700'
                    : status === 'SAP_DEN_HAN' ? 'text-amber-700'
                      : status === 'HOAN_THANH' ? 'text-emerald-700'
                        : 'text-slate-900';

                return (
                  <p className={`text-xs font-bold ${colorClass}`}>
                    {text}
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Đơn vị & Người thực hiện */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5" /> Đơn vị ban hành
              </span>
              <p className="font-semibold text-xs text-slate-800">
                {dispatch.donViBanHanh || '—'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5" /> Người thực hiện
              </span>
              <p className="font-semibold text-xs text-slate-800">
                {dispatch.nguoiThucHien || 'Chưa phân công'}
              </p>
            </div>
          </div>

          {/* PVT phụ trách */}
          {dispatch.assignedPvtName && (
            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                Lãnh đạo viện xử lý
              </span>
              <p className="font-bold text-xs text-blue-900">
                {dispatch.assignedPvtName}
              </p>
            </div>
          )}

          {/* Đơn vị xử lý (TP) */}
          {dispatch.assignedTpName && (
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                Đơn vị xử lý (TP)
              </span>
              <p className="font-bold text-xs text-emerald-900">
                {dispatch.assignedTpName}
              </p>
            </div>
          )}

          {/* Ghi chú */}
          {dispatch.ghiChu && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Ghi chú
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                {dispatch.ghiChu}
              </p>
            </div>
          )}

          {/* ⭐═══════════════════════════════════════ */}
          {/* ⭐ FILE ĐÍNH KÈM — PHẦN MỚI */}
          {/* ⭐═══════════════════════════════════════ */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                File đính kèm
                {!loadingFiles && attachments.length > 0 && (
                  <span className="ml-1 text-[10px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full">
                    {attachments.length}
                  </span>
                )}
              </h3>
            </div>

            {/* Loading */}
            {loadingFiles && (
              <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Đang tải file...</span>
              </div>
            )}

            {/* Error */}
            {!loadingFiles && filesError && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700">
                ⚠️ {filesError}
              </div>
            )}

            {/* Empty */}
            {!loadingFiles && !filesError && attachments.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <Paperclip className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs italic">Không có file đính kèm</p>
              </div>
            )}

            {/* List files */}
            {!loadingFiles && !filesError && attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map(att => {
                  const isDownloading = downloadingId === att.id;
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-xs font-semibold text-slate-900 truncate"
                            title={att.fileName}
                          >
                            {att.fileName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            {att.fileSize && <span>{formatSize(att.fileSize)}</span>}
                            {att.fileCategory && (
                              <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {att.fileCategory}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownload(att)}
                        disabled={isDownloading}
                        className="shrink-0 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait transition cursor-pointer"
                        title="Tải xuống"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {customColumns.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 block">
                Thông tin bổ sung
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {customColumns.map(c => (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded-lg bg-slate-50 border border-slate-200 ${c.type === 'file' ? 'sm:col-span-2' : ''}`}
                  >
                    <span className="text-[11px] text-slate-500 block font-medium">
                      {c.label}
                    </span>
                    {c.type === 'file' ? (
                      <div className="mt-1">
                        {dispatch.customFields?.[c.id] ? (
                          typeof dispatch.customFields[c.id] === 'object' &&
                            dispatch.customFields[c.id].dataUrl ? (
                            <a
                              href={dispatch.customFields[c.id].dataUrl}
                              download={dispatch.customFields[c.id].name}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                              <span className="truncate max-w-[240px]">
                                {dispatch.customFields[c.id].name}
                              </span>
                              <Download className="w-3 h-3 text-blue-500" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
                              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                              {typeof dispatch.customFields[c.id] === 'object'
                                ? dispatch.customFields[c.id].name
                                : dispatch.customFields[c.id]}
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

        {/* ═══ Drawer Footer ═══ */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
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