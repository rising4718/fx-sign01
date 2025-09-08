import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';

// ユーザー情報の型定義
export interface User {
  id: number;
  email: string;
  displayName?: string;
  planType: 'free' | 'premium' | 'pro';
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// 認証API関数
const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname === 'fxbuybuy.site') 
  ? 'https://fxbuybuy.site/api' 
  : 'http://localhost:3002/api';

// 開発環境チェック
const isDevelopment = process.env.NODE_ENV === 'development';

// トークン管理
const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

const setAccessToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

const setRefreshToken = (token: string): void => {
  localStorage.setItem('refreshToken', token);
};

const clearTokens = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// API呼び出しヘルパー
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// 認証コンテキスト作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider コンポーネント
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 認証状態の初期化
  useEffect(() => {
    const initializeAuth = async () => {
      // 開発環境の場合、自動的にモックユーザーでログイン
      if (isDevelopment) {
        try {
          console.log('🔧 Development mode: Attempting auth bypass...');
          const response = await fetch(`${API_BASE_URL}/dev/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bypass: true }),
          });

          if (response.ok) {
            const data = await response.json();
            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            setUser(data.user);
            console.log('🔧 Development auth bypass successful:', data.message);
            setIsLoading(false);
            return;
          } else {
            console.warn('🔧 Development auth bypass failed, falling back to normal auth');
          }
        } catch (error) {
          console.warn('🔧 Development auth bypass error, falling back to normal auth:', error);
        }
      }

      // 通常の認証フロー（本番環境または開発環境でバイパスが失敗した場合）
      const token = getAccessToken();
      if (token) {
        try {
          // トークンが有効かチェック & ユーザー情報取得
          const endpoint = isDevelopment && token.startsWith('dev_access_token_') 
            ? '/dev/auth/profile' 
            : '/auth/profile';
          
          const response = await apiCall(endpoint);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else if (response.status === 401) {
            // アクセストークンが無効な場合、リフレッシュを試行
            const refreshed = await refreshTokens();
            if (!refreshed) {
              clearTokens();
            }
          }
        } catch (error) {
          console.error('認証初期化エラー:', error);
          clearTokens();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // トークンリフレッシュ
  const refreshTokens = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      // 開発環境で開発用トークンの場合は開発用エンドポイントを使用
      const endpoint = isDevelopment && refreshToken.startsWith('dev_refresh_token_') 
        ? '/dev/auth/refresh' 
        : '/auth/refresh';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        
        // ユーザー情報も更新
        const profileEndpoint = isDevelopment && data.accessToken.startsWith('dev_access_token_')
          ? '/dev/auth/profile'
          : '/auth/profile';
          
        const profileResponse = await apiCall(profileEndpoint);
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          setUser(userData.user);
        }
        
        return true;
      }
    } catch (error) {
      console.error('トークンリフレッシュエラー:', error);
    }

    return false;
  };

  // ログイン
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
        
        message.success('ログインしました');
        return true;
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'ログインに失敗しました');
        return false;
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      message.error('ネットワークエラーが発生しました');
      return false;
    }
  };

  // 新規登録
  const register = async (email: string, password: string, displayName?: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
        
        message.success('アカウントを作成しました');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Registration error response:', errorData);
        
        if (errorData.details && errorData.details.length > 0) {
          const detailedErrors = errorData.details.map((err: any) => err.msg).join('\n');
          message.error(detailedErrors);
        } else {
          message.error(errorData.error || '登録に失敗しました');
        }
        return false;
      }
    } catch (error) {
      console.error('登録エラー:', error);
      message.error('ネットワークエラーが発生しました');
      return false;
    }
  };

  // ログアウト
  const logout = () => {
    setUser(null);
    clearTokens();
    message.success('ログアウトしました');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken: refreshTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth カスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;