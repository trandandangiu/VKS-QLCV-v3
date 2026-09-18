import { ColumnDefinition, Dispatch } from '../types/dispatch';

export const DEFAULT_COLUMNS: ColumnDefinition[] = [
  {
    id: 'ngayGui',
    label: 'NGÀY GỬI',
    type: 'date',
    required: true,
    visible: true,
    isCustom: false,
    width: '140px',
    description: 'Ngày gửi hoặc tiếp nhận công văn'
  },
  {
    id: 'soCongVan',
    label: 'SỐ CÔNG VĂN',
    type: 'text',
    required: true,
    visible: true,
    isCustom: false,
    width: '190px',
    description: 'Số ký hiệu công văn (khóa đối chiếu duy nhất)'
  },
  {
    id: 'ngayPhatHanh',
    label: 'NGÀY PHÁT HÀNH',
    type: 'date',
    required: false,
    visible: true,
    isCustom: false,
    width: '160px',
    description: 'Ngày ký phát hành văn bản'
  },
  {
    id: 'tenCongVan',
    label: 'TÊN CÔNG VĂN',
    type: 'text',
    required: true,
    visible: true,
    isCustom: false,
    width: '460px',
    description: 'Trích yếu nội dung công văn gửi lãnh đạo'
  },
  {
    id: 'hanBaoCaoXuLy',
    label: 'HẠN BÁO CÁO, XỬ LÝ',
    type: 'date',
    required: true,
    visible: true,
    isCustom: false,
    width: '180px',
    description: 'Thời hạn hoàn thành báo cáo cho lãnh đạo'
  },
  {
    id: 'thoiHanXuLy',
    label: 'THỜI HẠN XỬ LÝ',
    type: 'badge',
    required: false,
    visible: true,
    isCustom: false,
    width: '170px',
    description: 'Tình trạng thời hạn (Còn hạn, Sắp hết hạn, Quá hạn)'
  },
  {
    id: 'donViBanHanh',
    label: 'ĐƠN VỊ BAN HÀNH',
    type: 'text',
    required: true,
    visible: true,
    isCustom: false,
    width: '240px',
    description: 'Cơ quan, tổ chức hoặc phòng ban ban hành'
  },
  {
    id: 'nguoiThucHien',
    label: 'NGƯỜI THỰC HIỆN',
    type: 'text',
    required: false,
    visible: true,
    isCustom: false,
    width: '200px',
    description: 'Cán bộ, chuyên viên phụ trách xử lý'
  },
  {
    id: 'ghiChu',
    label: 'GHI CHÚ',
    type: 'text',
    required: false,
    visible: true,
    isCustom: false,
    width: '300px',
    description: 'Ý kiến chỉ đạo, kết quả hoặc lưu ý thêm'
  }
];

export const INITIAL_DISPATCHES: Dispatch[] = [
  {
    id: 'cv-001',
    ngayGui: '2026-09-12',
    soCongVan: '142/BC-UBND',
    ngayPhatHanh: '2026-09-10',
    tenCongVan: 'Báo cáo rà soát tiến độ giải ngân vốn đầu tư công Quý III và chuẩn bị kế hoạch năm 2027',
    hanBaoCaoXuLy: '2026-09-18',
    thoiHanXuLy: 'Còn 2 ngày',
    donViBanHanh: 'UBND Tỉnh',
    nguoiThucHien: 'Trần Văn Minh',
    ghiChu: 'Lãnh đạo yêu cầu tổng hợp số liệu chi tiết từng dự án trọng điểm trước 15h',
    trangThai: 'SAP_DEN_HAN',
    mucDoKhan: 'KHAN',
    tienDo: 75,
    customFields: {
      'yKienChiDao': 'Đ/c Phó Chủ tịch trực tiếp chủ trì giao ban',
      'phongBanPhoiHop': 'Sở Tài chính, Sở Kế hoạch & Đầu tư'
    },
    createdAt: '2026-09-12T08:00:00Z',
    updatedAt: '2026-09-15T14:30:00Z'
  },
  {
    id: 'cv-002',
    ngayGui: '2026-09-08',
    soCongVan: '89/CĐ-TTg',
    ngayPhatHanh: '2026-09-07',
    tenCongVan: 'Công điện khẩn về việc chủ động ứng phó thiên tai, bão lũ và đảm bảo an toàn đê điều',
    hanBaoCaoXuLy: '2026-09-14',
    thoiHanXuLy: 'Quá hạn 2 ngày',
    donViBanHanh: 'Văn phòng Chính phủ',
    nguoiThucHien: 'Nguyễn Thị Hương',
    ghiChu: 'Đã hoàn thành dự thảo văn bản chỉ đạo, đang chờ Lãnh đạo ký duyệt',
    trangThai: 'QUA_HAN',
    mucDoKhan: 'HOA_TOC',
    tienDo: 90,
    customFields: {
      'yKienChiDao': 'Trình ký gấp trong sáng nay',
      'phongBanPhoiHop': 'Ban Chỉ huy PCTT & TKCN'
    },
    createdAt: '2026-09-08T09:15:00Z',
    updatedAt: '2026-09-15T17:00:00Z'
  },
  {
    id: 'cv-003',
    ngayGui: '2026-09-14',
    soCongVan: '315/TB-VKS',
    ngayPhatHanh: '2026-09-13',
    tenCongVan: 'Thông báo kết luận của Viện trưởng tại Hội nghị giao ban công tác kiểm sát tháng 9',
    hanBaoCaoXuLy: '2026-09-25',
    thoiHanXuLy: 'Còn 9 ngày',
    donViBanHanh: 'VKSND Tối cao',
    nguoiThucHien: 'Lê Hoàng Nam',
    ghiChu: 'Phân công các phòng nghiệp vụ xây dựng kế hoạch triển khai chi tiết',
    trangThai: 'DANG_XU_LY',
    mucDoKhan: 'THUONG',
    tienDo: 40,
    customFields: {
      'yKienChiDao': 'Các phòng báo cáo trước ngày 22/9',
      'phongBanPhoiHop': 'Phòng 1, Phòng 2, Văn phòng'
    },
    createdAt: '2026-09-14T10:30:00Z',
    updatedAt: '2026-09-14T10:30:00Z'
  },
  {
    id: 'cv-004',
    ngayGui: '2026-09-05',
    soCongVan: '56/KH-TTr',
    ngayPhatHanh: '2026-09-03',
    tenCongVan: 'Kế hoạch kiểm tra, xác minh giải quyết đơn thư khiếu nại, tố cáo kéo dài trên địa bàn',
    hanBaoCaoXuLy: '2026-09-12',
    thoiHanXuLy: 'Đã hoàn thành',
    donViBanHanh: 'Thanh tra Tỉnh',
    nguoiThucHien: 'Vũ Quốc Toàn',
    ghiChu: 'Đã gửi báo cáo tổng hợp và biên bản làm việc cho Thường trực Tỉnh ủy',
    trangThai: 'HOAN_THANH',
    mucDoKhan: 'THUONG',
    tienDo: 100,
    customFields: {
      'yKienChiDao': 'Đã hoàn tất lưu hồ sơ theo dõi',
      'phongBanPhoiHop': 'Ban Tiếp công dân'
    },
    createdAt: '2026-09-05T08:45:00Z',
    updatedAt: '2026-09-12T16:00:00Z'
  },
  {
    id: 'cv-005',
    ngayGui: '2026-09-15',
    soCongVan: '204/TTr-STC',
    ngayPhatHanh: '2026-09-15',
    tenCongVan: 'Tờ trình về việc phân bổ dự toán kinh phí chuyển đổi số và ứng dụng CNTT ngành tư pháp',
    hanBaoCaoXuLy: '2026-09-20',
    thoiHanXuLy: 'Còn 4 ngày',
    donViBanHanh: 'Sở Tài chính',
    nguoiThucHien: 'Phạm Thu Trang',
    ghiChu: 'Đang thẩm định định mức thiết bị công nghệ và phần mềm quản trị',
    trangThai: 'DANG_XU_LY',
    mucDoKhan: 'KHAN',
    tienDo: 30,
    customFields: {
      'yKienChiDao': 'Xem xét kỹ sự phù hợp danh mục mua sắm',
      'phongBanPhoiHop': 'Sở Thông tin và Truyền thông'
    },
    createdAt: '2026-09-15T11:20:00Z',
    updatedAt: '2026-09-16T08:00:00Z'
  },
  {
    id: 'cv-btp-4320',
    ngayGui: '2026-06-15',
    soCongVan: '4320/BTP-CQLTHADS',
    ngayPhatHanh: '2026-06-17',
    tenCongVan: 'V/v phối hợp thực hiện Quy chế số 14/2013/QCLN/BTP-BCA-TANDTC-VKSNDTC',
    hanBaoCaoXuLy: '2026-06-25',
    thoiHanXuLy: 'Còn 7 ngày',
    donViBanHanh: 'Bộ Tư pháp (Cục QLTHADS)',
    nguoiThucHien: 'Chưa phân công',
    ghiChu: 'Chờ phân công cán bộ xử lý',
    trangThai: 'DANG_XU_LY',
    mucDoKhan: 'THUONG',
    tienDo: 25,
    customFields: {},
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-06-15T08:00:00Z'
  }
];

export const STORAGE_KEY_DISPATCHES = 'GOV_DISPATCH_MANAGEMENT_ITEMS_V4';
export const STORAGE_KEY_COLUMNS = 'GOV_DISPATCH_MANAGEMENT_COLUMNS_V4';
export const STORAGE_KEY_CLEARED = 'GOV_DISPATCH_MANAGEMENT_CLEARED_V4';

export const loadDispatchesFromStorage = (): Dispatch[] => {
  try {
    const isCleared = localStorage.getItem(STORAGE_KEY_CLEARED);
    if (isCleared === 'true') {
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY_DISPATCHES);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    // Since user specifically requested "Xóa hết", default state is clean empty array
    localStorage.setItem(STORAGE_KEY_CLEARED, 'true');
    localStorage.setItem(STORAGE_KEY_DISPATCHES, JSON.stringify([]));
    return [];
  } catch (error) {
    console.error('Lỗi khi đọc danh sách công văn từ Storage:', error);
    return [];
  }
};

export const clearAllDispatchesFromStorage = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CLEARED, 'true');
    localStorage.setItem(STORAGE_KEY_DISPATCHES, JSON.stringify([]));
  } catch (error) {
    console.error('Lỗi khi xóa danh sách công văn trong Storage:', error);
  }
};

export const restoreSampleDispatchesToStorage = (): Dispatch[] => {
  try {
    localStorage.setItem(STORAGE_KEY_CLEARED, 'false');
    localStorage.setItem(STORAGE_KEY_DISPATCHES, JSON.stringify(INITIAL_DISPATCHES));
    return INITIAL_DISPATCHES;
  } catch (error) {
    console.error('Lỗi khi khôi phục dữ liệu mẫu vào Storage:', error);
    return INITIAL_DISPATCHES;
  }
};

export const saveDispatchesToStorage = (dispatches: Dispatch[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_DISPATCHES, JSON.stringify(dispatches));
    if (dispatches.length > 0) {
      localStorage.setItem(STORAGE_KEY_CLEARED, 'false');
    }
  } catch (error) {
    console.error('Lỗi khi lưu danh sách công văn vào Storage:', error);
  }
};

export const loadColumnsFromStorage = (): ColumnDefinition[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLUMNS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(DEFAULT_COLUMNS));
      return DEFAULT_COLUMNS;
    }
    const parsed: ColumnDefinition[] = JSON.parse(raw);
    // Upgrade existing default columns with new generous widths
    const upgraded = parsed.map(col => {
      const def = DEFAULT_COLUMNS.find(d => d.id === col.id);
      if (def && !col.isCustom) {
        return {
          ...col,
          width: def.width
        };
      }
      return col;
    });
    return upgraded;
  } catch (error) {
    console.error('Lỗi khi đọc cấu hình cột từ Storage:', error);
    return DEFAULT_COLUMNS;
  }
};

export const saveColumnsToStorage = (columns: ColumnDefinition[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(columns));
  } catch (error) {
    console.error('Lỗi khi lưu cấu hình cột vào Storage:', error);
  }
};
