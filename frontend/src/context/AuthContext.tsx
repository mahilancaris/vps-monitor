import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fleet_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!localStorage.getItem('fleet_access_token')) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await apiRequest<User>('/auth/me');
      setUser(u);
    } catch (e) {
      setUser(null);
      localStorage.removeItem('fleet_access_token');
      localStorage.removeItem('fleet_refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string, totpCode?: string) => {
    const res = await apiRequest<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        totp_code: totpCode || null
      })
    });

    localStorage.setItem('fleet_access_token', res.access_token);
    localStorage.setItem('fleet_refresh_token', res.refresh_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('fleet_access_token');
    localStorage.removeItem('fleet_refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
