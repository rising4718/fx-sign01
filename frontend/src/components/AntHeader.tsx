import React, { useState, useEffect } from 'react';
import { Layout, Typography, Menu, Space, Tag, Button, Drawer } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChartOutlined,
  FileTextOutlined,
  DollarOutlined,
  ControlOutlined,
  RocketOutlined,
  DashboardOutlined,
  LoginOutlined,
  MenuOutlined,
  CloseOutlined
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
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // レスポンシブ監視
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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
    <>
      <Header style={{ 
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px',
        height: isMobile ? '48px' : '36px',
        lineHeight: isMobile ? '48px' : '36px',
        position: 'relative',
        zIndex: 1000
      }}>
        {/* ロゴとタイトル */}
        <Link 
          to={isAuthenticated ? "/trading" : "/"} 
          style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '8px',
            flexShrink: 0
          }}
        >
          <div style={{ 
            fontSize: isMobile ? '20px' : '18px', 
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            📈
          </div>
          {!isMobile && (
            <Title level={5} style={{ color: 'white', margin: 0, fontSize: isTablet ? '12px' : '13px' }}>
              FX Pattern Analyzer
            </Title>
          )}
          {isMobile && (
            <Title level={5} style={{ color: 'white', margin: 0, fontSize: '12px' }}>
              FX
            </Title>
          )}
        </Link>
        
        {/* デスクトップ・タブレット用メニュー */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isTablet ? '12px' : '24px', flex: 1, justifyContent: 'center' }}>
            <Menu 
              theme="dark"
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={isTablet ? menuItems.slice(0, 3) : menuItems}
              overflowedIndicator={null}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: isTablet ? '11px' : '12px',
                lineHeight: isMobile ? '48px' : '36px',
                height: isMobile ? '48px' : '36px'
              }}
            />
          </div>
        )}
        
        {/* 右側情報・コントロール */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '8px' : '16px',
          flexShrink: 0
        }}>
          {!isMobile && <TradingModeToggle />}
          
          {/* ステータス情報 - モバイルでは一部省略 */}
          <Space size={isMobile ? 4 : "small"}>
            {!isMobile && getTorbStatusDisplay()}
            {sessionInfo && !isMobile && (
              <Tag 
                color={sessionInfo.color} 
                onClick={() => setSessionHelpVisible(true)}
                style={{ 
                  fontSize: isTablet ? '9px' : '10px', 
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
                {isTablet ? sessionInfo.name[0] : sessionInfo.name}セッション
                <span style={{
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
              <Text style={{ 
                color: '#ffffff', 
                fontSize: isMobile ? '10px' : '11px', 
                fontWeight: 'bold'
              }}>
                {isMobile ? currentPrice.toFixed(3) : `${currencyPair}: ${currentPrice.toFixed(3)}`}
              </Text>
            )}
          </Space>
          
          {/* 認証・メニューボタン */}
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAuthenticated ? (
                <UserProfile />
              ) : (
                <Button 
                  type="primary" 
                  icon={<LoginOutlined />}
                  size="small"
                  onClick={() => navigate('/login')}
                  style={{
                    height: '32px',
                    fontSize: '11px',
                    padding: '0 8px'
                  }}
                >
                  ログイン
                </Button>
              )}
              <Button 
                type="text" 
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuVisible(true)}
                style={{
                  color: 'white',
                  height: '32px',
                  width: '32px',
                  padding: 0
                }}
              />
            </div>
          ) : (
            isAuthenticated ? (
              <UserProfile />
            ) : (
              <Button 
                type="primary" 
                icon={<LoginOutlined />}
                size="small"
                onClick={() => navigate('/login')}
                style={{
                  height: '28px',
                  fontSize: isTablet ? '11px' : '12px',
                  borderRadius: '4px'
                }}
              >
                ログイン
              </Button>
            )
          )}
        </div>
      </Header>
      
      {/* モバイル用ドロワーメニュー */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📈</span>
            <span>FX Pattern Analyzer</span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={280}
        closeIcon={<CloseOutlined style={{ color: '#1890ff' }} />}
        headerStyle={{ borderBottom: '1px solid #f0f0f0' }}
        bodyStyle={{ padding: '16px 0' }}
      >
        <div style={{ marginBottom: '16px' }}>
          <TradingModeToggle />
        </div>
        
        {/* ステータス情報 */}
        <div style={{ marginBottom: '16px', paddingLeft: '16px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {getTorbStatusDisplay()}
            {sessionInfo && (
              <Tag 
                color={sessionInfo.color} 
                onClick={() => {
                  setSessionHelpVisible(true);
                  setMobileMenuVisible(false);
                }}
                style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px', 
                  height: 'auto',
                  cursor: 'pointer',
                  width: 'fit-content'
                }}
              >
                {sessionInfo.name}セッション ❓
              </Tag>
            )}
            {currentPrice && (
              <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>
                {currencyPair}: {currentPrice.toFixed(3)}
              </Text>
            )}
          </Space>
        </div>
        
        {/* メニューアイテム */}
        <Menu 
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{
            border: 'none',
            fontSize: '14px'
          }}
          onClick={() => setMobileMenuVisible(false)}
        />
      </Drawer>
      
      <SessionHelpModal
        visible={sessionHelpVisible}
        onCancel={() => setSessionHelpVisible(false)}
      />
    </>
  );
};

export default AntHeader;