import { Dispatch } from '../types/dispatch';
import { User, VTDashboardStatsResponse } from '../types/auth';

const API_BASE = '/api';

export const apiClient = {
  // 1. Auth & Users
  async login(username: string, password: string):Promise<{ success: boolean; user?: User; token?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('CURRENT_USER_SESSION', JSON.stringify(data.user));
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem('CURRENT_USER_SESSION');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('CURRENT_USER_SESSION', JSON.stringify(user));
    } else {
      localStorage.removeItem('CURRENT_USER_SESSION');
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      return data.success ? data.users : [];
    } catch (e) {
      console.error('Lỗi khi lấy danh sách users:', e);
      return [];
    }
  },

  async createUser(userData: Partial<User & { password?: string }>): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (e: any) {
      console.error('Lỗi khi tạo user:', e);
      return { success: false, message: e.message };
    }
  },

  async updateUser(id: string, updates: Partial<User & { password?: string }>): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.user : null;
    } catch (e) {
      console.error('Lỗi khi cập nhật user:', e);
      return null;
    }
  },

  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e: any) {
      console.error('Lỗi khi xóa user:', e);
      return { success: false, message: e.message };
    }
  },

  // 2. Dispatches
  async getDispatches(params?: { role?: string; userId?: string; roomCode?: string }): Promise<Dispatch[]> {
    try {
      const query = new URLSearchParams();
      if (params?.role) query.set('role', params.role);
      if (params?.userId) query.set('userId', params.userId);
      if (params?.roomCode) query.set('roomCode', params.roomCode);

      const res = await fetch(`${API_BASE}/dispatches?${query.toString()}`);
      const data = await res.json();
      return data.success ? data.dispatches : [];
    } catch (e) {
      console.error('Lỗi khi tải danh sách công văn:', e);
      return [];
    }
  },

  async createDispatch(dispatchData: Partial<Dispatch>): Promise<Dispatch | null> {
    try {
      const res = await fetch(`${API_BASE}/dispatches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatchData)
      });
      const data = await res.json();
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi tạo công văn:', e);
      return null;
    }
  },

  async updateDispatch(id: string, updates: Partial<Dispatch>): Promise<Dispatch | null> {
    try {
      const res = await fetch(`${API_BASE}/dispatches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi cập nhật công văn:', e);
      return null;
    }
  },

  async deleteDispatch(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/dispatches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.error('Lỗi khi xóa công văn:', e);
      return false;
    }
  },

  async bulkDeleteDispatches(ids: string[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/dispatches/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.error('Lỗi khi xóa nhiều công văn:', e);
      return false;
    }
  },

  async clearAllDispatches(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/dispatches/clear-all`, { method: 'POST' });
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.error('Lỗi khi xóa sạch công văn:', e);
      return false;
    }
  },

  async restoreSampleDispatches(): Promise<Dispatch[]> {
    try {
      const res = await fetch(`${API_BASE}/dispatches/restore-samples`, { method: 'POST' });
      const data = await res.json();
      return data.success ? data.dispatches : [];
    } catch (e) {
      console.error('Lỗi khi khôi phục dữ liệu mẫu:', e);
      return [];
    }
  },

  // 3. Phân công Viện Trưởng -> PVT
  async assignToPvt(
    dispatchId: string,
    payload: {
      pvtId: string;
      pvtName: string;
      vtChiDao: string;
      hanBaoCaoXuLy?: string;
      mucDoKhan?: string;
    }
  ): Promise<Dispatch | null> {
    try {
      const res = await fetch(`${API_BASE}/dispatches/${dispatchId}/assign-pvt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi phân công PVT:', e);
      return null;
    }
  },

  // 4. Phân công PVT -> Trưởng phòng
  async assignToTp(
    dispatchId: string,
    payload: {
      fromPvtId: string;
      fromPvtName: string;
      tpId: string;
      tpName: string;
      pvtChiDao: string;
      hanBaoCaoXuLy?: string;
    }
  ): Promise<Dispatch | null> {
    try {
      const res = await fetch(`${API_BASE}/dispatches/${dispatchId}/assign-tp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi phân công Trưởng phòng:', e);
      return null;
    }
  },

  // 5. Trưởng phòng báo cáo tiến độ & cán bộ thực hiện
  async reportProgress(
    dispatchId: string,
    payload: {
      tienDo?: number;
      trangThai?: string;
      baoCaoTienDo?: string;
      nguoiThucHien?: string;
    }
  ): Promise<Dispatch | null> {
    try {
      const res = await fetch(`${API_BASE}/dispatches/${dispatchId}/report-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi báo cáo tiến độ:', e);
      return null;
    }
  },

  // 6. Thống kê Viện Trưởng Dashboard (Pie Charts)
  async getVTDashboardStats(): Promise<VTDashboardStatsResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/stats/vt-dashboard`);
      const data = await res.json();
      return data.success ? data : null;
    } catch (e) {
      console.error('Lỗi khi lấy thống kê VT Dashboard:', e);
      return null;
    }
  },

  // 7. Thông tin mạng Local Network
  async getNetworkInfo(): Promise<{ success: boolean; networks: any[]; primaryUrl: string; hostname: string }> {
    try {
      const res = await fetch(`${API_BASE}/system/network-info`);
      return await res.json();
    } catch (e) {
      return {
        success: false,
        networks: [{ interface: 'Local', ip: 'localhost', url: 'http://localhost:3000' }],
        primaryUrl: 'http://localhost:3000',
        hostname: 'localhost'
      };
    }
  }
};
