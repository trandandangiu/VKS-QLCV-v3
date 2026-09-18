import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/auth';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (user: User) => void;
  reloadUsers: () => Promise<void>;
  isAdmin: boolean;
  isVienTruong: boolean;
  isPhoVienTruong: boolean;
  isTruongPhong: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => apiClient.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadUsers = async () => {
    const users = await apiClient.getAllUsers();
    setAllUsers(users);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await reloadUsers();
      // If no current user, default to Viện Trưởng for immediate ease of use or prompt login
      const savedUser = apiClient.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await apiClient.login(username, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      return { success: true };
    }
    return { success: false, message: result.message || 'Đăng nhập thất bại' };
  };

  const logout = () => {
    apiClient.setCurrentUser(null);
    setCurrentUser(null);
  };

  const switchUser = (user: User) => {
    apiClient.setCurrentUser(user);
    setCurrentUser(user);
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const isVienTruong = currentUser?.role === 'VIEN_TRUONG';
  const isPhoVienTruong = currentUser?.role === 'PHO_VIEN_TRUONG';
  const isTruongPhong = currentUser?.role === 'TRUONG_PHONG';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        login,
        logout,
        switchUser,
        reloadUsers,
        isAdmin,
        isVienTruong,
        isPhoVienTruong,
        isTruongPhong
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
