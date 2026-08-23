import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData?: User) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('society_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('society_token');
  });
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
    const initAuth = async () => {
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

    initAuth();
  }, []);

  const login = async (newToken: string, userData?: User) => {
    setToken(newToken);
    localStorage.setItem('society_token', newToken);

    if (userData) {
      setUser(userData);
      localStorage.setItem('society_user', JSON.stringify(userData));
    } else {
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
        localStorage.setItem('society_user', JSON.stringify(currentUser));
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('society_token');
    localStorage.removeItem('society_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
