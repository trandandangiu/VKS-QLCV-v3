import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ColumnDefinition,
  Dispatch,
  DispatchFilter,
  DispatchStatus,
  ExcelImportAnalysis,
  LeadershipDashboardStats,
  ReconciliationStrategy
} from '../types/dispatch';
import {
  DEFAULT_COLUMNS,
  loadColumnsFromStorage,
  loadDispatchesFromStorage,
  saveColumnsToStorage,
  saveDispatchesToStorage,
  clearAllDispatchesFromStorage,
  restoreSampleDispatchesToStorage
} from '../services/dispatchStorage';
import { calculateTimeRemaining, resolveDispatchStatus } from '../services/excelService';
import { getDispatchSortTimestamp, parseDateToTimestamp } from '../services/dateSort';

export const useDispatches = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>(() => loadDispatchesFromStorage());
  const [columns, setColumns] = useState<ColumnDefinition[]>(() => loadColumnsFromStorage());
  
  // Active Filter state
  const [filters, setFilters] = useState<DispatchFilter>({
    searchQuery: '',
    status: 'ALL',
    donViBanHanh: 'ALL',
    nguoiThucHien: 'ALL',
    urgency: 'ALL',
    dateFrom: '',
    dateTo: '',
    overdueOnly: false
  });

  // Sorting state - mặc định luôn hiển thị công văn MỚI NHẤT lên đầu
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Dispatch | string;
    direction: 'asc' | 'desc';
  }>({
    key: 'ngayGui',
    direction: 'desc'
  });

  // Selected row IDs for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Keep storage in sync
  useEffect(() => {
    saveDispatchesToStorage(dispatches);
  }, [dispatches]);

  useEffect(() => {
    saveColumnsToStorage(columns);
  }, [columns]);

  // Dynamic status evaluation on load & intervals
  useEffect(() => {
    setDispatches(prev =>
      prev.map(disp => {
        const resolved = resolveDispatchStatus(disp);
        const calc = calculateTimeRemaining(disp.hanBaoCaoXuLy, resolved, disp.thoiHanXuLy);
        if (disp.thoiHanXuLy !== calc.text || disp.trangThai !== resolved) {
          return {
            ...disp,
            thoiHanXuLy: calc.text,
            trangThai: resolved
          };
        }
        return disp;
      })
    );
  }, []);

  // Filtered & Sorted Dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches
      .filter(item => {
        // Search query across multiple fields
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchNumber = item.soCongVan.toLowerCase().includes(q);
          const matchTitle = item.tenCongVan.toLowerCase().includes(q);
          const matchUnit = item.donViBanHanh.toLowerCase().includes(q);
          const matchAssignee = item.nguoiThucHien.toLowerCase().includes(q);
          const matchNotes = item.ghiChu?.toLowerCase().includes(q) || false;
          
          // Check custom fields
          const matchCustom = item.customFields
            ? Object.values(item.customFields).some(val =>
                String(val).toLowerCase().includes(q)
              )
            : false;

          if (!matchNumber && !matchTitle && !matchUnit && !matchAssignee && !matchNotes && !matchCustom) {
            return false;
          }
        }

        // Status filter (unified with resolveDispatchStatus)
        if (filters.status !== 'ALL') {
          const itemStatus = resolveDispatchStatus(item);
          if (itemStatus !== filters.status) return false;
        }

        // Overdue filter toggle
        if (filters.overdueOnly && resolveDispatchStatus(item) !== 'QUA_HAN') {
          return false;
        }

        // Unit filter
        if (filters.donViBanHanh !== 'ALL' && item.donViBanHanh !== filters.donViBanHanh) {
          return false;
        }

        // Assignee filter
        if (filters.nguoiThucHien !== 'ALL' && item.nguoiThucHien !== filters.nguoiThucHien) {
          return false;
        }

        // Urgency level filter
        if (filters.urgency !== 'ALL' && item.mucDoKhan !== filters.urgency) {
          return false;
        }

        // Date range
        if (filters.dateFrom) {
          if (item.ngayGui < filters.dateFrom && item.hanBaoCaoXuLy < filters.dateFrom) {
            return false;
          }
        }
        if (filters.dateTo) {
          if (item.ngayGui > filters.dateTo && item.hanBaoCaoXuLy > filters.dateTo) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Nếu trường sắp xếp là ngày tháng, đối chiếu theo timestamp số học
        const isDateField = ['ngayGui', 'ngayPhatHanh', 'hanBaoCaoXuLy', 'createdAt'].includes(String(sortConfig.key));
        if (isDateField) {
          const timeA = parseDateToTimestamp((a as any)[sortConfig.key]);
          const timeB = parseDateToTimestamp((b as any)[sortConfig.key]);
          if (timeA !== timeB) {
            return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
          }
        } else {
          let valA: any = (a as any)[sortConfig.key];
          let valB: any = (b as any)[sortConfig.key];

          if (sortConfig.key.startsWith('custom_')) {
            const customKey = sortConfig.key.replace('custom_', '');
            valA = a.customFields?.[customKey] ?? '';
            valB = b.customFields?.[customKey] ?? '';
          }

          if (valA === undefined || valA === null) valA = '';
          if (valB === undefined || valB === null) valB = '';

          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        }

        // Quy luật mặc định: Luôn ưu tiên công văn MỚI NHẤT lên đầu tiên
        const tA = getDispatchSortTimestamp(a);
        const tB = getDispatchSortTimestamp(b);
        return tB - tA;
      });
  }, [dispatches, filters, sortConfig]);

  // Leadership Dashboard Stats calculation (accurate synchronization with thoiHanXuLy)
  const dashboardStats = useMemo<LeadershipDashboardStats>(() => {
    const total = dispatches.length;
    let dangXuLy = 0;
    let sapDenHan = 0;
    let quaHan = 0;
    let hoanThanh = 0;
    let choYKien = 0;

    dispatches.forEach(d => {
      const status = resolveDispatchStatus(d);
      if (status === 'HOAN_THANH') hoanThanh++;
      else if (status === 'QUA_HAN') quaHan++;
      else if (status === 'SAP_DEN_HAN') sapDenHan++;
      else if (status === 'CHO_Y_KIEN_LANH_DAO') choYKien++;
      else dangXuLy++;
    });

    const onTimeTotal = total - quaHan;
    const rateOnTime = total > 0 ? Math.round((onTimeTotal / total) * 100) : 100;

    return {
      total,
      dangXuLy,
      sapDenHan,
      quaHan,
      hoanThanh,
      choYKien,
      rateOnTime
    };
  }, [dispatches]);

  // Unique list of units and assignees for dropdown filtering
  const filterOptions = useMemo(() => {
    const units = new Set<string>();
    const assignees = new Set<string>();

    dispatches.forEach(d => {
      if (d.donViBanHanh) units.add(d.donViBanHanh);
      if (d.nguoiThucHien) assignees.add(d.nguoiThucHien);
    });

    return {
      units: Array.from(units).sort(),
      assignees: Array.from(assignees).sort()
    };
  }, [dispatches]);

  // CRUD Dispatch Actions
  const addDispatch = useCallback((dispatchData: Omit<Dispatch, 'id' | 'createdAt' | 'updatedAt'>) => {
    const normalizedInputNumber = (dispatchData.soCongVan || '').trim().toLowerCase();
    
    // Kiểm tra trùng số công văn trước khi đưa vào database
    let isDuplicate = false;
    setDispatches(prev => {
      if (prev.some(d => (d.soCongVan || '').trim().toLowerCase() === normalizedInputNumber)) {
        isDuplicate = true;
        return prev; // Không đưa vào database nếu trùng số công văn
      }
      const timing = calculateTimeRemaining(dispatchData.hanBaoCaoXuLy, dispatchData.trangThai, dispatchData.thoiHanXuLy);
      const resolvedStatus = resolveDispatchStatus({
        ...dispatchData,
        trangThai: dispatchData.trangThai || timing.status,
        thoiHanXuLy: dispatchData.thoiHanXuLy || timing.text
      });
      const newDispatch: Dispatch = {
        ...dispatchData,
        id: `cv-${Date.now()}`,
        thoiHanXuLy: dispatchData.thoiHanXuLy || timing.text,
        trangThai: resolvedStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return [newDispatch, ...prev];
    });

    return !isDuplicate;
  }, []);

  const updateDispatch = useCallback((id: string, updates: Partial<Dispatch>) => {
    setDispatches(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = {
            ...item,
            ...updates,
            updatedAt: new Date().toISOString()
          };
          if (
            updates.hanBaoCaoXuLy !== undefined ||
            updates.trangThai !== undefined ||
            updates.thoiHanXuLy !== undefined
          ) {
            const timing = calculateTimeRemaining(updated.hanBaoCaoXuLy, updated.trangThai, updated.thoiHanXuLy);
            if (!updates.thoiHanXuLy) updated.thoiHanXuLy = timing.text;
            updated.trangThai = resolveDispatchStatus(updated);
          }
          return updated;
        }
        return item;
      })
    );
  }, []);

  const deleteDispatch = useCallback((id: string) => {
    setDispatches(prev => prev.filter(item => item.id !== id));
    setSelectedIds(prev => prev.filter(selId => selId !== id));
  }, []);

  const bulkDeleteDispatches = useCallback((ids: string[]) => {
    setDispatches(prev => prev.filter(item => !ids.includes(item.id)));
    setSelectedIds([]);
  }, []);

  const clearAllDispatches = useCallback(() => {
    clearAllDispatchesFromStorage();
    setDispatches([]);
    setSelectedIds([]);
  }, []);

  const restoreSampleDispatches = useCallback(() => {
    const samples = restoreSampleDispatchesToStorage();
    setDispatches(samples);
    setSelectedIds([]);
  }, []);

  const bulkUpdateStatus = useCallback((ids: string[], status: DispatchStatus) => {
    setDispatches(prev =>
      prev.map(item => {
        if (ids.includes(item.id)) {
          const timing = calculateTimeRemaining(item.hanBaoCaoXuLy, status);
          return {
            ...item,
            trangThai: status,
            thoiHanXuLy: status === 'HOAN_THANH' ? 'Đã hoàn thành' : timing.text,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      })
    );
    setSelectedIds([]);
  }, []);

  // Excel Import Reconciliation Execution
  const commitExcelImport = useCallback((
    analysis: ExcelImportAnalysis,
    strategy: ReconciliationStrategy,
    itemActions?: Record<string, 'UPDATE' | 'SKIP' | 'APPEND'>
  ) => {
    let addedList: Dispatch[] = [];

    setDispatches(prev => {
      let updatedList = [...prev];
      const existingSoCongVanSet = new Set(
        prev.map(d => (d.soCongVan || '').trim().toLowerCase())
      );
      const itemsToAdd: Dispatch[] = [];

      // 1. Đối chiếu newItems: Nếu trùng số công văn trong database thì KHÔNG đưa vào database
      analysis.newItems.forEach(item => {
        const num = (item.soCongVan || '').trim().toLowerCase();
        if (!num || existingSoCongVanSet.has(num)) {
          // Trùng số công văn -> Bỏ qua, không đưa vào database
          return;
        }
        existingSoCongVanSet.add(num);
        itemsToAdd.push(item);
      });

      // 2. Xử lý các công văn đã trùng khớp
      analysis.existingMatches.forEach(match => {
        const action = itemActions?.[match.existing.id] || 
          (strategy === 'UPDATE_EXISTING' ? 'UPDATE' : strategy === 'APPEND_AS_NEW' ? 'APPEND' : 'SKIP');

        if (action === 'UPDATE') {
          // Cập nhật đè lên dòng đã có sẵn (không sinh dòng mới)
          updatedList = updatedList.map(item => {
            if (item.id === match.existing.id) {
              const mergedCustom = {
                ...(item.customFields || {}),
                ...(match.incoming.customFields || {})
              };

              const mergedItem: Dispatch = {
                ...item,
                tenCongVan: match.incoming.tenCongVan || item.tenCongVan,
                hanBaoCaoXuLy: match.incoming.hanBaoCaoXuLy || item.hanBaoCaoXuLy,
                donViBanHanh: match.incoming.donViBanHanh || item.donViBanHanh,
                nguoiThucHien: match.incoming.nguoiThucHien || item.nguoiThucHien,
                ghiChu: match.incoming.ghiChu || item.ghiChu,
                ngayGui: match.incoming.ngayGui || item.ngayGui,
                ngayPhatHanh: match.incoming.ngayPhatHanh || item.ngayPhatHanh,
                thoiHanXuLy: match.incoming.thoiHanXuLy || item.thoiHanXuLy,
                customFields: mergedCustom,
                updatedAt: new Date().toISOString()
              };
              return mergedItem;
            }
            return item;
          });
        }
        // Nếu là SKIP hoặc APPEND: Nếu trùng số công văn thì bỏ qua, không đưa vào database
      });

      addedList = itemsToAdd;
      return [...itemsToAdd, ...updatedList];
    });

    // Auto-register unrecognized columns as custom columns so user can view/manage them
    if (analysis.unrecognizedColumns.length > 0) {
      setColumns(prev => {
        const existingColIds = new Set(prev.map(c => c.id));
        const newCols: ColumnDefinition[] = [];

        analysis.unrecognizedColumns.forEach(headerName => {
          const colId = headerName.trim();
          if (!existingColIds.has(colId)) {
            newCols.push({
              id: colId,
              label: headerName.toUpperCase(),
              type: 'text',
              visible: true,
              isCustom: true,
              width: '180px',
              description: `Cột trích xuất từ file Excel: ${analysis.fileName}`
            });
            existingColIds.add(colId);
          }
        });

        return [...prev, ...newCols];
      });
    }

    return addedList;
  }, []);

  // Flexible Column Management Actions
  const addCustomColumn = useCallback((newCol: { label: string; type: ColumnDefinition['type']; options?: string[]; description?: string }) => {
    const colId = `custom_${Date.now()}`;
    const columnDef: ColumnDefinition = {
      id: colId,
      label: newCol.label.toUpperCase(),
      type: newCol.type,
      visible: true,
      isCustom: true,
      width: newCol.type === 'file' ? '200px' : '160px',
      options: newCol.options,
      description: newCol.description || 'Cột bổ sung linh hoạt'
    };
    setColumns(prev => [...prev, columnDef]);
    return columnDef;
  }, []);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumns(prev =>
      prev.map(c => (c.id === columnId ? { ...c, visible: !c.visible } : c))
    );
  }, []);

  const updateColumn = useCallback((columnId: string, updates: Partial<ColumnDefinition>) => {
    setColumns(prev =>
      prev.map(c => (c.id === columnId ? { ...c, ...updates } : c))
    );
  }, []);

  const removeColumn = useCallback((columnId: string) => {
    setColumns(prev => prev.filter(c => c.id !== columnId || !c.isCustom));
  }, []);

  const resetToDefaultColumns = useCallback(() => {
    setColumns(DEFAULT_COLUMNS);
  }, []);

  const handleSort = useCallback((columnId: string) => {
    setSortConfig(prev => {
      if (prev.key === columnId) {
        return {
          key: columnId,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key: columnId, direction: 'asc' };
    });
  }, []);

  const toggleSelectRow = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredDispatches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDispatches.map(d => d.id));
    }
  }, [selectedIds.length, filteredDispatches]);

  return {
    dispatches,
    filteredDispatches,
    columns,
    visibleColumns: columns.filter(c => c.visible),
    filters,
    setFilters,
    filterOptions,
    sortConfig,
    handleSort,
    dashboardStats,
    selectedIds,
    toggleSelectRow,
    toggleSelectAll,
    addDispatch,
    updateDispatch,
    deleteDispatch,
    bulkDeleteDispatches,
    clearAllDispatches,
    restoreSampleDispatches,
    bulkUpdateStatus,
    commitExcelImport,
    addCustomColumn,
    toggleColumnVisibility,
    updateColumn,
    removeColumn,
    resetToDefaultColumns
  };
};
