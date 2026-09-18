import React, { useState, useEffect } from 'react';
import { X, Paperclip, Upload } from 'lucide-react';
import { ColumnDefinition, Dispatch } from '../types/dispatch';
import { calculateTimeRemaining, resolveDispatchStatus } from '../services/excelService';

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
  onSave
}) => {
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
    if (dispatchToEdit) {
      setFormData({
        ...dispatchToEdit,
        customFields: dispatchToEdit.customFields ? { ...dispatchToEdit.customFields } : {}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedStatus = resolveDispatchStatus(formData);
    const timing = calculateTimeRemaining(formData.hanBaoCaoXuLy || '', resolvedStatus, formData.thoiHanXuLy);
    onSave({
      ...formData,
      trangThai: resolvedStatus,
      thoiHanXuLy: formData.thoiHanXuLy || timing.text
    });
    onClose();
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div 
          className="px-6 py-3.5 flex items-center justify-between text-white border-b"
          style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
        >
          <h2 className="text-base font-bold">
            {dispatchToEdit ? 'Chỉnh sửa thông tin công văn' : 'Thêm mới công văn gửi Lãnh đạo'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. NGÀY GỬI */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NGÀY GỬI <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.ngayGui || ''}
                onChange={e => setFormData({ ...formData, ngayGui: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 2. SỐ CÔNG VĂN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SỐ CÔNG VĂN <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.soCongVan || ''}
                onChange={e => setFormData({ ...formData, soCongVan: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 3. NGÀY PHÁT HÀNH */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NGÀY PHÁT HÀNH
              </label>
              <input
                type="date"
                value={formData.ngayPhatHanh || ''}
                onChange={e => setFormData({ ...formData, ngayPhatHanh: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 5. HẠN BÁO CÁO, XỬ LÝ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HẠN BÁO CÁO, XỬ LÝ <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.hanBaoCaoXuLy || ''}
                onChange={e => {
                  const val = e.target.value;
                  const timing = calculateTimeRemaining(val, formData.trangThai);
                  const newStatus = resolveDispatchStatus({
                    ...formData,
                    hanBaoCaoXuLy: val,
                    thoiHanXuLy: timing.text
                  });
                  setFormData({
                    ...formData,
                    hanBaoCaoXuLy: val,
                    thoiHanXuLy: timing.text,
                    trangThai: newStatus
                  });
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 6. THỜI HẠN XỬ LÝ & TRẠNG THÁI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                THỜI HẠN XỬ LÝ
              </label>
              <input
                type="text"
                value={formData.thoiHanXuLy || ''}
                onChange={e => {
                  const val = e.target.value;
                  const newStatus = resolveDispatchStatus({
                    ...formData,
                    thoiHanXuLy: val
                  });
                  setFormData({
                    ...formData,
                    thoiHanXuLy: val,
                    trangThai: newStatus
                  });
                }}
                placeholder="Tự động tính từ hạn báo cáo..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                TRẠNG THÁI XỬ LÝ
              </label>
              <select
                value={formData.trangThai || 'DANG_XU_LY'}
                onChange={e => {
                  const status = e.target.value as any;
                  let thoiHan = formData.thoiHanXuLy;
                  if (status === 'HOAN_THANH') thoiHan = 'Đã hoàn thành';
                  else if (status === 'CHO_Y_KIEN_LANH_DAO') thoiHan = 'Chờ ý kiến Lãnh đạo';
                  else if (formData.hanBaoCaoXuLy) {
                    thoiHan = calculateTimeRemaining(formData.hanBaoCaoXuLy, status).text;
                  }
                  setFormData({
                    ...formData,
                    trangThai: status,
                    thoiHanXuLy: thoiHan
                  });
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                <option value="DANG_XU_LY">Đang xử lý</option>
                <option value="SAP_DEN_HAN">Sắp đến hạn</option>
                <option value="QUA_HAN">Quá hạn xử lý</option>
                <option value="HOAN_THANH">Đã hoàn thành</option>
                <option value="CHO_Y_KIEN_LANH_DAO">Chờ ý kiến Lãnh đạo</option>
              </select>
            </div>
          </div>

          {/* 4. TÊN CÔNG VĂN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              TÊN CÔNG VĂN <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={formData.tenCongVan || ''}
              onChange={e => setFormData({ ...formData, tenCongVan: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 7. ĐƠN VỊ BAN HÀNH */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ĐƠN VỊ BAN HÀNH <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.donViBanHanh || ''}
                onChange={e => setFormData({ ...formData, donViBanHanh: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 8. NGƯỜI THỰC HIỆN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NGƯỜI THỰC HIỆN
              </label>
              <input
                type="text"
                value={formData.nguoiThucHien || ''}
                onChange={e => setFormData({ ...formData, nguoiThucHien: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 9. GHI CHÚ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GHI CHÚ
            </label>
            <input
              type="text"
              value={formData.ghiChu || ''}
              onChange={e => setFormData({ ...formData, ghiChu: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* User Custom Columns */}
          {customColumns.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <span className="block text-xs font-bold uppercase tracking-wider text-red-700 mb-2">
                CÁC TRƯỜNG DỮ LIỆU KHÁC
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customColumns.map(col => (
                  <div key={col.id} className={col.type === 'file' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {col.label}
                    </label>
                    {col.type === 'file' ? (
                      <div>
                        {formData.customFields?.[col.id] ? (
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-emerald-900 truncate">
                                  {typeof formData.customFields[col.id] === 'object' 
                                    ? formData.customFields[col.id].name 
                                    : String(formData.customFields[col.id])}
                                </span>
                                {typeof formData.customFields[col.id] === 'object' && formData.customFields[col.id].size && (
                                  <span className="text-[11px] text-emerald-600">
                                    {formData.customFields[col.id].size}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCustomFieldChange(col.id, null)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition cursor-pointer"
                              title="Xóa tệp đính kèm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-red-300 hover:border-red-500 hover:bg-red-50/40 rounded-lg text-xs font-medium text-red-700 cursor-pointer transition">
                            <Upload className="w-4 h-4 text-red-600" />
                            <span>Bấm để tải lên hoặc đính kèm tệp văn bản</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    handleCustomFieldChange(col.id, {
                                      name: file.name,
                                      size: file.size < 1024 * 1024 
                                        ? `${(file.size / 1024).toFixed(1)} KB` 
                                        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                                      type: file.type,
                                      dataUrl: reader.result as string
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                        value={formData.customFields?.[col.id] || ''}
                        onChange={e => handleCustomFieldChange(col.id, e.target.value)}
                        placeholder={`Nhập ${col.label.toLowerCase()}...`}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-500 focus:outline-none bg-slate-50/50"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-sm transition cursor-pointer"
            >
              <span>{dispatchToEdit ? 'Cập nhật công văn' : 'Lưu công văn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
