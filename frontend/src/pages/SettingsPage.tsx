import React, { useState } from 'react';
import { Layout, Tabs, Typography } from 'antd';
import { 
  SettingOutlined, 
  ControlOutlined, 
  BellOutlined, 
  ToolOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import AntHeader from '../components/AntHeader';
import AccountSettingsTab from '../components/settings/AccountSettingsTab';
import TORBSettingsTab from '../components/settings/TORBSettingsTab';

const { Content } = Layout;
const { Title } = Typography;

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // URLクエリパラメータからアクティブなタブを取得
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'account';
  
  const handleTabChange = (key: string) => {
    navigate(`/settings?tab=${key}`, { replace: true });
  };

  const tabItems = [
    {
      key: 'account',
      label: (
        <span>
          <SettingOutlined />
          アカウント設定
        </span>
      ),
      children: <AccountSettingsTab />,
    },
    {
      key: 'torb',
      label: (
        <span>
          <ControlOutlined />
          TORB戦略設定
        </span>
      ),
      children: <TORBSettingsTab />,
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          通知設定
        </span>
      ),
      children: (
        <div style={{ padding: '24px', textAlign: 'center', minHeight: '300px' }}>
          <BellOutlined style={{ fontSize: '48px', color: '#8c8c8c', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#8c8c8c' }}>通知設定</Title>
          <p style={{ color: '#8c8c8c' }}>
            Discord・LINE連携、音声通知などの設定は今後のアップデートで対応予定です。
          </p>
        </div>
      ),
    },
    {
      key: 'system',
      label: (
        <span>
          <ToolOutlined />
          システム設定
        </span>
      ),
      children: (
        <div style={{ padding: '24px', textAlign: 'center', minHeight: '300px' }}>
          <ToolOutlined style={{ fontSize: '48px', color: '#8c8c8c', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#8c8c8c' }}>システム設定</Title>
          <p style={{ color: '#8c8c8c' }}>
            データベース設定、バックアップ設定などのシステム設定は今後のアップデートで対応予定です。
          </p>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#ffffff', marginBottom: '24px' }}>
            ⚙️ 設定
          </Title>
          
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            size="large"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '16px',
            }}
            items={tabItems}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default SettingsPage;