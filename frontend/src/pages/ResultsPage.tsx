import React from 'react';
import { Layout } from 'antd';
import AntHeader from '../components/AntHeader';
import TradingResults from '../components/TradingResults';

const { Content } = Layout;

const ResultsPage: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      <Content style={{ padding: '24px' }}>
        <TradingResults />
      </Content>
    </Layout>
  );
};

export default ResultsPage;