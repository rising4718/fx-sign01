import React from 'react';
import { Switch, Space, Typography, Tag } from 'antd';
import { useSettings } from '../contexts/SettingsContext';

const { Text } = Typography;

const TradingModeToggle: React.FC = () => {
  const { settings, toggleTradingMode, isDemo } = useSettings();

  return (
    <Space size="middle" align="center">
      <Tag 
        color={isDemo ? 'blue' : 'red'} 
        style={{ 
          fontSize: '12px', 
          padding: '2px 8px',
          fontWeight: 'bold',
          margin: 0
        }}
      >
        {isDemo ? '🎮 DEMO' : '💰 REAL'}
      </Tag>
      
      <Space size="small" align="center">
        <Text style={{ 
          color: '#ffffff', 
          fontSize: '12px',
          opacity: isDemo ? 1 : 0.6 
        }}>
          DEMO
        </Text>
        <Switch
          checked={!isDemo}
          onChange={toggleTradingMode}
          size="small"
          style={{
            backgroundColor: isDemo ? '#1890ff' : '#ff4d4f'
          }}
        />
        <Text style={{ 
          color: '#ffffff', 
          fontSize: '12px',
          opacity: !isDemo ? 1 : 0.6 
        }}>
          REAL
        </Text>
      </Space>
    </Space>
  );
};

export default TradingModeToggle;