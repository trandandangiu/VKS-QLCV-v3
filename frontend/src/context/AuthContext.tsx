// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  reloadUsers: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  isAdmin: boolean;
  isVienTruong: boolean;
  isPhoVienTruong: boolean;
  isTruongPhong: boolean;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user khi app khởi động
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const token = apiClient.getToken();

      if (token) {
        // Có token → fetch user mới nhất từ server
        const user = await apiClient.fetchCurrentUser();
        if (user) {
          setCurrentUser(user);
          // Load danh sách users nếu có quyền
          await reloadUsers();
        }
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const reloadUsers = async () => {
    try {
      const users = await apiClient.getAllUsers({ limit: 100 });
      setAllUsers(users);
    } catch (e) {
      console.error('Lỗi khi load users:', e);
    }
  };

  const login = async (username: string, password: string) => {
    const result = await apiClient.login(username, password);
    
    if (result.success && result.user) {
      setCurrentUser(result.user);
      // Load danh sách users
      await reloadUsers();
      return { success: true };
    }
    
    return { success: false, message: result.message || 'Đăng nhập thất bại' };
  };

  const logout = async () => {
    await apiClient.logout();
    setCurrentUser(null);
    setAllUsers([]);
  };

  const refreshCurrentUser = async () => {
    const user = await apiClient.fetchCurrentUser();
    if (user) setCurrentUser(user);
  };

  // Role checks — dựa trên roles[] (mới) hoặc role (cũ)
  const getRoleCode = (): string | null => {
    if (!currentUser) return null;
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles[0].code;
    }
    return currentUser.role || null;
  };

  const isAdmin = getRoleCode() === 'ADMIN';
  const isVienTruong = getRoleCode() === 'VIEN_TRUONG';
  const isPhoVienTruong = getRoleCode() === 'PHO_VIEN_TRUONG';
  const isTruongPhong = getRoleCode() === 'TRUONG_PHONG';

  const hasPermission = (perm: string): boolean => {
    return currentUser?.permissions?.includes(perm) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        login,
        logout,
        reloadUsers,
        refreshCurrentUser,
        isAdmin,
        isVienTruong,
        isPhoVienTruong,
        isTruongPhong,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};