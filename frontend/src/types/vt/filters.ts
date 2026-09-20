// src/types/vt/filters.ts
export interface VtFilters {
  searchQuery: string;
  pvtIds: string[];         // multi-select
  deptCodes: string[];      // multi-select
  status: string;           // 'ALL' | 'DANG_XU_LY' | ...
  urgency: string;          // 'ALL' | 'KHAN' | ...
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_VT_FILTERS: VtFilters = {
  searchQuery: '',
  pvtIds: [],
  deptCodes: [],
  status: 'ALL',
  urgency: 'ALL',
  dateFrom: '',
  dateTo: '',
};