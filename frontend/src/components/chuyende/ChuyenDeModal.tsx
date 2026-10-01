// src/components/chuyende/ChuyenDeModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X, FileText, Save, UserCheck, CornerDownRight,
  Calendar, Clock, Users, Paperclip, AlertCircle,
  Trash2,
} from 'lucide-react';
import { ColumnDefinition, Dispatch } from '../../types/dispatch';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { AgencyCombobox } from '../ui/AgencyCombobox';
import { AttachmentUploader, AttachmentItem } from '../attachments/AttachmentUploader';
import {
  ChuyenDeMilestone,
  initMilestones,
  getChuyenDeData,
} from '../../utils/chuyenDe';
import {
  ChuyenDeMilestoneEditor,
  MilestoneDraft,
} from './ChuyenDeMilestoneEditor';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface ChuyenDeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chuyenDeToEdit: Dispatch | null;
  onSave: (data: any) => Promise<boolean> | boolean | void;
  onSaved?: () => void;
  onDelete?: (chuyenDe: Dispatch) => void;
}

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

const DEFAULT_FORM = {
  ngayGui: new Date().toISOString().slice(0, 10),
  soCongVan: '',
  tenCongVan: '',
  donViBanHanh: '',
  nguoiThucHien: '',
  ghiChu: '',
  mucDoKhan: 'THUONG',
};

export const ChuyenDeModal: React.FC<ChuyenDeModalProps> = ({
  isOpen,
  onClose,
  chuyenDeToEdit,
  onSave,
  onSaved,
  onDelete,
}) => {
  const { allUsers } = useAuth();

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { id: `m_${Date.now()}_1`, ten: '', han: '' },
  ]);

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDeptCode, setSelectedDeptCode] = useState('');
  const [selectedPvtId, setSelectedPvtId] = useState('');
  const [selectedTpId, setSelectedTpId] = useState('');

  // LOAD DEPARTMENTS
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/departments', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
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
    };
    load();
  }, [isOpen]);

  // LOAD CHUYÊN ĐỀ KHI EDIT
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);

    if (chuyenDeToEdit) {
      setFormData({
        ngayGui: chuyenDeToEdit.ngayGui || new Date().toISOString().slice(0, 10),
        soCongVan: chuyenDeToEdit.soCongVan || '',
        tenCongVan: chuyenDeToEdit.tenCongVan || '',
        donViBanHanh: chuyenDeToEdit.donViBanHanh || '',
        nguoiThucHien: chuyenDeToEdit.nguoiThucHien || '',
        ghiChu: chuyenDeToEdit.ghiChu || '',
        mucDoKhan: chuyenDeToEdit.mucDoKhan || 'THUONG',
      });

      const data = getChuyenDeData(chuyenDeToEdit);
      if (data.milestones.length > 0) {
        setMilestones(
          data.milestones.map(m => ({
            id: m.id,
            ten: m.ten,
            han: m.han,
          }))
        );
      } else {
        setMilestones([{ id: `m_${Date.now()}_1`, ten: '', han: '' }]);
      }

      setSelectedPvtId(chuyenDeToEdit.assignedPvtId || '');
      setSelectedTpId(chuyenDeToEdit.assignedTpId || '');

      const matched = departments.find(d => d.name === chuyenDeToEdit.donViBanHanh);
      setSelectedDeptCode(matched?.code || '');

      apiClient
        .getAttachments(chuyenDeToEdit.id)
        .then(items => {
          setAttachments(
            items.map((a: any) => ({
              id: a.id,
              fileName: a.fileName,
              fileSize: a.fileSize,
              fileCategory: a.fileCategory,
              fileType: a.fileType,
            }))
          );
        })
        .catch(err => console.error('Lỗi load attachments:', err));
    } else {
      setFormData({ ...DEFAULT_FORM });
      setMilestones([{ id: `m_${Date.now()}_1`, ten: '', han: '' }]);
      setAttachments([]);
      setSelectedDeptCode('');
      setSelectedPvtId('');
      setSelectedTpId('');
    }
  }, [chuyenDeToEdit, isOpen, departments]);

  if (!isOpen) return null;

  const pvtUsers = allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG');
  const allTpUsers = allUsers.filter(u => u.role === 'TRUONG_PHONG');
  const filteredTpUsers = selectedDeptCode
    ? allTpUsers.filter(u => u.roomCode === selectedDeptCode)
    : allTpUsers;

  // HANDLE DELETE (XÓA CỨNG)
  const handleConfirmDelete = async () => {
    if (!chuyenDeToEdit || !onDelete) return;

    setIsDeleting(true);
    try {
      const ok = await apiClient.hardDeleteDispatch(chuyenDeToEdit.id);

      if (ok) {
        setShowDeleteConfirm(false);
        onDelete(chuyenDeToEdit);
        onClose();
      } else {
        setErrorMsg('Không thể xóa chuyên đề');
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi xóa chuyên đề');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // SUBMIT
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;

    if (!formData.soCongVan?.trim()) {
      setErrorMsg('Vui lòng nhập Số / Ký hiệu chuyên đề');
      return;
    }
    if (!formData.tenCongVan?.trim()) {
      setErrorMsg('Vui lòng nhập Nội dung chuyên đề');
      return;
    }
    if (!formData.donViBanHanh?.trim()) {
      setErrorMsg('Vui lòng chọn Đơn vị ban hành');
      return;
    }

    if (milestones.length === 0) {
      setErrorMsg('Phải có ít nhất 1 mốc thời hạn');
      return;
    }
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      if (!m.ten.trim()) {
        setErrorMsg(`Vui lòng nhập tên cho mốc ${i + 1}`);
        return;
      }
      if (!m.han) {
        setErrorMsg(`Vui lòng nhập hạn cho mốc ${i + 1}`);
        return;
      }
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const isEdit = !!chuyenDeToEdit;
      const existingMilestones = chuyenDeToEdit
        ? getChuyenDeData(chuyenDeToEdit).milestones
        : [];

      const finalMilestones: ChuyenDeMilestone[] = milestones.map((m, idx) => {
        const existing = existingMilestones.find(e => e.id === m.id);
        if (existing) {
          return { ...existing, ten: m.ten, han: m.han };
        }
        return {
          id: m.id,
          ten: m.ten,
          han: m.han,
          trangThai: !isEdit && idx === 0 ? 'DANG_THUC_HIEN' : 'CHUA_KICH_HOAT',
        };
      });

      const initializedMilestones = !isEdit
        ? initMilestones(finalMilestones)
        : finalMilestones;

      const lastMilestone = initializedMilestones[initializedMilestones.length - 1];
      const hanBaoCaoXuLy = lastMilestone?.han;

      const pvtUser = pvtUsers.find(u => u.id === selectedPvtId);
      const tpUser = filteredTpUsers.find(u => u.id === selectedTpId);

      const success = await onSave({
        ...formData,
        loaiCongVan: 'CHUYEN_DE',
        hanBaoCaoXuLy,
        trangThai: 'DANG_XU_LY',
        tienDo: 0,
        customFields: {
          chuyenDe: {
            milestones: initializedMilestones,
          },
        },
        __attachments: attachments,
        __assignPvt: pvtUser
          ? {
              pvtId: pvtUser.id,
              pvtName: pvtUser.fullName,
              roomCode: pvtUser.roomCode || '',
              isPrimary: true,
            }
          : undefined,
        __assignTp: tpUser
          ? {
              tpId: tpUser.id,
              tpName: tpUser.fullName,
              roomCode: tpUser.roomCode || '',
              isPrimary: true,
            }
          : undefined,
      });

      if (success === false) {
        setErrorMsg('Không thể lưu. Vui lòng kiểm tra lại dữ liệu.');
        return;
      }
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Lỗi submit chuyên đề:', err);
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-fadeIn">
          {/* HEADER */}
          <div
            className="px-6 py-4 text-white flex items-center justify-between"
            style={{ backgroundColor: '#0D9488' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                <Clock className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <h2 className="text-base font-bold">
                  {chuyenDeToEdit ? 'Chỉnh sửa chuyên đề' : 'Tạo chuyên đề'}
                </h2>
                <p className="text-xs text-teal-100">
                  {chuyenDeToEdit ? `Đang sửa: ${chuyenDeToEdit.soCongVan}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
          >
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* THÔNG TIN CHUNG */}
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Thông tin chung
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="SỐ / KÝ HIỆU CHUYÊN ĐỀ" required>
                  <input
                    type="text"
                    value={formData.soCongVan}
                    onChange={e =>
                      setFormData({ ...formData, soCongVan: e.target.value })
                    }
                    placeholder=""
                    className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </Field>

                <Field label="NGÀY TIẾP NHẬN" required>
                  <input
                    type="date"
                    value={formData.ngayGui}
                    onChange={e =>
                      setFormData({ ...formData, ngayGui: e.target.value })
                    }
                    className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </Field>

                <Field label="ĐƠN VỊ BAN HÀNH" required>
                  <AgencyCombobox
                    value={formData.donViBanHanh}
                    onChange={val =>
                      setFormData({ ...formData, donViBanHanh: val })
                    }
                    placeholder=""
                    required
                  />
                </Field>
              </div>

              <div className="mt-3">
                <Field label="NỘI DUNG CHUYÊN ĐỀ" required>
                  <textarea
                    rows={2}
                    value={formData.tenCongVan}
                    onChange={e =>
                      setFormData({ ...formData, tenCongVan: e.target.value })
                    }
                    placeholder=""
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </Field>
              </div>
            </div>

            {/* MỐC THỜI HẠN */}
            <div className="pt-3 border-t border-slate-200">
              <ChuyenDeMilestoneEditor
                milestones={milestones}
                onChange={setMilestones}
                disabled={isSubmitting}
              />
            </div>

            {/* PHÂN CÔNG */}
            <div className="pt-3 border-t border-slate-200">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Phân công xử lý
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="PHÓ VIỆN TRƯỞNG PHỤ TRÁCH">
                  <select
                    value={selectedPvtId}
                    onChange={e => setSelectedPvtId(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white cursor-pointer"
                  >
                    <option value="">-- Chưa phân công --</option>
                    {pvtUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.roomCode ? `${u.roomCode} - ` : ''}
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="ĐƠN VỊ THỰC HIỆN">
                  <select
                    value={selectedDeptCode}
                    onChange={e => {
                      const code = e.target.value;
                      setSelectedDeptCode(code);
                      if (code) {
                        const tps = allTpUsers.filter(u => u.roomCode === code);
                        if (!tps.find(t => t.id === selectedTpId)) {
                          setSelectedTpId('');
                        }
                      }
                    }}
                    className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn phòng --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.code}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* ĐÍNH KÈM */}
            <div className="pt-3 border-t border-slate-200">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                📎 Đính kèm
              </div>

              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50/40 p-2">
                <AttachmentUploader
                  dispatchId={chuyenDeToEdit?.id}
                  attachments={attachments}
                  onChange={setAttachments}
                  category="ORIGINAL"
                  showCategorySelect={false}
                  label=""
                  required={false}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="pt-4 -mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
              <div>
                {chuyenDeToEdit && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting || isDeleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Xóa vĩnh viễn chuyên đề này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa chuyên đề</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  style={{ backgroundColor: '#0D9488' }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Lưu chuyên đề
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* CONFIRM DIALOG XÓA */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa chuyên đề"
        message={
          `Bạn có chắc chắn muốn xóa vĩnh viễn chuyên đề "${chuyenDeToEdit?.soCongVan}"?\n\n` +
          `⚠️ Hành động này KHÔNG THỂ hoàn tác và sẽ xóa toàn bộ:\n` +
          `• Thông tin chuyên đề\n` +
          `• Các mốc thời hạn\n` +
          `• File đính kèm\n` +
          `• Lịch sử xử lý`
        }
        confirmText={isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
        cancelText="Hủy bỏ"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

export default ChuyenDeModal;