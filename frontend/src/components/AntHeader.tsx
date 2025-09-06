import React from 'react';
import { Layout, Typography, Statistic, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Header } = Layout;
const { Title, Text } = Typography;

interface AntHeaderProps {
  currentPrice?: number;
  currencyPair?: string;
}

const AntHeader: React.FC<AntHeaderProps> = ({ 
  currentPrice, 
  currencyPair = 'USD/JPY' 
}) => {
  const location = useLocation();
  
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
      key: '/torb-logic',
      icon: <SettingOutlined />,
      label: <Link to="/torb-logic">TORB設定</Link>
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
    }
  ];

  return (
    <Header style={{ 
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Title level={3} style={{ color: 'white', margin: 0, fontSize: '1rem' }}>
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
            fontSize: '0.9rem'
          }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      </div>
    </Header>
  );
};

export default AntHeader;