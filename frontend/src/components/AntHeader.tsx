import React, { useState } from 'react';
import { Layout, Typography, Menu, Space, Tag, Button } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  DollarOutlined,
  ControlOutlined,
  RocketOutlined,
  DashboardOutlined,
  LoginOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import TradingModeToggle from './TradingModeToggle';
import UserProfile from './UserProfile';
import SessionHelpModal from './SessionHelpModal';
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
  torbStatus?: {
    phase: 'range' | 'breakout' | 'trading' | 'off';
    hasActiveSignal: boolean;
    currentRange?: { high: number; low: number; width: number };
  };
}

const AntHeader: React.FC<AntHeaderProps> = ({ 
  currentPrice, 
  currencyPair = 'USD/JPY',
  sessionInfo,
  torbStatus
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [sessionHelpVisible, setSessionHelpVisible] = useState(false);

  // TORB状態の表示用関数
  const getTorbStatusDisplay = () => {
    if (!torbStatus) return null;
    
    const statusConfig = {
      range: { text: 'レンジ監視中', color: '#faad14', icon: '👀' },
      breakout: { text: 'シグナル監視中', color: '#1890ff', icon: '🎯' },
      trading: { text: '取引中', color: '#52c41a', icon: '💹' },
      off: { text: 'オフ', color: '#8c8c8c', icon: '⏸️' }
    };
    
    const config = statusConfig[torbStatus.phase];
    
    return (
      <Tag color={config.color} style={{ 
        fontSize: '10px', 
        padding: '2px 8px', 
        height: '20px',
        lineHeight: '16px',
        display: 'flex',
        alignItems: 'center',
        margin: 0
      }}>
        {config.icon} {config.text}
      </Tag>
    );
  };
  
  const menuItems = [
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
        <Link 
          to={isAuthenticated ? "/trading" : "/"} 
          style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div style={{ 
            fontSize: '18px', 
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            📈
          </div>
          <Title level={5} style={{ color: 'white', margin: 0, fontSize: '13px' }}>
            FX Pattern Analyzer
          </Title>
        </Link>
        
        <Menu 
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          overflowedIndicator={null}
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
          {getTorbStatusDisplay()}
          {sessionInfo && (
            <Tag 
              color={sessionInfo.color} 
              onClick={() => setSessionHelpVisible(true)}
              style={{ 
                fontSize: '10px', 
                padding: '2px 6px', 
                height: '20px',
                lineHeight: '16px',
                display: 'flex',
                alignItems: 'center',
                margin: 0,
                cursor: 'pointer'
              }}
              title="クリックしてセッション詳細を表示"
            >
{sessionInfo.name}セッション <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '14px',
                height: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                marginLeft: '4px'
              }}>?</span>
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
      
      <SessionHelpModal
        visible={sessionHelpVisible}
        onCancel={() => setSessionHelpVisible(false)}
      />
    </Header>
  );
};

export default AntHeader;