import React from 'react';
import { Layout, Typography, Menu, Space, Tag, Button } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  DollarOutlined,
  ControlOutlined,
  RocketOutlined,
  DashboardOutlined,
  LoginOutlined
} from '@ant-design/icons';
import TradingModeToggle from './TradingModeToggle';
import UserProfile from './UserProfile';
import { useAuth } from '../contexts/AuthContext';

const { Header } = Layout;
const { Title, Text } = Typography;

interface AntHeaderProps {
  currentPrice?: number;
  currencyPair?: string;
  sessionInfo?: {
    name: string;
    color: string;
  };
}

const AntHeader: React.FC<AntHeaderProps> = ({ 
  currentPrice, 
  currencyPair = 'USD/JPY',
  sessionInfo
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">ホーム</Link>
    },
    {
      key: '/trading',
      icon: <BarChartOutlined />,
      label: <Link to="/trading">取引画面</Link>
    },
    {
      key: '/fund-management',
      icon: <DollarOutlined />,
      label: <Link to="/fund-management">資金管理</Link>
    },
    {
      key: '/results',
      icon: <FileTextOutlined />,
      label: <Link to="/results">取引結果</Link>
    },
    {
      key: '/performance',
      icon: <DashboardOutlined />,
      label: <Link to="/performance">パフォーマンス</Link>
    },
    {
      key: '/release-notes',
      icon: <RocketOutlined />,
      label: <Link to="/release-notes">戦略進化ログ</Link>
    },
  ];

  return (
    <Header style={{ 
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '36px',
      lineHeight: '36px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Title level={5} style={{ color: 'white', margin: 0, fontSize: '13px' }}>
          FX Pattern Analyzer
        </Title>
        
        <Menu 
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
            flex: 1,
            fontSize: '12px',
            lineHeight: '36px',
            height: '36px'
          }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <TradingModeToggle />
        <Space size="small">
          {sessionInfo && (
            <Tag color={sessionInfo.color} style={{ 
              fontSize: '10px', 
              padding: '2px 6px', 
              height: '20px',
              lineHeight: '16px',
              display: 'flex',
              alignItems: 'center',
              margin: 0
            }}>
              {sessionInfo.name}セッション
            </Tag>
          )}
          {currentPrice && (
            <Text style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>
              {currencyPair}: {currentPrice.toFixed(3)}
            </Text>
          )}
        </Space>
        
        {/* 認証状態に応じてユーザープロフィールまたはログインボタンを表示 */}
        {isAuthenticated ? (
          <UserProfile />
        ) : (
          <Button 
            type="primary" 
            icon={<LoginOutlined />}
            size="small"
            onClick={() => navigate('/login')}
            style={{
              height: '28px',
              fontSize: '12px',
              borderRadius: '4px'
            }}
          >
            ログイン
          </Button>
        )}
      </div>
    </Header>
  );
};

export default AntHeader;