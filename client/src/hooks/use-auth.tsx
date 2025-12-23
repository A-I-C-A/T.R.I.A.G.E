import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import { wsService } from '@/services/websocket';

interface User {
  id: string;
  email: string;
  role: string;
  hospitalId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      authAPI
        .getCurrentUser()
        .then((res) => {
          setUser(res.data.user);
          wsService.connect(token);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { token, user } = response.data;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', user.role);
    setUser(user);
    wsService.connect(token);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setUser(null);
    wsService.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
