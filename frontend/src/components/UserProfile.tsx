import React from 'react';
import { Dropdown, Avatar, Button, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  CrownOutlined,
  StarOutlined,
  GiftOutlined,
  ControlOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // プランに応じたタグの色とアイコン
  const getPlanConfig = (planType: string) => {
    switch (planType) {
      case 'pro':
        return { color: 'gold', icon: <CrownOutlined />, text: 'PRO' };
      case 'premium':
        return { color: 'blue', icon: <StarOutlined />, text: 'PREMIUM' };
      default:
        return { color: 'green', icon: <GiftOutlined />, text: 'FREE' };
    }
  };

  const planConfig = getPlanConfig(user.planType);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '8px 0', minWidth: '200px' }}>
          <div style={{ marginBottom: '8px' }}>
            <Text strong>{user.displayName || user.email}</Text>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {user.email}
            </Text>
          </div>
          <Tag 
            icon={planConfig.icon} 
            color={planConfig.color} 
            style={{ fontSize: '10px' }}
          >
            {planConfig.text}
          </Tag>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '設定',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ログアウト',
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      arrow
      trigger={['click']}
    >
      <Button
        type="text"
        style={{ 
          height: '32px',
          padding: '4px 8px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Avatar 
          size={24} 
          icon={<UserOutlined />} 
          style={{ 
            backgroundColor: planConfig.color === 'gold' ? '#faad14' : 
                             planConfig.color === 'blue' ? '#1890ff' : '#52c41a'
          }}
        />
        <Space size={4}>
          <Text style={{ color: 'white', fontSize: '13px' }}>
            {user.displayName || 'ユーザー'}
          </Text>
          <Tag 
            icon={planConfig.icon} 
            color={planConfig.color} 
            style={{ 
              fontSize: '10px', 
              margin: 0, 
              lineHeight: '16px',
              height: '16px'
            }}
          >
            {planConfig.text}
          </Tag>
        </Space>
      </Button>
    </Dropdown>
  );
};

export default UserProfile;