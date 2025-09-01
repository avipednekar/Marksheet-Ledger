// AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- NEW: Use environment variable for the API URL ---
const API_URL = 'http://localhost:5000/api';

interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface AuthContextType {
  teacher: Teacher | null;
  token: string | null; // This is the in-memory accessToken
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshAndVerify = async () => {
      try {
        // --- REFACTORED to use fetch ---
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Crucial: sends cookies with the request
        });

        if (!refreshResponse.ok) throw new Error('Refresh failed');
        
        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.accessToken;
        setToken(newAccessToken);

        // --- REFACTORED to use fetch ---
        const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${newAccessToken}` }
        });

        if (!verifyResponse.ok) throw new Error('Verification failed');

        const verifyData = await verifyResponse.json();
        setTeacher(verifyData.teacher);

      } catch (error) {
        setTeacher(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    refreshAndVerify();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // --- REFACTORED to use fetch ---
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Login failed.' };
      }
      
      setTeacher(data.teacher);
      setToken(data.accessToken);
      return { success: true, message: data.message };

    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    const currentToken = token; 
    try {
      // --- REFACTORED to use fetch ---
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setTeacher(null);
      setToken(null);
    }
  };

  const value: AuthContextType = { teacher, token, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};