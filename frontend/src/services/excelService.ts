import * as XLSX from 'xlsx';
import { ColumnDefinition, Dispatch, ExcelImportAnalysis, ReconciledDifference, ReconciledExistingItem } from '../types/dispatch';

// Normalize Vietnamese string for header matching
export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Normalize dispatch number for matching (removes symbols, spaces, accents, lowercase)
export const normalizeDispatchKey = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Map known aliases to standard fields
const HEADER_MAPPING: Record<string, string[]> = {
  ngayGui: ['ngaygui', 'ngaynhan', 'ngaytiepnhan', 'ngayden', 'ngaychuyen', 'ngay'],
  soCongVan: [
    'socongvan',
    'scv', // Cực kỳ quan trọng: viết tắt phổ biến trong các cơ quan hành chính
    'socv',
    'sovanban',
    'sohieu',
    'sohieucv',
    'sohieuvb',
    'sohieucongvan',
    'so',
    'mavanban',
    'macongvan',
    'sohieugiayto'
  ],
  ngayPhatHanh: ['ngayphathanh', 'ngaybanhanh', 'ngayky', 'ngayvanban', 'ngayvb'],
  tenCongVan: ['tencongvan', 'trichyeu', 'noidung', 'tenvanban', 'trichyeunoidung', 'tieude', 'noidungvanban', 'noidungcongvan'],
  hanBaoCaoXuLy: ['hanbaocaoxuly', 'hanxuly', 'hanbaocao', 'thoihanbaocao', 'deadline', 'hanhoanthanh', 'ngayhethan', 'han'],
  thoiHanXuLy: ['thoihanxuly', 'thoihan', 'tinhtrangthoihan', 'songayconlai', 'tiendo', 'tinhtrang'],
  donViBanHanh: ['donvibanhanh', 'noibanhanh', 'coquanbanhanh', 'coquan', 'donvi', 'noigui', 'coquannoigui'],
  nguoiThucHien: ['nguoithuchien', 'canbothuchien', 'nguoiphutrach', 'chuyenvien', 'canbo', 'nguoixuly', 'nguoinhan', 'canbophutrach'],
  ghiChu: ['ghichu', 'ykienchidao', 'luuy', 'chidao', 'ketquaxuly', 'note', 'chuyen', 'ykien']
};

/**
 * Identify matching field for a given column header text
 */
export const matchFieldToHeader = (headerText: string, customColumns: ColumnDefinition[] = []): string | null => {
  const normalized = normalizeString(headerText);
  if (!normalized) return null;

  // 1. Direct exact matching with alias first
  for (const [fieldKey, aliases] of Object.entries(HEADER_MAPPING)) {
    if (aliases.includes(normalized)) {
      return fieldKey;
    }
  }

  // 2. Partial matching (e.g. "so cv", "ngay gui", "trich yeu noi dung")
  for (const [fieldKey, aliases] of Object.entries(HEADER_MAPPING)) {
    if (
      aliases.some(
        alias =>
          normalized === alias ||
          normalized.includes(alias) ||
          (alias.length > 2 && alias.includes(normalized))
      )
    ) {
      return fieldKey;
    }
  }

  // 3. Check user custom columns
  for (const col of customColumns) {
    if (normalizeString(col.label) === normalized || normalizeString(col.id) === normalized) {
      return `custom_${col.id}`;
    }
  }

  return null;
};

/**
 * Parse any date string format safely in local timezone without UTC offset glitches
 */
export const parseDateSafely = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === 'number') {
    // Excel date serial number (e.g. 45000)
    const d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(dateVal).trim();
  if (!s) return null;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Determine dynamic status (HOAN_THANH, QUA_HAN, SAP_DEN_HAN, DANG_XU_LY, etc.)
 * accurately reconciling both the deadline date (hanBaoCaoXuLy) and status text (thoiHanXuLy).
 */
export const resolveDispatchStatus = (d: Partial<Dispatch>): Dispatch['trangThai'] => {
  if (!d) return 'DANG_XU_LY';

  const thoiHanText = String(d.thoiHanXuLy || '').trim().toLowerCase();

  // 1. Explicit Completed status or text
  if (
    d.trangThai === 'HOAN_THANH' ||
    thoiHanText.includes('hoàn thành') ||
    thoiHanText.includes('đã xong') ||
    thoiHanText === 'xong' ||
    d.tienDo === 100
  ) {
    return 'HOAN_THANH';
  }

  // 2. Chờ ý kiến Lãnh đạo
  if (d.trangThai === 'CHO_Y_KIEN_LANH_DAO' || thoiHanText.includes('chờ ý kiến')) {
    return 'CHO_Y_KIEN_LANH_DAO';
  }

  // 3. Quá hạn xử lý (from explicit status, text, or passed date)
  if (
    d.trangThai === 'QUA_HAN' ||
    thoiHanText.includes('quá hạn') ||
    thoiHanText.includes('trễ hạn') ||
    thoiHanText.includes('hết hạn')
  ) {
    return 'QUA_HAN';
  }

  // 4. Sắp đến hạn (from explicit status, text)
  if (
    d.trangThai === 'SAP_DEN_HAN' ||
    thoiHanText.includes('sắp đến hạn') ||
    thoiHanText.includes('sắp hết hạn') ||
    thoiHanText.includes('còn 1 ngày') ||
    thoiHanText.includes('còn 2 ngày') ||
    thoiHanText.includes('còn 3 ngày') ||
    thoiHanText.includes('hôm nay') ||
    thoiHanText.includes('khẩn')
  ) {
    return 'SAP_DEN_HAN';
  }

  // 5. Calculate from deadline date (hanBaoCaoXuLy)
  if (d.hanBaoCaoXuLy) {
    const dDate = parseDateSafely(d.hanBaoCaoXuLy);
    if (dDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dDate.setHours(0, 0, 0, 0);
      const diffMs = dDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return 'QUA_HAN';
      } else if (diffDays <= 3) {
        return 'SAP_DEN_HAN';
      } else {
        return 'DANG_XU_LY';
      }
    }
  }

  return d.trangThai || 'DANG_XU_LY';
};

/**
 * Calculate dynamic status and days remaining based on deadline date and existing status text
 */
export const calculateTimeRemaining = (
  deadlineDateStr: string,
  currentStatus?: string,
  existingThoiHanText?: string
): { text: string; status: Dispatch['trangThai'] } => {
  const existingText = String(existingThoiHanText || '').trim();
  const lower = existingText.toLowerCase();

  if (
    currentStatus === 'HOAN_THANH' ||
    lower.includes('hoàn thành') ||
    lower.includes('đã xong') ||
    lower === 'xong'
  ) {
    return { text: existingText || 'Đã hoàn thành', status: 'HOAN_THANH' };
  }

  if (currentStatus === 'CHO_Y_KIEN_LANH_DAO' || lower.includes('chờ ý kiến')) {
    return { text: existingText || 'Chờ ý kiến Lãnh đạo', status: 'CHO_Y_KIEN_LANH_DAO' };
  }

  const dDate = parseDateSafely(deadlineDateStr);
  if (!dDate) {
    if (existingText) {
      if (lower.includes('quá hạn') || lower.includes('trễ') || lower.includes('hết hạn')) {
        return { text: existingText, status: 'QUA_HAN' };
      }
      if (
        lower.includes('sắp') ||
        lower.includes('còn 1 ngày') ||
        lower.includes('còn 2 ngày') ||
        lower.includes('còn 3 ngày') ||
        lower.includes('hôm nay') ||
        lower.includes('khẩn')
      ) {
        return { text: existingText, status: 'SAP_DEN_HAN' };
      }
      return { text: existingText, status: (currentStatus as Dispatch['trangThai']) || 'DANG_XU_LY' };
    }
    return { text: 'Chưa có hạn', status: (currentStatus as Dispatch['trangThai']) || 'DANG_XU_LY' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dDate.setHours(0, 0, 0, 0);

  const diffMs = dDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, status: 'QUA_HAN' };
  } else if (diffDays === 0) {
    return { text: 'Hạn chót hôm nay', status: 'SAP_DEN_HAN' };
  } else if (diffDays <= 3) {
    return { text: `Còn ${diffDays} ngày (Khẩn)`, status: 'SAP_DEN_HAN' };
  } else {
    return { text: `Còn ${diffDays} ngày`, status: 'DANG_XU_LY' };
  }
};

/**
 * Format date values safely
 */
export const formatDateValue = (val: any): string => {
  if (!val) return '';
  if (val instanceof Date) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof val === 'number') {
    // Excel date serial number handling
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const str = String(val).trim();
  // Check if DD/MM/YYYY
  const dmYRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const match = str.match(dmYRegex);
  if (match) {
    const dd = match[1].padStart(2, '0');
    const mm = match[2].padStart(2, '0');
    const yyyy = match[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return str;
};

/**
 * Check if a cell looks like a date string (DD/MM/YYYY or YYYY-MM-DD or Date object)
 */
export const isDateLike = (val: any): boolean => {
  if (!val) return false;
  if (val instanceof Date) return true;
  if (typeof val === 'number' && val > 30000 && val < 60000) return true; // typical Excel serial date
  const str = String(val).trim();
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(str) || /^\d{4}-\d{2}-\d{2}$/.test(str);
};

/**
 * Smart inference for Issuing Agency from dispatch number (e.g. 4320/BTP-CQLTHADS)
 */
export const inferAgencyFromDispatchNumber = (scv: string): string => {
  if (!scv) return 'Chưa xác định';
  const parts = scv.split('/');
  if (parts.length > 1) {
    const rawAgency = parts[1].trim();
    const upper = rawAgency.toUpperCase();
    if (upper.includes('BTP') && upper.includes('CQLTHADS')) {
      return 'Bộ Tư pháp (Cục QLTHADS)';
    }
    if (upper.includes('BTP')) return 'Bộ Tư pháp';
    if (upper.includes('VKSNDTC') || upper.includes('VKSTC')) return 'VKSND Tối cao';
    if (upper.includes('TANDTC')) return 'TAND Tối cao';
    if (upper.includes('BCA')) return 'Bộ Công an';
    if (upper.includes('VPCP')) return 'Văn phòng Chính phủ';
    if (upper.includes('UBND')) return 'UBND';
    if (upper.includes('STC')) return 'Sở Tài chính';
    if (upper.includes('TTR')) return 'Thanh tra';
    return rawAgency;
  }
  return 'Chưa xác định';
};

/**
 * Smart inference for Assignee from Notes (e.g. "Chuyển PVT - Nguyễn Phước Trung")
 */
export const inferAssigneeFromNotes = (notes: string): string => {
  if (!notes) return 'Chưa phân công';
  // Matches "Chuyển PVT - Nguyễn Phước Trung", "Đ/c Trần Văn Minh", "Giao cho Nguyễn Phước Trung"
  const nameMatch = notes.match(
    /(?:chuy[ểe]n|giao|ph[âa]n\s*c[ôo]ng|k[íi]nh\s*chuy[ểe]n|[đd]\/c|[đd][ồo]ng\s*ch[íi])\s*(?:pvt|vt|pct|ct|pbgd|bgd|tr[ưở]ng\s*ph[òo]ng|ph[óo]\s*ph[òo]ng|chuy[êe]n\s*vi[êe]n)?\s*[-:–]?\s*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(?:\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+){1,3})/i
  );
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].trim();
  }
  return 'Chưa phân công';
};

/**
 * Split pasted raw text (from Excel clipboard or text area) into array of rows
 */
export const parseTextToRows = (text: string): any[][] => {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    if (line.includes('\t')) {
      return line.split('\t').map(c => c.trim());
    }
    if (line.includes(',')) {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      cells.push(current.trim());
      return cells;
    }
    return line.split(/\s{2,}/).map(c => c.trim());
  });
};

/**
 * Core engine: parses raw array of rows and reconciles against existing dispatches
 */
export const parseRowsToAnalysis = (
  rows: any[][],
  sourceName: string,
  existingDispatches: Dispatch[],
  customColumns: ColumnDefinition[]
): ExcelImportAnalysis => {
  if (!rows || rows.length === 0) {
    throw new Error('Không có dữ liệu nào được cung cấp.');
  }

  // 1. Detect header row
  let headerRowIndex = -1;
  let maxMatchedHeaders = 0;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    let matchedCount = 0;
    row.forEach((cell: any) => {
      const str = String(cell || '').trim();
      if (!str) return;
      if (matchFieldToHeader(str, customColumns)) {
        matchedCount++;
      }
    });

    if (matchedCount > maxMatchedHeaders) {
      maxMatchedHeaders = matchedCount;
      headerRowIndex = r;
    }
  }

  // If no clear multi-header row found, check for single signature indicator
  if (headerRowIndex === -1 || maxMatchedHeaders < 1) {
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      const rowStr = row.map((c: any) => normalizeString(String(c || ''))).join(' ');
      if (
        rowStr.includes('scv') ||
        rowStr.includes('socongvan') ||
        rowStr.includes('congvan') ||
        rowStr.includes('ngaygui') ||
        rowStr.includes('trichyeu')
      ) {
        headerRowIndex = r;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  // 2. Map columns from header row
  const rawHeaders: string[] = rows[headerRowIndex].map((cell: any) => String(cell || '').trim());
  const columnMapping: { index: number; originalHeader: string; mappedField: string | null }[] = [];
  const unrecognizedColumns: string[] = [];
  const detectedColumns: { excelHeader: string; mappedField: string }[] = [];

  rawHeaders.forEach((headerText, index) => {
    if (!headerText) return;
    const mapped = matchFieldToHeader(headerText, customColumns);
    columnMapping.push({ index, originalHeader: headerText, mappedField: mapped });
    if (mapped) {
      detectedColumns.push({ excelHeader: headerText, mappedField: mapped });
    } else {
      unrecognizedColumns.push(headerText);
    }
  });

  const parsedItems: Dispatch[] = [];

  // 3. Parse subsequent data rows with Date Carry-over & Hierarchy support
  let lastSeenNgayGui = '';

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell: any) => String(cell || '').trim() === '')) {
      continue;
    }

    // Check if this row is purely a Date Group Row (e.g. "18/06/2026" with all other cells empty)
    const nonDateValues = row.filter((c: any) => {
      const s = String(c || '').trim();
      return s !== '' && !isDateLike(s);
    });

    if (nonDateValues.length === 0) {
      // Find the date cell
      const dateCell = row.find((c: any) => isDateLike(c));
      if (dateCell) {
        lastSeenNgayGui = formatDateValue(dateCell);
      }
      continue;
    }

    const rowObj: Partial<Dispatch> = {
      id: `imported-${Date.now()}-${r}`,
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    columnMapping.forEach(({ index, mappedField, originalHeader }) => {
      const cellValue = row[index];
      if (cellValue === undefined || cellValue === null || String(cellValue).trim() === '') return;

      if (mappedField) {
        if (mappedField.startsWith('custom_')) {
          const customKey = mappedField.replace('custom_', '');
          rowObj.customFields![customKey] = cellValue;
        } else if (
          mappedField === 'ngayGui' ||
          mappedField === 'ngayPhatHanh' ||
          mappedField === 'hanBaoCaoXuLy'
        ) {
          (rowObj as any)[mappedField] = formatDateValue(cellValue);
        } else {
          (rowObj as any)[mappedField] = String(cellValue).trim();
        }
      } else {
        const cleanKey = originalHeader.trim();
        rowObj.customFields![cleanKey] = cellValue;
      }
    });

    // If neither soCongVan nor tenCongVan is found, check if cells contain them positionally
    if (!rowObj.soCongVan && !rowObj.tenCongVan) {
      // Look for a cell that looks like a dispatch number (e.g. 4320/BTP-CQLTHADS)
      const dispatchNumberCell = row.find((c: any) => {
        const s = String(c || '').trim();
        return /\d+\/[A-Za-z0-9-]+/.test(s);
      });
      if (dispatchNumberCell) {
        rowObj.soCongVan = String(dispatchNumberCell).trim();
      } else {
        continue; // skip invalid row
      }
    }

    // Set fallback values and carry-overs
    if (!rowObj.ngayGui) {
      rowObj.ngayGui = lastSeenNgayGui || formatDateValue(new Date());
    } else {
      lastSeenNgayGui = rowObj.ngayGui;
    }

    if (!rowObj.soCongVan) {
      rowObj.soCongVan = `CV-${Date.now().toString().slice(-4)}-${r}`;
    }

    if (!rowObj.tenCongVan) {
      rowObj.tenCongVan = 'Công văn chưa có trích yếu';
    }

    // Smart inference for issuing agency
    if (!rowObj.donViBanHanh || rowObj.donViBanHanh === 'Chưa xác định') {
      rowObj.donViBanHanh = inferAgencyFromDispatchNumber(rowObj.soCongVan);
    }

    // Smart inference for assignee from notes
    if (!rowObj.nguoiThucHien || rowObj.nguoiThucHien === 'Chưa phân công') {
      if (rowObj.ghiChu) {
        const inferredName = inferAssigneeFromNotes(rowObj.ghiChu);
        if (inferredName !== 'Chưa phân công') {
          rowObj.nguoiThucHien = inferredName;
        } else {
          rowObj.nguoiThucHien = 'Chưa phân công';
        }
      } else {
        rowObj.nguoiThucHien = 'Chưa phân công';
      }
    }

    if (!rowObj.ghiChu) {
      rowObj.ghiChu = '';
    }

    // Calculate time status and resolve exact status
    const timing = calculateTimeRemaining(rowObj.hanBaoCaoXuLy || '', rowObj.trangThai, rowObj.thoiHanXuLy);
    if (!rowObj.thoiHanXuLy) {
      rowObj.thoiHanXuLy = timing.text;
    }
    rowObj.trangThai = resolveDispatchStatus(rowObj);

    parsedItems.push(rowObj as Dispatch);
  }

  // 4. Reconciliation against existingDispatches
  const newItems: Dispatch[] = [];
  const existingMatches: ReconciledExistingItem[] = [];

  const existingMap = new Map<string, Dispatch>();
  existingDispatches.forEach(disp => {
    const key = normalizeDispatchKey(disp.soCongVan);
    if (key) {
      existingMap.set(key, disp);
    }
  });

  const fieldLabels: Record<string, string> = {
    ngayGui: 'Ngày gửi',
    soCongVan: 'Số công văn',
    ngayPhatHanh: 'Ngày phát hành',
    tenCongVan: 'Tên công văn',
    hanBaoCaoXuLy: 'Hạn báo cáo, xử lý',
    thoiHanXuLy: 'Thời hạn xử lý',
    donViBanHanh: 'Đơn vị ban hành',
    nguoiThucHien: 'Người thực hiện',
    ghiChu: 'Ghi chú'
  };

  parsedItems.forEach(incoming => {
    const normalizedKey = normalizeDispatchKey(incoming.soCongVan);
    const matchedExisting = normalizedKey ? existingMap.get(normalizedKey) : null;

    if (matchedExisting) {
      const differences: ReconciledDifference[] = [];
      const keysToCheck: (keyof Dispatch)[] = [
        'ngayGui',
        'ngayPhatHanh',
        'tenCongVan',
        'hanBaoCaoXuLy',
        'thoiHanXuLy',
        'donViBanHanh',
        'nguoiThucHien',
        'ghiChu'
      ];

      keysToCheck.forEach(key => {
        const oldVal = (matchedExisting as any)[key] || '';
        const newVal = (incoming as any)[key] || '';
        if (oldVal !== newVal && newVal !== '') {
          differences.push({
            field: String(key),
            fieldLabel: fieldLabels[String(key)] || String(key),
            oldValue: oldVal,
            newValue: newVal
          });
        }
      });

      // Check custom fields differences
      if (incoming.customFields) {
        Object.entries(incoming.customFields).forEach(([cKey, cVal]) => {
          const oldCVal = matchedExisting.customFields?.[cKey] || '';
          if (oldCVal !== cVal && cVal !== '') {
            differences.push({
              field: `custom_${cKey}`,
              fieldLabel: cKey,
              oldValue: oldCVal,
              newValue: cVal
            });
          }
        });
      }

      existingMatches.push({
        existing: matchedExisting,
        incoming,
        differences,
        action: 'UPDATE'
      });
    } else {
      newItems.push(incoming);
    }
  });

  return {
    fileName: sourceName,
    totalRowsParsed: parsedItems.length,
    newItems,
    existingMatches,
    unrecognizedColumns,
    detectedColumns
  };
};

/**
 * Parse Excel file and reconcile against existing records
 */
export const parseExcelAndReconcile = async (
  file: File,
  existingDispatches: Dispatch[],
  customColumns: ColumnDefinition[]
): Promise<ExcelImportAnalysis> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: true, type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  return parseRowsToAnalysis(rows, file.name, existingDispatches, customColumns);
};

/**
 * Parse pasted text and reconcile against existing records
 */
export const parsePastedTextAndReconcile = (
  text: string,
  existingDispatches: Dispatch[],
  customColumns: ColumnDefinition[]
): ExcelImportAnalysis => {
  const rows = parseTextToRows(text);
  return parseRowsToAnalysis(rows, 'Dữ liệu dán trực tiếp', existingDispatches, customColumns);
};

/**
 * Export dispatches to an Excel file formatted matching the leadership document template
 */
export const exportDispatchesToExcel = (
  dispatches: Dispatch[],
  columns: ColumnDefinition[],
  reportTitle: string = 'CÔNG VĂN GỬI LÃNH ĐẠO'
) => {
  const visibleColumns = columns.filter(c => c.visible);
  const headerLabels = visibleColumns.map(c => c.label.toUpperCase());
  const tableData: any[][] = [];

  const titleRow = new Array(visibleColumns.length).fill('');
  titleRow[0] = reportTitle.toUpperCase();
  tableData.push(titleRow);
  tableData.push(headerLabels);

  dispatches.forEach(item => {
    const row = visibleColumns.map(col => {
      if (col.isCustom) {
        const val = item.customFields?.[col.id];
        if (val && typeof val === 'object' && val.name) {
          return val.name;
        }
        return val ?? '';
      }
      const standardVal = (item as any)[col.id];
      if (standardVal && typeof standardVal === 'object' && standardVal.name) {
        return standardVal.name;
      }
      return standardVal ?? '';
    });
    tableData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(tableData);

  if (visibleColumns.length > 1) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: visibleColumns.length - 1 } }
    ];
  }

  ws['!cols'] = visibleColumns.map(c => {
    if (c.id === 'tenCongVan') return { wch: 45 };
    if (c.id === 'ghiChu') return { wch: 30 };
    if (c.id === 'donViBanHanh') return { wch: 22 };
    if (c.id === 'soCongVan') return { wch: 18 };
    if (c.id === 'thoiHanXuLy') return { wch: 18 };
    return { wch: 15 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CongVanLanhDao');

  const currentDate = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `BaoCao_TienDo_CongVan_LanhDao_${currentDate}.xlsx`);
};

/**
 * Xuất dữ liệu công văn gửi Lãnh đạo dưới dạng file Excel
 * Đầy đủ cột nghiệp vụ: Chỉ đạo Viện trưởng, PVT phụ trách, Trưởng phòng thụ lý, tiến độ, báo cáo
 */
export const exportLeadershipReportToExcel = (
  dispatches: Dispatch[],
  title: string = 'BÁO CÁO TIẾN ĐỘ XỬ LÝ CÔNG VĂN GỬI LÃNH ĐẠO VIỆN KIỂM SÁT'
) => {
  const headers = [
    'STT',
    'Số công văn',
    'Ngày gửi/nhận',
    'Ngày ban hành',
    'Đơn vị ban hành',
    'Trích yếu nội dung',
    'Phó Viện Trưởng phụ trách',
    'Chỉ đạo của Viện Trưởng',
    'Phòng ban thụ lý',
    'Chỉ đạo của PVT',
    'Cán bộ thực hiện',
    'Hạn báo cáo / xử lý',
    'Tình trạng thời hạn',
    'Tiến độ (%)',
    'Trạng thái',
    'Báo cáo kết quả / tiến độ'
  ];

  const tableData: any[][] = [];
  const titleRow = new Array(headers.length).fill('');
  titleRow[0] = title.toUpperCase();
  tableData.push(titleRow);
  tableData.push(headers);

  dispatches.forEach((d, idx) => {
    tableData.push([
      idx + 1,
      d.soCongVan || '',
      d.ngayGui || '',
      d.ngayPhatHanh || '',
      d.donViBanHanh || '',
      d.tenCongVan || '',
      d.assignedPvtName || '',
      d.vtChiDao || '',
      d.assignedTpName || '',
      d.pvtChiDao || '',
      d.nguoiThucHien || '',
      d.hanBaoCaoXuLy || '',
      d.thoiHanXuLy || '',
      `${d.tienDo ?? 0}%`,
      d.trangThai === 'HOAN_THANH'
        ? 'Đã hoàn thành'
        : d.trangThai === 'QUA_HAN'
        ? 'Quá hạn'
        : d.trangThai === 'SAP_DEN_HAN'
        ? 'Sắp đến hạn'
        : 'Đang xử lý',
      d.baoCaoTienDo || ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(tableData);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }
  ];

  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    { wch: 45 },
    { wch: 24 },
    { wch: 30 },
    { wch: 24 },
    { wch: 30 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 35 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoLanhDao');
  const currentDate = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `BaoCao_CongVan_Gui_LanhDao_${currentDate}.xlsx`);
};

/**
 * Generate and download a sample Excel template matching the exact leadership specification
 */
export const downloadSampleTemplate = (columns: ColumnDefinition[]) => {
  const visibleColumns = columns.filter(c => c.visible);
  const headerLabels = visibleColumns.map(c => c.label.toUpperCase());

  const sampleRows = [
    [
      '2026-06-18',
      '4320/BTP-CQLTHADS',
      '2026-06-17',
      'V/v phối hợp thực hiện Quy chế số 14/2013/QCLN/BTP-BCA-TANDTC-VKSNDTC',
      '2026-06-28',
      'Còn 10 ngày',
      'Bộ Tư pháp (Cục QLTHADS)',
      'Nguyễn Phước Trung',
      'Chuyển PVT - Nguyễn Phước Trung'
    ],
    [
      '2026-09-16',
      '188/UBND-TH',
      '2026-09-15',
      'Báo cáo tổng kết công tác chỉ đạo điều hành Quý III và nhiệm vụ trọng tâm Quý IV',
      '2026-09-22',
      'Còn 6 ngày',
      'Văn phòng UBND',
      'Nguyễn Văn An',
      'Xin ý kiến Thường trực Lãnh đạo trước ngày 20/9'
    ],
    [
      '2026-09-14',
      '95/KH-SXD',
      '2026-09-12',
      'Kế hoạch kiểm tra quy hoạch đô thị và các dự án phát triển nhà ở xã hội',
      '2026-09-18',
      'Còn 2 ngày',
      'Sở Xây dựng',
      'Lê Thị Mai',
      'Chuẩn bị tài liệu cho buổi làm việc với Đoàn công tác'
    ]
  ];

  const tableData: any[][] = [];
  const titleRow = new Array(visibleColumns.length).fill('');
  titleRow[0] = 'CÔNG VĂN GỬI LÃNH ĐẠO';
  tableData.push(titleRow);
  tableData.push(headerLabels);

  sampleRows.forEach(row => {
    const fullRow = [...row];
    while (fullRow.length < visibleColumns.length) {
      fullRow.push('');
    }
    tableData.push(fullRow.slice(0, visibleColumns.length));
  });

  const ws = XLSX.utils.aoa_to_sheet(tableData);
  if (visibleColumns.length > 1) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: visibleColumns.length - 1 } }
    ];
  }

  ws['!cols'] = visibleColumns.map(c => {
    if (c.id === 'tenCongVan') return { wch: 45 };
    if (c.id === 'ghiChu') return { wch: 30 };
    if (c.id === 'donViBanHanh') return { wch: 22 };
    if (c.id === 'soCongVan') return { wch: 18 };
    return { wch: 16 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BieuMau_CongVan');
  XLSX.writeFile(wb, 'BieuMau_CongVan_GuiLanhDao.xlsx');
};
