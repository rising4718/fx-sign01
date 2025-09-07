import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Layout } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const { Content } = Layout;

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPlan?: 'free' | 'premium' | 'pro';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPlan = 'free' 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // ローディング中
  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Spin size="large" />
          <div>認証状態を確認中...</div>
        </Content>
      </Layout>
    );
  }

  // 認証されていない場合はログインページへリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // プラン制限チェック
  if (user && requiredPlan) {
    const planHierarchy: Record<string, number> = { 'free': 0, 'premium': 1, 'pro': 2 };
    const userLevel = planHierarchy[user.planType] ?? 0;
    const requiredLevel = planHierarchy[requiredPlan];

    if (userLevel < requiredLevel) {
      // プランが不足している場合は専用ページへ
      return <Navigate to="/upgrade" state={{ requiredPlan }} replace />;
    }
  }

  // 認証OK、プランOKの場合は子要素を表示
  return <>{children}</>;
};

export default ProtectedRoute;