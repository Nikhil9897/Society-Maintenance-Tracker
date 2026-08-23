import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  // Accepts email+password directly — wraps the API internally
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, flat_number?: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('society_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('society_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      localStorage.setItem('society_user', JSON.stringify(currentUser));
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('society_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
          localStorage.setItem('society_user', JSON.stringify(currentUser));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token } = await authApi.login(email, password);
    setToken(access_token);
    localStorage.setItem('society_token', access_token);
    const currentUser = await authApi.getMe();
    setUser(currentUser);
    localStorage.setItem('society_user', JSON.stringify(currentUser));
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    flat_number?: string,
    role: string = 'resident'
  ) => {
    await authApi.register({ email, password, name, role, flat_number });
    // Auto-login after register
    await login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('society_token');
    localStorage.removeItem('society_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
