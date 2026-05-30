import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest } from './api';

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isDoctorOrNurse: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const token = localStorage.getItem('bhh_session_token');
      const savedUser = localStorage.getItem('bhh_user');
      
      if (token && savedUser) {
        setSessionToken(token);
        setUser(JSON.parse(savedUser));
        
        // Verify token with backend
        try {
          const result = await apiRequest('auth.me', 'GET');
          if (result.success && result.user) {
            setUser(result.user);
            localStorage.setItem('bhh_user', JSON.stringify(result.user));
          } else {
            clearSession();
          }
        } catch {
          // Keep offline session cache if network fails, or log out on clear error
          // For now, let's keep the cache so the app is resilient to spotty hospital Wi-Fi
        }
      }
      setIsLoading(false);
    }
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest('auth.login', 'POST', { email, password });
      if (result.success && result.session_token && result.user) {
        setSessionToken(result.session_token);
        setUser(result.user);
        localStorage.setItem('bhh_session_token', result.session_token);
        localStorage.setItem('bhh_user', JSON.stringify(result.user));
      } else {
        throw new Error("Invalid response from server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
  };

  const clearSession = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('bhh_session_token');
    localStorage.removeItem('bhh_user');
    window.location.hash = '/login';
  };

  const isAdmin = user?.role === 'admin';
  const isDoctorOrNurse = user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isAdmin,
        isDoctorOrNurse,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
