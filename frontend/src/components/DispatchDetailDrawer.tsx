// src/components/DispatchDetailDrawer.tsx
import React, { useEffect, useState, useRef } from 'react';
import { formatDate } from '../utils/format';
import {
  X, Clock, AlertTriangle, Building2, User, Calendar, Flame,
  Paperclip, Download, FileText, Loader2, CheckCircle2,
  AlertCircle, Save, Users, Upload, Trash2, Plus,
} from 'lucide-react';
import { ColumnDefinition, Dispatch } from '../types/dispatch';
import { apiClient } from '../services/apiClient';
import { calculateTimeRemaining } from '../services/excelService';

interface DispatchDetailDrawerProps {
  dispatch: Dispatch | null;
  onClose: () => void;
  columns: ColumnDefinition[];
  onUpdate?: (id: string, updates: Partial<Dispatch>) => void | Promise<void>;
  canEdit?: boolean;
  onMarkComplete?: (d: Dispatch) => void | Promise<void>;
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileCategory?: string;
  uploaderName?: string;
  createdAt?: string;
}

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface EditForm {
  soCongVan: string;
  tenCongVan: string;
  ngayGui: string;
  ngayPhatHanh: string;
  hanBaoCaoXuLy: string;
  donViBanHanh: string;
  donViThucHien: string;
  nguoiThucHien: string;
  mucDoKhan: string;
  ghiChu: string;
}

const toDateInput = (val?: string | null): string => {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const MAX_FILE_SIZE_MB = 20;
const ACCEPT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.zip,.rar';

export const DispatchDetailDrawer: React.FC<DispatchDetailDrawerProps> = ({
  dispatch,
  onClose,
  columns,
  onUpdate,
  canEdit = false,
  onMarkComplete,
}) => {
  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>('ORIGINAL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localDispatch, setLocalDispatch] = useState<Dispatch | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [form, setForm] = useState<EditForm>({
    soCongVan: '',
    tenCongVan: '',
    ngayGui: '',
    ngayPhatHanh: '',
    hanBaoCaoXuLy: '',
    donViBanHanh: '',
    donViThucHien: '',
    nguoiThucHien: '',
    mucDoKhan: 'THUONG',
    ghiChu: '',
  });

  const [isDirty, setIsDirty] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ═══════════════════════════════════════════
  // SYNC localDispatch + form
  // ═══════════════════════════════════════════
  useEffect(() => {
    setLocalDispatch(dispatch);
    setIsDirty(false);

    if (dispatch) {
      const currentDeptName =
        (dispatch as any).donViThucHien ||
        dispatch.assignedTpName ||
        '';

      setForm({
        soCongVan: dispatch.soCongVan || '',
        tenCongVan: dispatch.tenCongVan || '',
        ngayGui: toDateInput(dispatch.ngayGui),
        ngayPhatHanh: toDateInput(dispatch.ngayPhatHanh),
        hanBaoCaoXuLy: toDateInput(dispatch.hanBaoCaoXuLy),
        donViBanHanh: dispatch.donViBanHanh || '',
        donViThucHien: currentDeptName,
        nguoiThucHien: dispatch.nguoiThucHien || '',
        mucDoKhan: dispatch.mucDoKhan || 'THUONG',
        ghiChu: dispatch.ghiChu || '',
      });
    }
  }, [dispatch?.id]);

  // ═══════════════════════════════════════════
  // LOAD DEPARTMENTS
  // ═══════════════════════════════════════════
  useEffect(() => {
    if (!dispatch) return;
    (async () => {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (data.success && Array.isArray(data.departments)) {
          setDepartments(
            data.departments
              .filter((d: any) => d.active !== false)
              .map((d: any) => ({ id: d.id, code: d.code, name: d.name }))
          );
        }
      } catch (e) {
        console.error('Lỗi load departments:', e);
      }
    })();
  }, [dispatch?.id]);

  // ═══════════════════════════════════════════
  // LOAD ATTACHMENTS
  // ═══════════════════════════════════════════
  const loadAttachments = async (dispatchId: string) => {
    setLoadingFiles(true);
    setFilesError(null);
    try {
      const items = await apiClient.getAttachments(dispatchId);
      setAttachments(items || []);
    } catch (err: any) {
      setFilesError(err?.message || 'Không tải được danh sách file');
      setAttachments([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (!dispatch) {
      setAttachments([]);
      setFilesError(null);
      return;
    }
    loadAttachments(dispatch.id);
  }, [dispatch?.id]);

  // ESC để đóng
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dispatch) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, onClose]);

  if (!dispatch || !localDispatch) return null;

  const d = localDispatch;
  const customColumns = columns.filter(c => c.isCustom);
  const isCompleted = d.trangThai === 'HOAN_THANH';

  // ═══════════════════════════════════════════
  // FORM HANDLERS
  // ═══════════════════════════════════════════
  const updateForm = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    if (!form.soCongVan.trim()) {
      showToast('Vui lòng nhập số công văn', 'error');
      return;
    }
    if (!form.tenCongVan.trim()) {
      showToast('Vui lòng nhập nội dung công văn', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Dispatch & { donViThucHien?: string }> = {
        soCongVan: form.soCongVan.trim(),
        tenCongVan: form.tenCongVan.trim(),
        ngayGui: form.ngayGui || undefined,
        ngayPhatHanh: form.ngayPhatHanh || undefined,
        hanBaoCaoXuLy: form.hanBaoCaoXuLy || undefined,
        donViBanHanh: form.donViBanHanh.trim(),
        nguoiThucHien: form.nguoiThucHien.trim(),
        mucDoKhan: form.mucDoKhan as any,
        ghiChu: form.ghiChu,
      };

      if (form.donViThucHien) {
        (payload as any).donViThucHien = form.donViThucHien;
        const matchedDept = departments.find(
          dep => dep.name === form.donViThucHien || dep.code === form.donViThucHien
        );
        if (matchedDept) {
          payload.assignedTpName = matchedDept.name;
        }
      }

      await onUpdate(dispatch.id, payload);

      setLocalDispatch(prev => prev ? { ...prev, ...payload } : prev);
      setIsDirty(false);
      showToast('✅ Đã lưu vào cơ sở dữ liệu', 'success');

      setTimeout(() => onClose(), 400);
    } catch (err: any) {
      showToast('❌ Lỗi lưu: ' + (err?.message || ''), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!onMarkComplete) return;
    if (!window.confirm(`Đánh dấu HOÀN THÀNH công văn "${d.soCongVan}"?`)) return;

    setIsCompleting(true);
    try {
      await onMarkComplete(d);
      showToast('✅ Đã đánh dấu hoàn thành', 'success');
      setLocalDispatch(prev => prev ? { ...prev, trangThai: 'HOAN_THANH' } : prev);
    } catch (err: any) {
      showToast('❌ Lỗi: ' + (err?.message || ''), 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // ═══════════════════════════════════════════
  // ⭐ UPLOAD FILE
  // ═══════════════════════════════════════════
  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!canEdit) {
      showToast('Bạn không có quyền tải file lên', 'error');
      return;
    }

    const arr = Array.from(files);
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    // Lọc file hợp lệ
    const validFiles: File[] = [];
    for (const f of arr) {
      if (f.size > maxBytes) {
        showToast(`File "${f.name}" vượt quá ${MAX_FILE_SIZE_MB}MB`, 'error');
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    setUploadingCount(validFiles.length);
    let successCount = 0;
    let failCount = 0;

    for (const file of validFiles) {
      try {
        const res = await apiClient.uploadAttachment(
          dispatch.id,
          file,
          uploadCategory
        );
        if (res?.success) {
          successCount++;
          // Thêm vào danh sách ngay lập tức
          if (res.attachment) {
            setAttachments(prev => [res.attachment, ...prev]);
          }
        } else {
          failCount++;
        }
      } catch (err: any) {
        console.error('Lỗi upload file:', file.name, err);
        failCount++;
      }
    }

    setUploadingCount(0);

    if (successCount > 0 && failCount === 0) {
      showToast(`✅ Đã tải lên ${successCount} file`, 'success');
    } else if (successCount > 0 && failCount > 0) {
      showToast(`Tải lên ${successCount} file, ${failCount} file lỗi`, 'info');
    } else {
      showToast('❌ Không thể tải file lên', 'error');
    }

    // Reload lại để đồng bộ
    await loadAttachments(dispatch.id);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleUploadFiles(e.target.files);
      e.target.value = ''; // reset
    }
  };

  // ⭐ DRAG & DROP
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canEdit) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canEdit) return;
    if (e.dataTransfer.files?.length) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // ⭐ XÓA FILE
  const handleDeleteAttachment = async (att: Attachment) => {
    if (!canEdit) return;
    if (!window.confirm(`Xóa file "${att.fileName}"?`)) return;

    try {
      const ok = await apiClient.deleteAttachment(att.id);
      if (ok) {
        setAttachments(prev => prev.filter(a => a.id !== att.id));
        showToast('✅ Đã xóa file', 'success');
      } else {
        showToast('❌ Không thể xóa file', 'error');
      }
    } catch (err: any) {
      showToast('❌ Lỗi: ' + (err?.message || ''), 'error');
    }
  };

  const handleDownload = async (att: Attachment) => {
    setDownloadingId(att.id);
    try {
      await apiClient.downloadAttachment(att.id);
    } catch (err: any) {
      showToast('Không tải được file: ' + (err?.message || ''), 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // ═══════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════
  const FieldLabel: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; required?: boolean }> = ({
    icon, children, required,
  }) => (
    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1 mb-1">
      {icon} {children}
      {required && <span className="text-rose-500">*</span>}
    </label>
  );

  const inputClass =
    'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed';

  const isUploading = uploadingCount > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end"
        onClick={onClose}
      >
        <div
          className="bg-white w-full sm:max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div
            className="px-4 sm:px-6 py-4 flex items-center justify-between text-white border-b shrink-0"
            style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold bg-white/20 border border-white/30 px-2.5 py-0.5 rounded text-white">
                  {d.soCongVan || '—'}
                </span>
                {d.mucDoKhan && d.mucDoKhan !== 'THUONG' && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-700 text-white flex items-center gap-1 border border-rose-800">
                    <Flame className="w-3 h-3" /> {d.mucDoKhan}
                  </span>
                )}
                {isDirty && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950 border border-amber-300">
                    ● Chưa lưu
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

          {/* BODY */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-sm">

            {/* Số công văn */}
            <div>
              <FieldLabel required>Số công văn</FieldLabel>
              <input
                type="text"
                value={form.soCongVan}
                onChange={e => updateForm('soCongVan', e.target.value)}
                disabled={!canEdit}
                className={inputClass}
                placeholder="VD: 142/BC-UBND"
              />
            </div>

            {/* Nội dung */}
            <div>
              <FieldLabel required>Nội dung công văn</FieldLabel>
              <textarea
                rows={3}
                value={form.tenCongVan}
                onChange={e => updateForm('tenCongVan', e.target.value)}
                disabled={!canEdit}
                className={inputClass}
                placeholder="Trích yếu nội dung công văn..."
              />
            </div>

            {/* Ngày tháng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <FieldLabel icon={<Calendar className="w-3 h-3" />}>Ngày gửi</FieldLabel>
                <input
                  type="date"
                  value={form.ngayGui}
                  onChange={e => updateForm('ngayGui', e.target.value)}
                  disabled={!canEdit}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel icon={<Calendar className="w-3 h-3" />}>Ngày phát hành</FieldLabel>
                <input
                  type="date"
                  value={form.ngayPhatHanh}
                  onChange={e => updateForm('ngayPhatHanh', e.target.value)}
                  disabled={!canEdit}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel icon={<Clock className="w-3 h-3 text-blue-600" />}>
                  Hạn báo cáo, xử lý
                </FieldLabel>
                <input
                  type="date"
                  value={form.hanBaoCaoXuLy}
                  onChange={e => updateForm('hanBaoCaoXuLy', e.target.value)}
                  disabled={!canEdit}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel icon={<AlertTriangle className="w-3 h-3 text-amber-500" />}>
                  Tình trạng thời hạn
                </FieldLabel>
                {(() => {
                  const { text, status } = calculateTimeRemaining(
                    form.hanBaoCaoXuLy,
                    d.trangThai,
                    d.thoiHanXuLy
                  );
                  const colorClass =
                    status === 'QUA_HAN' ? 'text-rose-700'
                      : status === 'SAP_DEN_HAN' ? 'text-amber-700'
                        : status === 'HOAN_THANH' ? 'text-emerald-700'
                          : 'text-slate-900';
                  return <p className={`text-xs font-bold pt-1 ${colorClass}`}>{text}</p>;
                })()}
              </div>
            </div>

            {/* Mức độ khẩn */}
            <div>
              <FieldLabel icon={<Flame className="w-3 h-3 text-rose-500" />}>
                Mức độ khẩn
              </FieldLabel>
              <select
                value={form.mucDoKhan}
                onChange={e => updateForm('mucDoKhan', e.target.value)}
                disabled={!canEdit}
                className={inputClass}
              >
                <option value="THUONG">Thường</option>
                <option value="KHAN">Khẩn</option>
                <option value="THUONG_KHAN">Thượng khẩn</option>
                <option value="HOA_TOC">Hỏa tốc</option>
              </select>
            </div>

            {/* ĐƠN VỊ BAN HÀNH */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
              <FieldLabel icon={<Building2 className="w-3.5 h-3.5 text-blue-600" />}>
                Đơn vị ban hành
              </FieldLabel>
              <input
                type="text"
                value={form.donViBanHanh}
                onChange={e => updateForm('donViBanHanh', e.target.value)}
                disabled={!canEdit}
                className={inputClass}
                placeholder="VD: UBND Tỉnh, Bộ Tư pháp, VKSND Tối cao..."
              />
              <p className="text-[10px] text-blue-700/70 mt-1 italic">
                Nơi gửi công văn đến (nhập tự do)
              </p>
            </div>

            {/* ĐƠN VỊ THỰC HIỆN */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <FieldLabel icon={<Users className="w-3.5 h-3.5 text-emerald-600" />}>
                Đơn vị thực hiện
              </FieldLabel>
              <select
                value={form.donViThucHien}
                onChange={e => updateForm('donViThucHien', e.target.value)}
                disabled={!canEdit}
                className={inputClass}
              >
                <option value="">-- Chưa phân công --</option>
                {departments.map(dep => (
                  <option key={dep.id} value={dep.name}>
                    {dep.name} ({dep.code})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-emerald-700/70 mt-1 italic">
                Phòng ban / đơn vị chịu trách nhiệm xử lý
              </p>
            </div>

            {/* Người thực hiện */}
            <div>
              <FieldLabel icon={<User className="w-3.5 h-3.5" />}>
                Người thực hiện
              </FieldLabel>
              <input
                type="text"
                value={form.nguoiThucHien}
                onChange={e => updateForm('nguoiThucHien', e.target.value)}
                disabled={!canEdit}
                className={inputClass}
                placeholder="Họ tên cán bộ / KSV thụ lý"
              />
            </div>

            {/* PVT (read-only) */}
            {d.assignedPvtName && (
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                  Lãnh đạo viện xử lý
                </span>
                <p className="font-bold text-xs text-blue-900">{d.assignedPvtName}</p>
              </div>
            )}

            {/* Ghi chú */}
            <div>
              <FieldLabel>Ghi chú</FieldLabel>
              <textarea
                rows={3}
                value={form.ghiChu}
                onChange={e => updateForm('ghiChu', e.target.value)}
                disabled={!canEdit}
                className={inputClass}
                placeholder="Ghi chú xử lý..."
              />
            </div>

            {/* ═══════════════════════════════════════════
                ⭐ FILE ĐÍNH KÈM — ĐÃ THÊM UPLOAD
                ═══════════════════════════════════════════ */}
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

                {/* ⭐ Category select + nút chọn file */}
                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={uploadCategory}
                      onChange={e => setUploadCategory(e.target.value)}
                      className="px-2 py-1 text-[10px] font-bold border border-slate-300 rounded-lg bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ORIGINAL">Bản gốc</option>
                      <option value="DRAFT">Dự thảo</option>
                      <option value="REPORT">Báo cáo</option>
                      <option value="APPROVAL">Phê duyệt</option>
                      <option value="OTHER">Khác</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
                      title="Chọn file để tải lên"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Đang tải ({uploadingCount})
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Tải file lên
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ⭐ Drag & Drop zone */}
              {canEdit && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mb-3 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
                      : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40'
                  }`}
                >
                  <Upload className={`w-6 h-6 mx-auto mb-1.5 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <p className="text-xs font-bold text-slate-700">
                    {isDragging ? '📥 Thả file vào đây' : 'Kéo thả file hoặc bấm để chọn'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Hỗ trợ PDF, Word, Excel, ảnh — Tối đa {MAX_FILE_SIZE_MB}MB/file
                  </p>
                </div>
              )}

              {/* Hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_TYPES}
                onChange={handleFileInputChange}
                className="hidden"
              />

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
                  <p className="text-xs italic">Chưa có file đính kèm</p>
                </div>
              )}

              {/* ⭐ Danh sách file */}
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
                            <div className="text-xs font-semibold text-slate-900 truncate" title={att.fileName}>
                              {att.fileName}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
                              {att.fileSize && <span>{formatSize(att.fileSize)}</span>}
                              {att.fileCategory && (
                                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  {att.fileCategory}
                                </span>
                              )}
                              {att.uploaderName && (
                                <span className="text-slate-400">• {att.uploaderName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Nút tải về */}
                          <button
                            onClick={() => handleDownload(att)}
                            disabled={isDownloading}
                            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                            title="Tải xuống"
                          >
                            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          </button>

                          {/* ⭐ Nút xóa file */}
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteAttachment(att)}
                              className="p-1.5 rounded-lg bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer"
                              title="Xóa file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
                    <div key={c.id} className={`p-2.5 rounded-lg bg-slate-50 border border-slate-200 ${c.type === 'file' ? 'sm:col-span-2' : ''}`}>
                      <span className="text-[11px] text-slate-500 block font-medium">{c.label}</span>
                      <span className="font-semibold text-slate-800">
                        {d.customFields?.[c.id] || '(Chưa có)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {canEdit && !isCompleted && onMarkComplete && (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={isCompleting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isCompleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Đánh dấu hoàn thành
                </button>
              )}

              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã hoàn thành
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-200 transition cursor-pointer border border-slate-300"
              >
                Đóng
              </button>

              {canEdit && onUpdate && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!isDirty ? 'Chưa có thay đổi' : 'Lưu vào cơ sở dữ liệu'}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Lưu
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] animate-fadeIn">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-blue-600 text-white border-blue-700'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default DispatchDetailDrawer;