export type UserRole = 'ADMIN' | 'VIEN_TRUONG' | 'PHO_VIEN_TRUONG' | 'TRUONG_PHONG';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  roomCode: string;       // e.g. 'ADMIN', 'VT', 'PVT1'...'PVT12', 'TP1'...'TP12'
  pvtManagerId?: string; // If TRUONG_PHONG, which PVT manages this department
  phone?: string;
  email?: string;
  active?: number;
}

export interface AssignmentRecord {
  id: string;
  dispatchId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  assignLevel: 'VT_TO_PVT' | 'PVT_TO_TP' | 'TP_TO_STAFF';
  chiDao?: string;
  hanXuLy?: string;
  createdAt: string;
}

export interface PVTStatItem {
  id: string;
  code: string;
  name: string;
  total: number;
  completed: number;
  overdue: number;
  pending: number;
  completionRate: number;
}

export interface TPStatItem {
  id: string;
  code: string;
  name: string;
  pvtManagerId?: string;
  total: number;
  completed: number;
  overdue: number;
  pending: number;
  completionRate: number;
}

export interface VTDashboardStatsResponse {
  summary: {
    total: number;
    hoanThanh: number;
    dangXuLy: number;
    sapDenHan: number;
    quaHan: number;
    chuaPhanCongPvt: number;
    daPhanCongPvt: number;
    rateOnTime: number;
  };
  pvtStats: PVTStatItem[];
  tpStats: TPStatItem[];
}
