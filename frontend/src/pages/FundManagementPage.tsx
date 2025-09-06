import React from 'react';
import { Layout } from 'antd';
import AntHeader from '../components/AntHeader';
import FundManagement from '../components/FundManagement';

const { Content } = Layout;

const FundManagementPage: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      <Content style={{ padding: '24px' }}>
        <FundManagement />
      </Content>
    </Layout>
  );
};

export default FundManagementPage;