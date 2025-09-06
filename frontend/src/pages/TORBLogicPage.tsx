import React from 'react';
import { Layout } from 'antd';
import AntHeader from '../components/AntHeader';
import LogicManagement from '../components/LogicManagement';

const { Content } = Layout;

const TORBLogicPage: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      <Content style={{ padding: '24px' }}>
        <LogicManagement />
      </Content>
    </Layout>
  );
};

export default TORBLogicPage;