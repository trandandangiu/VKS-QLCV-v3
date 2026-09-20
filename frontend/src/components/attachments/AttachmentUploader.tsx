// src/components/attachments/AttachmentUploader.tsx
import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const FILE_CATEGORIES = [
  { value: 'ORIGINAL', label: 'Bản gốc', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'DRAFT', label: 'Dự thảo', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'REPORT', label: 'Báo cáo', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'OTHER', label: 'Khác', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext || '')) return FileText;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return FileSpreadsheet;
  return File;
};

const getFileColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'bg-red-100 text-red-700 border-red-200';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileCategory: string;
  url?: string;
  uploading?: boolean;
  error?: string;
  file?: File;           // ← THÊM: giữ File object để upload sau
}

interface AttachmentUploaderProps {
  dispatchId?: string;                 // Nếu có → upload ngay lên server
  attachments: AttachmentItem[];        // State từ parent
  onChange: (items: AttachmentItem[]) => void;
  category?: string;                    // Loại mặc định
  showCategorySelect?: boolean;         // Hiện dropdown chọn loại
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  dispatchId,
  attachments,
  onChange,
  category = 'ORIGINAL',
  showCategorySelect = false,
  label = 'File đính kèm',
  hint = 'Hỗ trợ PDF, Word, Excel, ảnh. Tối đa 20MB/file',
  required = false,
  disabled = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: AttachmentItem[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        newItems.push({
          id: `tmp-${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileCategory: selectedCategory,
          error: `File vượt quá ${formatSize(MAX_FILE_SIZE)}`,
        });
        continue;
      }
      newItems.push({
        id: `tmp-${Date.now()}-${Math.random()}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileCategory: selectedCategory,
        file,          // ← THÊM: giữ File object
      });

      // Nếu có dispatchId → upload ngay
      if (dispatchId) {
        const itemId = newItems[newItems.length - 1].id;
        // Cập nhật trạng thái uploading
        onChange([...attachments, ...newItems]);
        newItems[newItems.length - 1].uploading = true;

        try {
          const res = await apiClient.uploadAttachment(
            dispatchId,
            file,
            selectedCategory
          );
          if (res.success && res.attachment) {
            // Update item với data thật từ server
            const updated = [...attachments, ...newItems].map(it =>
              it.id === itemId
                ? { ...res.attachment, uploading: false }
                : it
            );
            onChange(updated);
          } else {
            const updated = [...attachments, ...newItems].map(it =>
              it.id === itemId
                ? { ...it, uploading: false, error: res.message || 'Upload lỗi' }
                : it
            );
            onChange(updated);
          }
        } catch (err: any) {
          const updated = [...attachments, ...newItems].map(it =>
            it.id === itemId
              ? { ...it, uploading: false, error: err.message || 'Upload lỗi' }
              : it
          );
          onChange(updated);
        }
      }
    }

    // Nếu không upload ngay → chỉ thêm vào state
    if (!dispatchId) {
      onChange([...attachments, ...newItems]);
    }
  };

  const handleRemove = async (item: AttachmentItem) => {
    // Nếu là file đã upload → gọi API xóa
    if (!item.id.startsWith('tmp-') && dispatchId) {
      const ok = await apiClient.deleteAttachment(item.id);
      if (!ok) {
        alert('Không thể xóa file');
        return;
      }
    }
    onChange(attachments.filter(it => it.id !== item.id));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        </div>

        {showCategorySelect && (
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 text-[11px] font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            {FILE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Upload zone */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          if (!disabled) e.currentTarget.classList.add('border-red-500', 'bg-red-50');
        }}
        onDragLeave={e => {
          e.currentTarget.classList.remove('border-red-500', 'bg-red-50');
        }}
        onDrop={e => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-red-500', 'bg-red-50');
          if (!disabled) handleSelectFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer ${disabled
          ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
          : 'border-slate-300 bg-slate-50 hover:border-red-500 hover:bg-red-50/30'
          }`}
      >
        <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
        <div className="text-xs font-bold text-slate-700 mb-0.5">
          Kéo thả file hoặc bấm để chọn
        </div>
        <div className="text-[10px] text-slate-500">{hint}</div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
          onChange={e => handleSelectFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map(item => {
            const Icon = getFileIcon(item.fileName);
            const color = getFileColor(item.fileName);

            return (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 p-2 rounded-lg border ${item.error ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg ${color} border flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {item.fileName}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{formatSize(item.fileSize)}</span>
                    {item.uploading && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Đang upload...
                      </span>
                    )}
                    {item.error && (
                      <span className="flex items-center gap-1 text-rose-600 font-bold">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {item.error}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  disabled={item.uploading}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Xóa file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;