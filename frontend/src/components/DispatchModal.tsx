// src/components/DispatchModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Paperclip, Upload } from 'lucide-react';
import { ColumnDefinition, Dispatch } from '../types/dispatch';
import { calculateTimeRemaining, resolveDispatchStatus } from '../services/excelService';
import { AttachmentUploader, AttachmentItem } from './attachments/AttachmentUploader';
import { apiClient } from '../services/apiClient';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatchToEdit: Dispatch | null;
  columns: ColumnDefinition[];
  onSave: (data: any) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  dispatchToEdit,
  columns,
  onSave,
}) => {
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Dispatch>>({
    ngayGui: new Date().toISOString().slice(0, 10),
    soCongVan: '',
    ngayPhatHanh: new Date().toISOString().slice(0, 10),
    tenCongVan: '',
    hanBaoCaoXuLy: '',
    thoiHanXuLy: '',
    donViBanHanh: '',
    nguoiThucHien: '',
    ghiChu: '',
    trangThai: 'DANG_XU_LY',
    mucDoKhan: 'THUONG',
    tienDo: 0,
    customFields: {}
  });

  useEffect(() => {
    // Reset attachments khi đóng/mở modal
    if (!isOpen) {
      setAttachments([]);
      return;
    }

    if (dispatchToEdit) {
      setFormData({
        ...dispatchToEdit,
        customFields: dispatchToEdit.customFields ? { ...dispatchToEdit.customFields } : {}
      });
      // Load file đã có của dispatch này
      apiClient.getAttachments(dispatchToEdit.id).then(items => {
        setAttachments(items.map((a: any) => ({
          id: a.id,
          fileName: a.fileName,
          fileSize: a.fileSize,
          fileType: a.fileType,
          fileCategory: a.fileCategory,
        })));
      });
    } else {
      setFormData({
        ngayGui: new Date().toISOString().slice(0, 10),
        soCongVan: '',
        ngayPhatHanh: new Date().toISOString().slice(0, 10),
        tenCongVan: '',
        hanBaoCaoXuLy: '',
        thoiHanXuLy: '',
        donViBanHanh: '',
        nguoiThucHien: '',
        ghiChu: '',
        trangThai: 'DANG_XU_LY',
        mucDoKhan: 'THUONG',
        tienDo: 0,
        customFields: {}
      });
    }
  }, [dispatchToEdit, isOpen]);

  if (!isOpen) return null;

  const customColumns = columns.filter(c => c.isCustom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const resolvedStatus = resolveDispatchStatus(formData);
      const timing = calculateTimeRemaining(
        formData.hanBaoCaoXuLy || '',
        resolvedStatus,
        formData.thoiHanXuLy
      );

      // Gọi onSave → parent xử lý tạo dispatch + trả về id
      await onSave({
        ...formData,
        trangThai: resolvedStatus,
        thoiHanXuLy: formData.thoiHanXuLy || timing.text,
        __attachments: attachments,   // Truyền danh sách file pending
      });

      onClose();
    } catch (err) {
      console.error('Lỗi submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [key]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header đỏ */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between"
          style={{ backgroundColor: '#B71C1C' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {dispatchToEdit ? 'Chỉnh sửa công việc' : 'Thêm mới công việc gửi Lãnh đạo'}
              </h2>
              <p className="text-xs text-red-100">
                {dispatchToEdit ? `Đang sửa: ${dispatchToEdit.soCongVan}` : 'Nhập thông tin công việc mới'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="NGÀY GỬI" required>
              <input
                type="date"
                value={formData.ngayGui || ''}
                onChange={e => setFormData({ ...formData, ngayGui: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>

            <Field label="SỐ CÔNG VIỆC" required>
              <input
                type="text"
                value={formData.soCongVan || ''}
                onChange={e => setFormData({ ...formData, soCongVan: e.target.value })}
                placeholder="142/BC-UBND"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>

            <Field label="NGÀY PHÁT HÀNH">
              <input
                type="date"
                value={formData.ngayPhatHanh || ''}
                onChange={e => setFormData({ ...formData, ngayPhatHanh: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>

            <Field label="HẠN BÁO CÁO, XỬ LÝ" required>
              <input
                type="date"
                value={formData.hanBaoCaoXuLy || ''}
                onChange={e => setFormData({ ...formData, hanBaoCaoXuLy: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>

            <Field label="THỜI HẠN XỬ LÝ">
              <input
                type="text"
                value={formData.thoiHanXuLy || ''}
                onChange={e => setFormData({ ...formData, thoiHanXuLy: e.target.value })}
                placeholder="Tự động tính từ hạn báo cáo..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>

            <Field label="TRẠNG THÁI XỬ LÝ">
              <select
                value={formData.trangThai || 'DANG_XU_LY'}
                onChange={e => setFormData({ ...formData, trangThai: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              >
                <option value="DANG_XU_LY">Đang xử lý</option>
                <option value="HOAN_THANH">Đã hoàn thành</option>
                <option value="QUA_HAN">Quá hạn</option>
              </select>
            </Field>
          </div>

          <Field label="TÊN CÔNG VIỆC" required>
            <textarea
              rows={2}
              value={formData.tenCongVan || ''}
              onChange={e => setFormData({ ...formData, tenCongVan: e.target.value })}
              placeholder="Nhập trích yếu công việc..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ĐƠN VỊ BAN HÀNH" required>
              <input
                type="text"
                value={formData.donViBanHanh || ''}
                onChange={e => setFormData({ ...formData, donViBanHanh: e.target.value })}
                placeholder="UBND Tỉnh"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>

            <Field label="NGƯỜI THỰC HIỆN">
              <input
                type="text"
                value={formData.nguoiThucHien || ''}
                onChange={e => setFormData({ ...formData, nguoiThucHien: e.target.value })}
                placeholder="Chưa giao"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>
          </div>

          <Field label="GHI CHÚ">
            <input
              type="text"
              value={formData.ghiChu || ''}
              onChange={e => setFormData({ ...formData, ghiChu: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </Field>
          <div className="pt-3 border-t border-slate-200">
            <AttachmentUploader
              dispatchId={dispatchToEdit?.id}  
              attachments={attachments}
              onChange={setAttachments}
              category="ORIGINAL"
              showCategorySelect
              label="File đính kèm"
              hint="Hỗ trợ PDF, Word, Excel, ảnh. Tối đa 20MB/file"
              required={false}
            />
          </div>
          {/* Custom fields */}
          {customColumns.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Trường tùy chỉnh
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customColumns.map(col => (
                  <Field key={col.id} label={col.label}>
                    <input
                      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                      value={(formData.customFields?.[col.id] as string) || ''}
                      onChange={e => handleCustomFieldChange(col.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </Field>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{ backgroundColor: '#B71C1C' }}
          >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu công việc'
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// FIELD WRAPPER
// ============================================
interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

export default DispatchModal;