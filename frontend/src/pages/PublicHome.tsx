
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileStack,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Flame
} from 'lucide-react';
import { Dispatch, UrgencyLevel } from '../types/dispatch';
import { apiClient } from '../services/apiClient';
import { resolveDispatchStatus } from '../services/excelService';
import { Pagination } from '../components/Pagination';
import { sortDispatchesNewestFirst } from '../services/dateSort';
import { autoSyncFromGoogleSheet } from '../services/googleSheetSync';

export const PublicHome: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Background auto-sync from Google Sheet if data exists
  // Load dispatches từ API
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiClient.getDispatches({ limit: 500 });
        setDispatches(data);
      } catch (err) {
        console.error('Lỗi load dispatches:', err);
      }
    };
    loadData();

    // Refresh mỗi 60 giây
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh when localStorage updates (e.g. from /admin tab)
  const refreshData = () => {
    setDispatches(loadDispatchesFromStorage());
  };

  useEffect(() => {
    const handleStorageChange = () => {
      refreshData();
    };
    window.addEventListener('storage', handleStorageChange);

    // Live clock
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      setCurrentTime(now.toLocaleDateString('vi-VN', options));
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(clockTimer);
    };
  }, []);

  // Compute stats for public dashboard display
  const stats = useMemo(() => {
    let dangXuLy = 0;
    let sapDenHan = 0;
    let quaHan = 0;
    let hoanThanh = 0;

    dispatches.forEach(d => {
      const st = resolveDispatchStatus(d);
      if (st === 'HOAN_THANH') hoanThanh++;
      else if (st === 'QUA_HAN') quaHan++;
      else if (st === 'SAP_DEN_HAN') sapDenHan++;
      else dangXuLy++;
    });

    return {
      total: dispatches.length,
      dangXuLy,
      sapDenHan,
      quaHan,
      hoanThanh
    };
  }, [dispatches]);

  // Filter and sort for display only: LUÔN HIỆN DỮ LIỆU MỚI NHẤT
  const displayDispatches = useMemo(() => {
    const filtered = dispatches.filter(disp => {
      if (selectedStatus !== 'ALL') {
        const currentSt = resolveDispatchStatus(disp);
        if (currentSt !== selectedStatus) return false;
      }
      return true;
    });

    // Quy luật: Luôn hiển thị dữ liệu mới nhất (dựa trên ngày gửi, ngày phát hành, ngày tạo)
    return sortDispatchesNewestFirst(filtered);
  }, [dispatches, selectedStatus]);

  // Phân trang: Mặc định hiển thị tối đa 10 văn bản
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Tự động quay về trang 1 khi đổi bộ lọc trạng thái
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(displayDispatches.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedDispatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayDispatches.slice(start, start + pageSize);
  }, [displayDispatches, currentPage, pageSize]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper for rendering Urgency badge matching admin
  const renderUrgencyBadge = (level?: UrgencyLevel) => {
    switch (level) {
      case 'HOA_TOC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
            <Flame className="w-3 h-3 text-red-600 animate-pulse" /> Hỏa tốc
          </span>
        );
      case 'THUONG_KHAN':
      case 'KHAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Khẩn
          </span>
        );
      default:
        return null;
    }
  };

  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);
    const text = disp.thoiHanXuLy || '';

    if (status === 'HOAN_THANH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {text || 'Đã hoàn thành'}
        </span>
      );
    }

    if (status === 'QUA_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {text || 'Quá hạn'}
        </span>
      );
    }

    if (status === 'SAP_DEN_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          {text || 'Sắp đến hạn'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        {text || 'Đang xử lý'}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900" style={{ backgroundColor: '#F5F5F0' }}>
      {/* Top Banner / Navigation */}
      <header
        className="text-white sticky top-0 z-20 shadow-md border-b-2"
        style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.svg"
                alt="Huy hiệu Viện Kiểm sát Nhân dân"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-0.5">
                <div
                  className="text-xs sm:text-sm font-bold tracking-wider uppercase"
                  style={{ color: '#FFD700' }}
                >
                  VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
                </div>
                <h1 className="text-lg sm:text-2xl font-black tracking-wide uppercase text-white">
                  Công văn gửi lãnh đạo
                </h1>
                {currentTime && (
                  <p className="text-[11px] sm:text-xs text-white/80 capitalize font-medium">
                    {currentTime}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/vt"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400 text-red-950 hover:bg-amber-300 transition shadow-xs whitespace-nowrap"
              >
                <span>Viện Trưởng</span>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shadow-xs whitespace-nowrap"
              >
                <span>Đăng nhập vai trò</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Display Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* KPI Cards (Read-only summary) - vừa đủ nhìn, gọn gàng */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-2 rounded-lg border cursor-pointer transition ${selectedStatus === 'ALL'
                ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng công văn</span>
              <FileStack className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{stats.total}</p>
          </div>

          <div
            onClick={() => setSelectedStatus(selectedStatus === 'DANG_XU_LY' ? 'ALL' : 'DANG_XU_LY')}
            className={`px-3 py-2 rounded-lg border cursor-pointer transition ${selectedStatus === 'DANG_XU_LY'
                ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">Đang xử lý</span>
              <Clock className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-sky-950 leading-tight">{stats.dangXuLy}</p>
          </div>

          <div
            onClick={() => setSelectedStatus(selectedStatus === 'SAP_DEN_HAN' ? 'ALL' : 'SAP_DEN_HAN')}
            className={`px-3 py-2 rounded-lg border cursor-pointer transition ${selectedStatus === 'SAP_DEN_HAN'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Sắp đến hạn</span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-amber-950 leading-tight">{stats.sapDenHan}</p>
          </div>

          <div
            onClick={() => setSelectedStatus(selectedStatus === 'QUA_HAN' ? 'ALL' : 'QUA_HAN')}
            className={`px-3 py-2 rounded-lg border cursor-pointer transition ${selectedStatus === 'QUA_HAN'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Quá hạn xử lý</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-rose-700 leading-tight">{stats.quaHan}</p>
          </div>

          <div
            onClick={() => setSelectedStatus(selectedStatus === 'HOAN_THANH' ? 'ALL' : 'HOAN_THANH')}
            className={`px-3 py-2 rounded-lg border cursor-pointer transition ${selectedStatus === 'HOAN_THANH'
                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Đã hoàn thành</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-900 leading-tight">{stats.hoanThanh}</p>
          </div>
        </div>

        {/* Read-Only Dispatch Table */}
        <div id="public-table-section" className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          {/* Leadership Table Title Banner matching admin template */}
          <div
            className="text-white text-center py-2.5 px-4 border-b shadow-xs"
            style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
          >
            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-white">
              CÔNG VĂN GỬI LÃNH ĐẠO
            </h2>
          </div>

          <div id="public-table-scroll-container" className="overflow-x-auto overflow-y-auto max-h-[640px]">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="sticky top-0 z-10 shadow-2xs">
                <tr className="bg-[#b9d1ea] text-[#0f2942] border-b-2 border-slate-400">
                  <th className="w-12 min-w-[48px] px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap">
                    STT
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    SỐ CÔNG VĂN
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    NGÀY GỬI
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    TÊN CÔNG VĂN
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    HẠN BÁO CÁO
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    THỜI HẠN XỬ LÝ
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    ĐƠN VỊ BAN HÀNH
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    NGƯỜI THỰC HIỆN
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider select-none whitespace-nowrap text-center">
                    GHI CHÚ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {displayDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-28 px-4 text-slate-400 bg-slate-50/40">
                      <p className="text-sm text-slate-400 font-medium">Hiện không có công văn nào để hiển thị</p>
                    </td>
                  </tr>
                ) : (
                  paginatedDispatches.map((disp, idx) => {
                    const status = resolveDispatchStatus(disp);
                    const isOverdue = status === 'QUA_HAN';
                    const isCompleted = status === 'HOAN_THANH';

                    return (
                      <tr
                        key={disp.id || idx}
                        className={`transition-colors ${isOverdue
                            ? 'bg-rose-50/30 hover:bg-rose-50/60'
                            : isCompleted
                              ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                              : idx % 2 === 0
                                ? 'bg-white hover:bg-slate-50'
                                : 'bg-slate-50/40 hover:bg-slate-100/60'
                          }`}
                      >
                        {/* STT */}
                        <td className="px-3 py-5 sm:py-6 text-center border-r border-slate-100 text-slate-600 font-semibold text-sm">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>

                        {/* SỐ CÔNG VĂN */}
                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="font-semibold text-xs text-slate-900 bg-slate-100/90 px-2 py-1 rounded border border-slate-200 inline-block w-fit">
                            {disp.soCongVan || '—'}
                          </span>
                        </td>

                        {/* NGÀY GỬI */}
                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                            {formatDate(disp.ngayGui)}
                          </span>
                        </td>

                        {/* TÊN CÔNG VĂN */}
                        <td className="px-5 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle min-w-[320px] max-w-[500px]">
                          <span className="text-left font-semibold text-slate-900 text-sm leading-relaxed block" title={disp.tenCongVan}>
                            {disp.tenCongVan || '—'}
                          </span>
                        </td>

                        {/* HẠN BÁO CÁO */}
                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                            {formatDate(disp.hanBaoCaoXuLy)}
                          </span>
                        </td>

                        {/* THỜI HẠN XỬ LÝ */}
                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle text-center">
                          {renderStatusBadge(disp)}
                        </td>

                        {/* ĐƠN VỊ BAN HÀNH */}
                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium text-xs whitespace-nowrap">
                            {disp.donViBanHanh || '-'}
                          </span>
                        </td>

                        {/* NGƯỜI THỰC HIỆN */}
                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="font-medium text-slate-800 text-xs whitespace-nowrap">
                            {disp.nguoiThucHien || 'Chưa giao'}
                          </span>
                        </td>

                        {/* GHI CHÚ */}
                        <td className="px-4 py-5 sm:py-6 text-slate-700 align-middle min-w-[180px]">
                          <div className="text-xs text-slate-600 leading-relaxed" title={disp.ghiChu}>
                            {disp.ghiChu || <span className="text-slate-300 italic">-</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Control Bar with Pagination (< 1 - 2 - 3 - 4 ... >) - LUÔN FREEZE THẺ DIV CUỐI */}
          <div className="sticky bottom-0 z-20 shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={displayDispatches.length}
              pageSize={pageSize}
              onPageChange={(p) => {
                setCurrentPage(p);
                const container = document.getElementById('public-table-scroll-container');
                if (container) {
                  container.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              extraControls={
                selectedStatus !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('ALL')}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer ml-1"
                  >
                    Xóa bộ lọc
                  </button>
                )
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicHome;
