// src/components/attachments/AttachmentList.tsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Trash2,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileCategory: string;
  uploaderName?: string;
  uploaderRole?: string;
  description?: string;
  createdAt: string;
}

interface AttachmentListProps {
  dispatchId: string;
  onCountChange?: (count: number) => void;
  canDelete?: boolean;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileText;
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

const getCategoryBadge = (category: string) => {
  const map: Record<string, { label: string; color: string }> = {
    ORIGINAL: { label: 'Bản gốc', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    DRAFT: { label: 'Dự thảo', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    REPORT: { label: 'Báo cáo', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    APPROVAL: { label: 'Phê duyệt', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    REJECTION: { label: 'Từ chối', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    OTHER: { label: 'Khác', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };
  return map[category] || map.OTHER;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const day = String(vn.getUTCDate()).padStart(2, '0');
  const month = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const year = vn.getUTCFullYear();
  const hour = String(vn.getUTCHours()).padStart(2, '0');
  const min = String(vn.getUTCMinutes()).padStart(2, '0');
  return `${hour}:${min} ${day}/${month}/${year}`;
};

export const AttachmentList: React.FC<AttachmentListProps> = ({
  dispatchId,
  onCountChange,
  canDelete = false,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAttachments(dispatchId);
      setAttachments(data);
      onCountChange?.(data.length);
    } catch (e: any) {
      setError(e.message || 'Không thể tải file');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dispatchId) load();
  }, [dispatchId]);

  const handleDownload = async (att: Attachment) => {
    setDownloadingId(att.id);
    try {
      await apiClient.downloadAttachment(att.id);
    } catch (e) {
      alert('Không thể tải file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (att: Attachment) => {
    if (!window.confirm(`Xóa file "${att.fileName}"?`)) return;
    const ok = await apiClient.deleteAttachment(att.id);
    if (ok) {
      setAttachments(prev => prev.filter(a => a.id !== att.id));
      onCountChange?.(attachments.length - 1);
    } else {
      alert('Không thể xóa file');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-xs">Đang tải file...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400">
        <Paperclip className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <div className="text-xs italic">Chưa có file đính kèm</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map(att => {
        const Icon = getFileIcon(att.fileName);
        const color = getFileColor(att.fileName);
        const cat = getCategoryBadge(att.fileCategory);

        return (
          <div
            key={att.id}
            className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition"
          >
            <div className={`w-9 h-9 rounded-lg ${color} border flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {att.fileName}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${cat.color}`}>
                  {cat.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                <span>{formatSize(att.fileSize)}</span>
                {att.uploaderName && (
                  <>
                    <span>•</span>
                    <span>{att.uploaderName}</span>
                  </>
                )}
                <span>•</span>
                <span>{formatDate(att.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleDownload(att)}
                disabled={downloadingId === att.id}
                className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition cursor-pointer disabled:opacity-50"
                title="Tải về"
              >
                {downloadingId === att.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </button>
              {canDelete && (
                <button
                  onClick={() => handleDelete(att)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-300 transition cursor-pointer"
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
  );
};

export default AttachmentList;