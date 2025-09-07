import React from 'react';
import { 
  Layout, 
  Typography, 
  Timeline, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Progress, 
  Statistic,
  Alert,
  Divider,
  Badge
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  TrophyOutlined,
  BarChartOutlined,
  BulbOutlined,
  SettingOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import AntHeader from '../components/AntHeader';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const ReleaseNotesPage: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      
      <Content style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <Title level={1}>
              <RocketOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
              戦略進化ログ
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#666' }}>
              東京ボックス戦略の継続的改善と実績記録
            </Paragraph>
          </div>

          {/* Current Phase Progress */}
          <Card style={{ marginBottom: '40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Row gutter={[32, 24]} align="middle">
              <Col xs={24} lg={8}>
                <Statistic 
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>現在のフェーズ</span>}
                  value="Phase 1"
                  valueStyle={{ color: 'white', fontSize: '2.5rem' }}
                  suffix={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>基盤構築</Text>}
                />
              </Col>
              <Col xs={24} lg={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress 
                    type="circle" 
                    percent={70} 
                    strokeColor="#52c41a"
                    trailColor="rgba(255,255,255,0.3)"
                    format={() => <span style={{ color: 'white', fontSize: '18px' }}>70%</span>}
                  />
                  <div style={{ marginTop: '8px', color: 'rgba(255,255,255,0.9)' }}>実装進捗</div>
                </div>
              </Col>
              <Col xs={24} lg={8}>
                <Statistic 
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>目標勝率</span>}
                  value="70-75"
                  valueStyle={{ color: 'white', fontSize: '2rem' }}
                  suffix={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>%</Text>}
                />
              </Col>
            </Row>
          </Card>

          {/* Phase Overview Cards */}
          <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
            <Col xs={24} md={8}>
              <Card style={{ height: '100%', border: '2px solid #52c41a' }}>
                <Badge.Ribbon text="実装中" color="green">
                  <div style={{ textAlign: 'center' }}>
                    <SettingOutlined style={{ fontSize: '40px', color: '#52c41a', marginBottom: '16px' }} />
                    <Title level={4}>Phase 1: 基盤戦略</Title>
                    <Paragraph>
                      基本戦略実装 + データ収集基盤構築
                    </Paragraph>
                    <Tag color="green">2025年9-12月</Tag>
                  </div>
                </Badge.Ribbon>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ height: '100%', border: '2px solid #faad14' }}>
                <Badge.Ribbon text="計画中" color="orange">
                  <div style={{ textAlign: 'center' }}>
                    <BarChartOutlined style={{ fontSize: '40px', color: '#faad14', marginBottom: '16px' }} />
                    <Title level={4}>Phase 2: 環境適応</Title>
                    <Paragraph>
                      マーケット環境判定による戦略最適化
                    </Paragraph>
                    <Tag color="orange">2026年1-6月</Tag>
                  </div>
                </Badge.Ribbon>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ height: '100%', border: '2px solid #1890ff' }}>
                <Badge.Ribbon text="研究段階" color="blue">
                  <div style={{ textAlign: 'center' }}>
                    <BulbOutlined style={{ fontSize: '40px', color: '#1890ff', marginBottom: '16px' }} />
                    <Title level={4}>Phase 3: AI統合</Title>
                    <Paragraph>
                      機関投資家級の情報処理能力
                    </Paragraph>
                    <Tag color="blue">2026年7月-2027年3月</Tag>
                  </div>
                </Badge.Ribbon>
              </Card>
            </Col>
          </Row>

          {/* Release Timeline */}
          <Card title={
            <span>
              <ClockCircleOutlined style={{ marginRight: '8px' }} />
              リリース履歴
            </span>
          }>
            <Timeline>
              <Timeline.Item 
                dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                color="green"
              >
                <div>
                  <Title level={4}>v1.2.0 - 基本戦略実装完了</Title>
                  <Text type="secondary">2025年9月7日</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Alert
                      message="主要機能"
                      description={
                        <ul style={{ marginBottom: 0 }}>
                          <li>東京ボックス自動検出（9:00-11:00）</li>
                          <li>エントリー時間制限（欧州・NY時間）</li>
                          <li>リテスト型エントリーロジック</li>
                          <li>ATRベースフィルター</li>
                          <li>経済指標回避機能</li>
                        </ul>
                      }
                      type="success"
                      showIcon
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                </div>
              </Timeline.Item>

              <Timeline.Item 
                dot={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                color="blue"
              >
                <div>
                  <Title level={4}>v1.3.0 - データ収集基盤</Title>
                  <Text type="secondary">予定: 2025年9月15日</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Alert
                      message="予定機能"
                      description={
                        <ul style={{ marginBottom: 0 }}>
                          <li>パフォーマンス自動記録システム</li>
                          <li>環境別勝率追跡</li>
                          <li>ボラティリティレジーム分類</li>
                          <li>バックテスト環境整備</li>
                        </ul>
                      }
                      type="info"
                      showIcon
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                </div>
              </Timeline.Item>

              <Timeline.Item 
                dot={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                color="orange"
              >
                <div>
                  <Title level={4}>v2.0.0 - 環境適応型戦略</Title>
                  <Text type="secondary">予定: 2026年1月</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Alert
                      message="計画機能"
                      description={
                        <ul style={{ marginBottom: 0 }}>
                          <li>トレンド・レンジ自動判別</li>
                          <li>環境別パラメータ最適化</li>
                          <li>アダプティブリスクサイジング</li>
                          <li>マルチアセット相関分析</li>
                        </ul>
                      }
                      type="warning"
                      showIcon
                      style={{ marginTop: '8px' }}
                    />
                    <div style={{ marginTop: '12px' }}>
                      <Tag color="orange">目標勝率: 76-80%</Tag>
                    </div>
                  </div>
                </div>
              </Timeline.Item>

              <Timeline.Item 
                dot={<RocketOutlined style={{ color: '#722ed1' }} />}
                color="purple"
              >
                <div>
                  <Title level={4}>v3.0.0 - AI駆動統合システム</Title>
                  <Text type="secondary">予定: 2026年7月</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Alert
                      message="革新機能"
                      description={
                        <ul style={{ marginBottom: 0 }}>
                          <li>ニュース影響度AI分析</li>
                          <li>オーダーフロー推定システム</li>
                          <li>機械学習による戦略最適化</li>
                          <li>99%自動化達成</li>
                        </ul>
                      }
                      type="info"
                      showIcon
                      style={{ marginTop: '8px' }}
                    />
                    <div style={{ marginTop: '12px' }}>
                      <Tag color="purple">目標勝率: 83-87%</Tag>
                      <Tag color="purple">年利目標: 30%+</Tag>
                    </div>
                  </div>
                </div>
              </Timeline.Item>
            </Timeline>
          </Card>

          {/* Performance Tracking */}
          <Card 
            title={
              <span>
                <LineChartOutlined style={{ marginRight: '8px' }} />
                パフォーマンス推移
              </span>
            }
            style={{ marginTop: '40px' }}
          >
            <Alert
              message="データ収集開始準備中"
              description="2025年9月8日より本格的なパフォーマンス追跡を開始予定。リアルタイムでの勝率・収益率・ドローダウンの記録を行います。"
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            
            <Row gutter={[24, 24]}>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="Phase 1 目標勝率" 
                  value="70-75" 
                  suffix="%" 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="目標利益率" 
                  value="1.6-2.0" 
                  suffix="R" 
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="最大ドローダウン" 
                  value="15-20" 
                  suffix="%" 
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="月次目標" 
                  value="8-12" 
                  suffix="%" 
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>

          <Divider />

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Paragraph style={{ color: '#666' }}>
              すべての進捗と実績は透明性を保ち、リアルタイムで更新されます。<br />
              戦略の改善と成長を一緒に見守っていきましょう。
            </Paragraph>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ReleaseNotesPage;