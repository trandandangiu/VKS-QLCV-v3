import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
  selectedCount?: number;
  itemLabel?: string;
  className?: string;
  extraControls?: React.ReactNode;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  selectedCount = 0,
  itemLabel = 'công văn',
  className = '',
  extraControls
}) => {
  if (totalItems === 0) {
    return (
      <div className={`flex items-center justify-between text-xs text-slate-500 px-4 py-2.5 ${className}`}>
        <span>Không có {itemLabel} nào</span>
      </div>
    );
  }

  const fromIndex = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const toIndex = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination page numbers with smart ellipsis
  const getPageNumbers = (): (number | 'ellipsis-prev' | 'ellipsis-next')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-next', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis-prev', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis-prev', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-next', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs sm:text-sm ${className}`}>
      {/* Left: Summary text */}
      <div className="flex flex-wrap items-center gap-2.5 text-slate-600 text-xs select-none">
        {selectedCount > 0 ? (
          <span>
            Đã chọn <strong className="font-bold text-red-700">{selectedCount}</strong> / {totalItems} {itemLabel}
          </span>
        ) : (
          <span>
            Hiển thị <strong className="font-semibold text-slate-900">{fromIndex}</strong> -{' '}
            <strong className="font-semibold text-slate-900">{toIndex}</strong> trong tổng số{' '}
            <strong className="font-bold text-red-700">{totalItems}</strong> {itemLabel}
            {totalPages > 1 && (
              <span className="text-slate-500 ml-1">
                (Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>)
              </span>
            )}
          </span>
        )}

        {extraControls}

        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2 pl-0 sm:pl-2 sm:border-l sm:border-slate-300">
            <span className="text-slate-500 text-[11px] sm:text-xs">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              aria-label="Số dòng hiển thị mỗi trang"
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500 cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Pagination Controls (< 1 - 2 - 3 - 4 ... >) */}
      {totalPages > 1 && (
        <nav 
          aria-label="Phân trang công văn" 
          className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center"
        >
          {/* First Page (<<) */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="Trang đầu tiên"
            title="Về trang đầu tiên (Trang 1)"
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page (<) */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Trang trước"
            title="Trang trước"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trước</span>
          </button>

          {/* Page Numbers: 1 - 2 - 3 - 4 ... */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === 'ellipsis-prev' || p === 'ellipsis-next') {
                return (
                  <span 
                    key={`${p}-${idx}`} 
                    className="px-2 py-1 text-slate-400 font-semibold select-none text-xs"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = p === currentPage;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={`Đến trang ${p}`}
                  style={isCurrent ? { backgroundColor: '#B71C1C', borderColor: '#7F0E0E' } : {}}
                  className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer border ${
                    isCurrent
                      ? 'text-white shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page (>) */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Trang sau"
            title="Trang kế tiếp"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-xs font-semibold"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page (>>) */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Trang cuối cùng"
            title={`Đến trang cuối cùng (Trang ${totalPages})`}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
