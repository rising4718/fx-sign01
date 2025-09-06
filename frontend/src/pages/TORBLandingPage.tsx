import React from 'react';
import { 
  Layout, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Card, 
  Statistic, 
  Timeline, 
  Space,
  Divider,
  Tag,
  Alert
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import AntHeader from '../components/AntHeader';

const { Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const TORBLandingPage: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      
      {/* Hero Section */}
      <Content style={{ padding: 0 }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '80px 0',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={1} style={{ color: 'white', fontSize: '3rem', marginBottom: '24px' }}>
              東京時間レンジブレイクアウト戦略
            </Title>
            <Paragraph style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', marginBottom: '40px' }}>
              プロトレーダーが愛用する東京時間特化型の高勝率FX戦略<br/>
              9:00-11:00の限定時間で効率的に利益を狙う
            </Paragraph>
            <Space size="large">
              <Button type="primary" size="large" style={{ height: '50px', fontSize: '16px', padding: '0 30px' }}>
                今すぐ始める
              </Button>
              <Button size="large" style={{ height: '50px', fontSize: '16px', padding: '0 30px', color: 'white', borderColor: 'white' }}>
                戦略を学ぶ
              </Button>
            </Space>
          </div>
        </div>

        {/* Statistics Section */}
        <div style={{ padding: '60px 0', background: '#f8f9fa' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Row gutter={[32, 32]} justify="center">
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Statistic 
                    title="平均勝率" 
                    value={72} 
                    suffix="%" 
                    valueStyle={{ color: '#52c41a', fontSize: '2.5rem' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Statistic 
                    title="取引時間" 
                    value={2} 
                    suffix="時間/日" 
                    valueStyle={{ color: '#1890ff', fontSize: '2.5rem' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Statistic 
                    title="リスクリワード" 
                    value={1.5} 
                    suffix=":1" 
                    valueStyle={{ color: '#722ed1', fontSize: '2.5rem' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Statistic 
                    title="月間収益率" 
                    value={12} 
                    suffix="%" 
                    valueStyle={{ color: '#f5222d', fontSize: '2.5rem' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Strategy Explanation */}
        <div style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '60px' }}>
              TORBとは何か？
            </Title>
            
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} lg={12}>
                <Title level={3} style={{ color: '#1890ff' }}>
                  <ClockCircleOutlined /> 東京時間の特性を活用
                </Title>
                <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
                  東京市場が開く9:00から9:45までの45分間で形成されるレンジを分析し、
                  そのブレイクアウトを狙う戦略です。アジア時間の流動性の特性を最大限に活用します。
                </Paragraph>
                
                <Title level={4} style={{ marginTop: '24px' }}>主な特徴：</Title>
                <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
                  <li>明確なエントリーポイント</li>
                  <li>リスク管理がしやすい</li>
                  <li>短時間で結果が出る</li>
                  <li>日本時間で取引しやすい</li>
                </ul>
              </Col>
              
              <Col xs={24} lg={12}>
                <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Timeline
                    items={[
                      {
                        dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
                        children: (
                          <div>
                            <Text strong>9:00-9:45</Text>
                            <br />レンジ形成期間<br />
                            高値・安値を記録
                          </div>
                        ),
                      },
                      {
                        dot: <RiseOutlined style={{ fontSize: '16px', color: '#52c41a' }} />,
                        children: (
                          <div>
                            <Text strong>9:45-11:00</Text>
                            <br />ブレイクアウト監視<br />
                            エントリーチャンスを狙う
                          </div>
                        ),
                      },
                      {
                        dot: <TrophyOutlined style={{ fontSize: '16px', color: '#faad14' }} />,
                        children: (
                          <div>
                            <Text strong>利確・損切り</Text>
                            <br />目標利益達成または<br />
                            ストップロス発動
                          </div>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ padding: '80px 0', background: '#f8f9fa' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '60px' }}>
              システムの特徴
            </Title>
            
            <Row gutter={[32, 32]}>
              <Col xs={24} md={12} lg={8}>
                <Card 
                  style={{ height: '100%', textAlign: 'center' }}
                  hoverable
                  cover={
                    <div style={{ padding: '40px 0', background: '#e6f7ff' }}>
                      <BarChartOutlined style={{ fontSize: '60px', color: '#1890ff' }} />
                    </div>
                  }
                >
                  <Title level={4}>リアルタイム分析</Title>
                  <Paragraph>
                    市場データをリアルタイムで分析し、
                    最適なエントリーポイントを自動で検出します。
                  </Paragraph>
                </Card>
              </Col>
              
              <Col xs={24} md={12} lg={8}>
                <Card 
                  style={{ height: '100%', textAlign: 'center' }}
                  hoverable
                  cover={
                    <div style={{ padding: '40px 0', background: '#f6ffed' }}>
                      <SafetyCertificateOutlined style={{ fontSize: '60px', color: '#52c41a' }} />
                    </div>
                  }
                >
                  <Title level={4}>リスク管理</Title>
                  <Paragraph>
                    自動ストップロスとテイクプロフィット機能で、
                    損失を限定し利益を最大化します。
                  </Paragraph>
                </Card>
              </Col>
              
              <Col xs={24} md={12} lg={8}>
                <Card 
                  style={{ height: '100%', textAlign: 'center' }}
                  hoverable
                  cover={
                    <div style={{ padding: '40px 0', background: '#fff7e6' }}>
                      <ThunderboltOutlined style={{ fontSize: '60px', color: '#faad14' }} />
                    </div>
                  }
                >
                  <Title level={4}>高速執行</Title>
                  <Paragraph>
                    ミリ秒単位での高速注文執行により、
                    最良の価格でのエントリーを実現します。
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Strategy Rules */}
        <div style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '60px' }}>
              戦略ルール
            </Title>
            
            <Row gutter={[48, 48]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span style={{ color: '#52c41a' }}>
                      <RiseOutlined /> ロング戦略
                    </span>
                  }
                  style={{ height: '100%' }}
                >
                  <Title level={4}>エントリー条件：</Title>
                  <ul>
                    <li>9:45以降、レンジ高値突破</li>
                    <li>5分足RSI &gt; 55かつ上昇中</li>
                    <li>前日NYクローズより上位</li>
                  </ul>
                  
                  <Divider />
                  
                  <Title level={4}>利確・損切り：</Title>
                  <ul>
                    <li><Tag color="green">利確</Tag>突破幅の1.5倍</li>
                    <li><Tag color="red">損切り</Tag>レンジ下限-5pips</li>
                  </ul>
                </Card>
              </Col>
              
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span style={{ color: '#f5222d' }}>
                      <FallOutlined /> ショート戦略
                    </span>
                  }
                  style={{ height: '100%' }}
                >
                  <Title level={4}>エントリー条件：</Title>
                  <ul>
                    <li>9:45以降、レンジ安値下抜け</li>
                    <li>5分足RSI &lt; 45かつ下降中</li>
                    <li>前日NYクローズより下位</li>
                  </ul>
                  
                  <Divider />
                  
                  <Title level={4}>利確・損切り：</Title>
                  <ul>
                    <li><Tag color="green">利確</Tag>突破幅の1.5倍</li>
                    <li><Tag color="red">損切り</Tag>レンジ上限+5pips</li>
                  </ul>
                </Card>
              </Col>
            </Row>
            
            <Alert
              message="フィルター条件"
              description="レンジ幅：15pips以上50pips以下 / 前日ボラティリティ：80pips以下 / 経済指標発表前後30分は取引停止"
              type="info"
              showIcon
              style={{ marginTop: '40px' }}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          padding: '80px 0',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ color: 'white', marginBottom: '24px' }}>
              今すぐTORB戦略を始めませんか？
            </Title>
            <Paragraph style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', marginBottom: '40px' }}>
              プロが実践する東京時間特化型戦略で、効率的な取引を実現しましょう。
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              style={{ 
                height: '60px', 
                fontSize: '18px', 
                padding: '0 40px',
                background: '#52c41a',
                borderColor: '#52c41a'
              }}
            >
              無料で戦略を試す
            </Button>
          </div>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.65)' }}>
        <GlobalOutlined /> FX Pattern Analyzer ©2024 Created by Professional Traders
      </Footer>
    </Layout>
  );
};

export default TORBLandingPage;