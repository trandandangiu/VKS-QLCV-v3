// src/pages/PublicHome.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format';
import { apiClient } from '../services/apiClient';
import { Clock, AlertTriangle, CheckCircle2, ArrowUp } from 'lucide-react';
import { Dispatch } from '../types/dispatch';
import { resolveDispatchStatus } from '../services/excelService';
import { Pagination } from '../components/Pagination';
import { sortDispatchesNewestFirst } from '../services/dateSort';
import { PublicHeroSection } from '../components/public/PublicHeroSection';
import { PublicFooter } from '../components/public/PublicFooter';

export const PublicHome: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

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
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    };
    updateClock();
    const t = setInterval(updateClock, 1000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    let dangXuLy = 0, sapDenHan = 0, quaHan = 0, hoanThanh = 0;
    dispatches.forEach(d => {
      const st = resolveDispatchStatus(d);
      if (st === 'HOAN_THANH') hoanThanh++;
      else if (st === 'QUA_HAN') quaHan++;
      else if (st === 'SAP_DEN_HAN') sapDenHan++;
      else dangXuLy++;
    });
    return { total: dispatches.length, dangXuLy, sapDenHan, quaHan, hoanThanh };
  }, [dispatches]);

  const displayDispatches = useMemo(
    () => sortDispatchesNewestFirst(dispatches),
    [dispatches]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(displayDispatches.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const paginatedDispatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayDispatches.slice(start, start + pageSize);
  }, [displayDispatches, currentPage, pageSize]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollToTable = () => {
    document.getElementById('public-table-section')?.scrollIntoView({
      behavior: 'smooth', block: 'start',
    });
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);
    const text = disp.thoiHanXuLy || '';
    if (status === 'HOAN_THANH') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{text || 'Đã hoàn thành'}
      </span>
    );
    if (status === 'QUA_HAN') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />{text || 'Quá hạn'}
      </span>
    );
    if (status === 'SAP_DEN_HAN') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-amber-600" />{text || 'Sắp đến hạn'}
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-blue-500" />{text || 'Đang xử lý'}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900" style={{ backgroundColor: '#F5F5F0' }}>

      {/* ═══════════ HEADER ═══════════ */}
      <header
        className="text-white sticky top-0 z-20 shadow-md border-b-2 w-full"
        style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
      >
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.svg"
                alt="Huy hiệu VKSND"
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
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shadow-xs whitespace-nowrap"
              >
                Đăng nhập vai trò
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main — TẤT CẢ NỘI DUNG CĂN GIỮA, CÙNG 1 ĐỘ RỘNG */}
      <main className="flex-1 w-full py-5">
        <div className="max-w-[1200px] mx-auto w-full px-3 sm:px-4 lg:px-6 space-y-4">

          {/* ═══════════ HERO ═══════════ */}
          <PublicHeroSection
            totalDispatches={stats.total}
            totalCompleted={stats.hoanThanh}
            totalOverdue={stats.quaHan}
            onScrollToTable={scrollToTable}
          />

          {/* ═══════════ THẺ CÔNG VĂN — CÙNG ĐỘ RỘNG VỚI HERO ═══════════ */}
          <div
            id="public-table-section"
            className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden w-full"
          >
            {/* Title có border đẹp */}
            {/* Title — nền đỏ chữ trắng như ban đầu */}
            <div
              className="text-white text-center py-2.5 px-4 border-b shadow-xs"
              style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
            >
              <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-white">
                CÔNG VĂN GỬI LÃNH ĐẠO
              </h2>
            </div>

            {/* Bảng cao 800px */}
            <div
              id="public-table-scroll-container"
              className="overflow-x-auto overflow-y-auto h-[800px] border-t border-slate-200"
            >
              <table className="w-full text-left border-collapse min-w-[1500px]">
                <thead className="sticky top-0 z-10 shadow-2xs">
                  <tr className="bg-[#b9d1ea] text-[#0f2942] border-b-2 border-slate-400">
                    {[
                      'STT', 'SỐ CÔNG VĂN', 'NGÀY GỬI', 'TÊN CÔNG VĂN', 'HẠN BÁO CÁO',
                      'THỜI HẠN XỬ LÝ', 'ĐƠN VỊ BAN HÀNH', 'NGƯỜI THỰC HIỆN', 'GHI CHÚ'
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center last:border-r-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                  {displayDispatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-28 px-4 text-slate-400 bg-slate-50/40">
                        <p className="text-sm text-slate-400 font-medium">
                          Hiện không có công văn nào để hiển thị
                        </p>
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
                          className={`transition-colors ${isOverdue ? 'bg-rose-50/30 hover:bg-rose-50/60'
                              : isCompleted ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                                : idx % 2 === 0 ? 'bg-white hover:bg-slate-50'
                                  : 'bg-slate-50/40 hover:bg-slate-100/60'
                            }`}
                        >
                          <td className="px-3 py-5 sm:py-6 text-center border-r border-slate-100 text-slate-600 font-semibold">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="font-semibold text-xs text-slate-900 bg-slate-100/90 px-2 py-1 rounded border border-slate-200 inline-block w-fit">
                              {disp.soCongVan || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                              {formatDate(disp.ngayGui)}
                            </span>
                          </td>
                          <td className="px-5 py-5 sm:py-6 border-r border-slate-100 min-w-[320px] max-w-[500px]">
                            <span
                              className="text-left font-semibold text-slate-900 text-sm leading-relaxed block"
                              title={disp.tenCongVan}
                            >
                              {disp.tenCongVan || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                              {formatDate(disp.hanBaoCaoXuLy)}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-center">
                            {renderStatusBadge(disp)}
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium text-xs whitespace-nowrap">
                              {disp.donViBanHanh || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 border-r border-slate-100">
                            <span className="font-medium text-slate-800 text-xs whitespace-nowrap">
                              {disp.nguoiThucHien || 'Chưa giao'}
                            </span>
                          </td>
                          <td className="px-4 py-5 sm:py-6 min-w-[180px]">
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

            {/* Pagination */}
            <div className="border-t border-slate-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={displayDispatches.length}
                pageSize={pageSize}
                onPageChange={p => {
                  setCurrentPage(p);
                  document.getElementById('public-table-scroll-container')
                    ?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </div>

          {/* ═══════════ FOOTER — cùng độ rộng ═══════════ */}
          <PublicFooter />
        </div>
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          style={{ backgroundColor: '#B71C1C', border: '2px solid #FFD700' }}
          title="Về đầu trang"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
};

export default PublicHome;