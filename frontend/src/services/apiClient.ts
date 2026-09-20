// frontend/src/services/apiClient.ts
import { Dispatch } from '../types/dispatch';
import { User, LoginResponse, VTDashboardStatsResponse } from '../types/auth';

const API_BASE = '/api';

// Token keys
const TOKEN_KEY = 'access_token';
const USER_KEY = 'current_user';

// ============================================
// HELPER — Fetch với token
// ============================================
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  // Handle 401 — token hết hạn
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Check content-type
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error(`Backend trả về không phải JSON (${res.status}):`, text.substring(0, 200));
    throw new Error(`Server trả về lỗi ${res.status}`);
  }

  return await res.json();
}

// ============================================
// API CLIENT
// ============================================
export const apiClient = {
  // ============================================
  // 1. AUTH
  // ============================================
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: false, message: `Lỗi server (${res.status})` };
      }

      const data = await res.json();

      if (data.success && data.user && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (e: any) {
      console.error('Lỗi login:', e);
      return { success: false, message: e.message };
    }
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  async fetchCurrentUser(): Promise<User | null> {
    try {
      const data = await request<{ success: boolean; user: User }>('/auth/me');
      if (data.success && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (e) {
      console.error('Lỗi khi fetch current user:', e);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Bỏ qua
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // ============================================
  // 2. USERS
  // ============================================
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<User[]> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.role) query.set('role', params.role);

      const data = await request<{ success: boolean; users: User[] }>(
        `/users?${query.toString()}`
      );
      return data.success ? data.users : [];
    } catch (e) {
      console.error('Lỗi khi lấy danh sách users:', e);
      return [];
    }
  },

  async createUser(
    userData: Partial<User & { password?: string; roleIds?: number[] }>
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      return await request('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async updateUser(
    id: string,
    updates: Partial<User & { password?: string }>
  ): Promise<User | null> {
    try {
      const data = await request<{ success: boolean; user: User }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data.success ? data.user : null;
    } catch (e) {
      console.error('Lỗi khi cập nhật user:', e);
      return null;
    }
  },

  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await request(`/users/${id}`, { method: 'DELETE' });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async resetPassword(
    id: string,
    newPassword?: string
  ): Promise<{ success: boolean; message?: string; newPassword?: string }> {
    try {
      return await request(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async assignRoles(
    userId: string,
    roleIds: number[]
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await request(`/users/${userId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleIds }),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async toggleActive(
    userId: string
  ): Promise<{ success: boolean; message?: string; active?: boolean }> {
    try {
      return await request(`/users/${userId}/toggle-active`, {
        method: 'PATCH',
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // ============================================
  // 3. DISPATCHES
  // ============================================
  async getDispatches(params?: {
    page?: number;
    limit?: number;
    search?: string;
    trangThai?: string;
    mucDoKhan?: string;
    role?: string;
    userId?: string;
    roomCode?: string;
    assignedPvtId?: string;
    assignedTpId?: string;
    dateFrom?: string;
    dateTo?: string;
    includeDeleted?: boolean;
  }): Promise<Dispatch[]> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.trangThai) query.set('trangThai', params.trangThai);
      if (params?.mucDoKhan) query.set('mucDoKhan', params.mucDoKhan);
      if (params?.role) query.set('role', params.role);
      if (params?.userId) query.set('userId', params.userId);
      if (params?.roomCode) query.set('roomCode', params.roomCode);
      if (params?.assignedPvtId) query.set('assignedPvtId', params.assignedPvtId);
      if (params?.assignedTpId) query.set('assignedTpId', params.assignedTpId);
      if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
      if (params?.dateTo) query.set('dateTo', params.dateTo);

      const data = await request<{ success: boolean; dispatches: Dispatch[] }>(
        `/dispatches?${query.toString()}`
      );
      return data.success ? data.dispatches : [];
    } catch (e) {
      console.error('Lỗi khi tải danh sách công văn:', e);
      return [];
    }
  },

  async getDispatchById(id: string): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${id}`
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi lấy chi tiết công văn:', e);
      return null;
    }
  },

  async createDispatch(dispatchData: Partial<Dispatch>): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        '/dispatches',
        {
          method: 'POST',
          body: JSON.stringify(dispatchData),
        }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi tạo công văn:', e);
      return null;
    }
  },

  async updateDispatch(
    id: string,
    updates: Partial<Dispatch>
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi cập nhật công văn:', e);
      return null;
    }
  },
  async markComplete(
    id: string,
    note?: string
  ): Promise<{ success: boolean; message?: string; dispatch?: Dispatch }> {
    try {
      return await request(`/dispatches/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
  // ============================================
  // 9. ATTACHMENTS — File đính kèm
  // ============================================
  async uploadAttachment(
    dispatchId: string,
    file: File,
    fileCategory: string = 'ORIGINAL',
    description?: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileCategory', fileCategory);
      if (description) formData.append('description', description);

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/dispatches/${dispatchId}/attachments`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      const data = await res.json();
      return data;
    } catch (e: any) {
      console.error('Lỗi upload attachment:', e);
      return { success: false, message: e.message };
    }
  },

  async getAttachments(dispatchId: string): Promise<any[]> {
    try {
      const data = await request<{ success: boolean; attachments: any[] }>(
        `/dispatches/${dispatchId}/attachments`
      );
      return data.success ? data.attachments : [];
    } catch (e) {
      console.error('Lỗi lấy attachments:', e);
      return [];
    }
  },

  async downloadAttachment(attachmentId: string): Promise<void> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/attachments/${attachmentId}/download`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Lấy tên file từ header Content-Disposition hoặc dùng mặc định
      const contentDisposition = res.headers.get('content-disposition');
      let fileName = 'attachment';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) fileName = decodeURIComponent(match[1]);
      }
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi download:', e);
      throw e;
    }
  },

  async deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      const data = await request<{ success: boolean }>(
        `/attachments/${attachmentId}`,
        { method: 'DELETE' }
      );
      return !!data.success;
    } catch (e) {
      console.error('Lỗi xóa attachment:', e);
      return false;
    }
  },

  async deleteDispatch(id: string): Promise<boolean> {
    try {
      const data = await request<{ success: boolean }>(`/dispatches/${id}`, {
        method: 'DELETE',
      });
      return !!data.success;
    } catch (e) {
      console.error('Lỗi khi xóa công văn:', e);
      return false;
    }
  },

  // ============================================
  // 4. ASSIGNMENTS
  // ============================================
  async assignToPvts(
    dispatchId: string,
    payload: {
      pvts: { pvtId: string; pvtName: string; roomCode?: string; isPrimary?: boolean }[];
      vtChiDao?: string;
      hanBaoCaoXuLy?: string;
      mucDoKhan?: string;
    }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/assign-pvts`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi phân công PVT:', e);
      return null;
    }
  },

  async assignToTps(
    dispatchId: string,
    payload: {
      tps: { tpId: string; tpName: string; roomCode?: string; isPrimary?: boolean }[];
      pvtChiDao?: string;
      hanBaoCaoXuLy?: string;
    }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/assign-tps`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi phân công TP:', e);
      return null;
    }
  },

  async tpNumber(
    dispatchId: string,
    payload: { soCongVanTP: string; ngayDanhSo?: string }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/tp-number`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi đánh số:', e);
      return null;
    }
  },

  async tpSubmit(
    dispatchId: string,
    payload: { baoCaoTienDo: string; tienDo?: number }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/tp-submit`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi TP gửi PVT:', e);
      return null;
    }
  },

  async pvtSubmit(
    dispatchId: string,
    payload: { pvtChiDao: string }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/pvt-submit`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi PVT trình VT:', e);
      return null;
    }
  },

  async vtAgree(dispatchId: string): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/vt-agree`,
        { method: 'POST' }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi VT đồng ý:', e);
      return null;
    }
  },

  async vtDisagree(dispatchId: string, reason: string): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/vt-disagree`,
        { method: 'POST', body: JSON.stringify({ reason }) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi VT không đồng ý:', e);
      return null;
    }
  },

  async pvtDisagree(
    dispatchId: string,
    reason: string,
    tpId?: string
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/pvt-disagree`,
        { method: 'POST', body: JSON.stringify({ reason, tpId }) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi PVT không đồng ý:', e);
      return null;
    }
  },

  async getHistory(dispatchId: string): Promise<any[]> {
    try {
      const data = await request<{ success: boolean; history: any[] }>(
        `/dispatches/${dispatchId}/history`
      );
      return data.success ? data.history : [];
    } catch (e) {
      console.error('Lỗi khi lấy lịch sử:', e);
      return [];
    }
  },

  // ============================================
  // 5. STATS
  // ============================================
  async getVTDashboardStats(): Promise<VTDashboardStatsResponse | null> {
    try {
      const data = await request<VTDashboardStatsResponse>('/stats/vt-overview');
      return data.success ? data : null;
    } catch (e) {
      console.error('Lỗi khi lấy thống kê VT:', e);
      return null;
    }
  },

  async getChartData(): Promise<any | null> {
    try {
      const data = await request<any>('/stats/chart');
      return data.success ? data : null;
    } catch (e) {
      console.error('Lỗi khi lấy chart data:', e);
      return null;
    }
  },

  // ============================================
  // 6. NOTIFICATIONS
  // ============================================
  async getNotifications(params?: { page?: number; isRead?: boolean }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.isRead !== undefined) query.set('isRead', String(params.isRead));

      const data = await request<{ success: boolean; notifications: any[] }>(
        `/notifications?${query.toString()}`
      );
      return data.success ? data.notifications : [];
    } catch (e) {
      console.error('Lỗi khi lấy thông báo:', e);
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const data = await request<{ success: boolean; unreadCount: number }>(
        '/notifications/unread-count'
      );
      return data.success ? data.unreadCount : 0;
    } catch (e) {
      return 0;
    }
  },
};