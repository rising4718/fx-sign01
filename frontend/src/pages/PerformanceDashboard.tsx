import React, { useState, useEffect } from 'react';
import {
  Layout,
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Select,
  DatePicker,
  Alert,
  Spin,
  Tag,
  Typography,
  Space,
  Badge
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import AntHeader from '../components/AntHeader';

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DailyPerformance {
  date: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor?: number;
}

interface PerformanceStats {
  totalTrades: number;
  winRate: number;
  avgDailyReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  bestDay: number;
  worstDay: number;
  consecutiveWinStreak: number;
  consecutiveLossStreak: number;
}

interface PhaseSummary {
  phase: string;
  totalDaysActive: number;
  avgWinRate: number;
  avgDailyProfit: number;
  worstDrawdown: number;
  avgSharpeRatio: number;
  daysAboveTarget: number;
}

const PerformanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [phaseSummary, setPhaseSummary] = useState<PhaseSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch daily performance
      const dailyResponse = await fetch(`/api/v1/performance/daily?days=${selectedPeriod}`);
      const dailyResult = await dailyResponse.json();
      
      // Fetch summary stats
      const summaryResponse = await fetch(`/api/v1/performance/summary?days=${selectedPeriod}`);
      const summaryResult = await summaryResponse.json();
      
      if (dailyResult.success) {
        setDailyData(dailyResult.data);
      }
      
      if (summaryResult.success) {
        setStats(summaryResult.data.detailed);
        setPhaseSummary(summaryResult.data.phase);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 75) return '#52c41a';
    if (winRate >= 70) return '#faad14';
    return '#f5222d';
  };

  const getProfitColor = (profit: number) => {
    return profit > 0 ? '#52c41a' : '#f5222d';
  };

  const columns = [
    {
      title: '日付',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('ja-JP')
    },
    {
      title: '取引数',
      dataIndex: 'totalTrades',
      key: 'totalTrades',
      align: 'center' as const
    },
    {
      title: '勝率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (winRate: number) => (
        <Tag color={winRate >= 70 ? 'green' : winRate >= 50 ? 'orange' : 'red'}>
          {winRate.toFixed(1)}%
        </Tag>
      )
    },
    {
      title: '損益',
      dataIndex: 'netProfit',
      key: 'netProfit',
      render: (profit: number) => (
        <Text style={{ color: getProfitColor(profit), fontWeight: 'bold' }}>
          ¥{profit.toLocaleString()}
        </Text>
      )
    },
    {
      title: '利益率',
      dataIndex: 'profitFactor',
      key: 'profitFactor',
      render: (factor: number) => factor ? factor.toFixed(2) : '-'
    }
  ];

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <AntHeader />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '20px' }}>
            <Text>パフォーマンスデータを読み込み中...</Text>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2}>
                  <DashboardOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  パフォーマンス ダッシュボード
                </Title>
                <Text type="secondary">Phase 1: データ収集・分析基盤</Text>
              </Col>
              <Col>
                <Space>
                  <Select
                    value={selectedPeriod}
                    onChange={setSelectedPeriod}
                    style={{ width: 120 }}
                  >
                    <Select.Option value={7}>7日</Select.Option>
                    <Select.Option value={30}>30日</Select.Option>
                    <Select.Option value={90}>90日</Select.Option>
                  </Select>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Phase 1 Progress */}
          {phaseSummary && (
            <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Row gutter={[24, 16]} align="middle">
                <Col xs={24} lg={6}>
                  <div style={{ textAlign: 'center' }}>
                    <ClockCircleOutlined style={{ fontSize: '40px', marginBottom: '8px' }} />
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Phase 1</div>
                    <div style={{ opacity: 0.9 }}>基盤構築フェーズ</div>
                  </div>
                </Col>
                <Col xs={24} lg={6}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>稼働日数</span>}
                    value={phaseSummary.totalDaysActive}
                    suffix="日"
                    valueStyle={{ color: 'white' }}
                  />
                </Col>
                <Col xs={24} lg={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress
                      type="circle"
                      percent={Math.min(100, (phaseSummary.avgWinRate / 70) * 100)}
                      format={() => `${phaseSummary.avgWinRate.toFixed(1)}%`}
                      strokeColor="#52c41a"
                      trailColor="rgba(255,255,255,0.3)"
                      size={80}
                    />
                    <div style={{ marginTop: '8px', opacity: 0.9 }}>目標勝率 vs 実績</div>
                  </div>
                </Col>
                <Col xs={24} lg={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Badge
                      count={phaseSummary.daysAboveTarget}
                      style={{ backgroundColor: '#52c41a' }}
                      size="default"
                    >
                      <CheckCircleOutlined style={{ fontSize: '40px' }} />
                    </Badge>
                    <div style={{ marginTop: '8px', opacity: 0.9 }}>目標達成日数</div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Key Performance Indicators */}
          {stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={12} sm={8} lg={6}>
                <Card>
                  <Statistic
                    title="総取引数"
                    value={stats.totalTrades}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} lg={6}>
                <Card>
                  <Statistic
                    title="勝率"
                    value={stats.winRate}
                    suffix="%"
                    precision={1}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: getWinRateColor(stats.winRate) }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} lg={6}>
                <Card>
                  <Statistic
                    title="平均日次収益"
                    value={stats.avgDailyReturn}
                    prefix="¥"
                    precision={0}
                    valueStyle={{ color: getProfitColor(stats.avgDailyReturn) }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} lg={6}>
                <Card>
                  <Statistic
                    title="最大ドローダウン"
                    value={stats.maxDrawdown}
                    suffix="%"
                    precision={1}
                    prefix={<FallOutlined />}
                    valueStyle={{ color: stats.maxDrawdown > 15 ? '#f5222d' : '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} lg={6}>
                <Card>
                  <Statistic
                    title="利益率"
                    value={stats.profitFactor}
                    precision={2}
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: stats.profitFactor >= 1.5 ? '#52c41a' : '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} lg={6}>
                <Card>
                  <Statistic
                    title="シャープレシオ"
                    value={stats.sharpeRatio}
                    precision={2}
                    prefix={<LineChartOutlined />}
                    valueStyle={{ color: stats.sharpeRatio >= 1.0 ? '#52c41a' : '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} lg={6}>
                <Card>
                  <Statistic
                    title="最高収益日"
                    value={stats.bestDay}
                    prefix="¥"
                    precision={0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} lg={6}>
                <Card>
                  <Statistic
                    title="最大連勝"
                    value={stats.consecutiveWinStreak}
                    suffix="回"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Phase 1 Goals Progress */}
          <Card title="Phase 1 目標達成度" style={{ marginBottom: '24px' }}>
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <div>
                  <Text strong>勝率目標: 70-75%</Text>
                  <Progress 
                    percent={stats ? Math.min(100, (stats.winRate / 70) * 100) : 0}
                    strokeColor={stats && stats.winRate >= 70 ? '#52c41a' : '#faad14'}
                    format={() => `${stats?.winRate.toFixed(1) || 0}%`}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div>
                  <Text strong>利益率目標: 1.6-2.0</Text>
                  <Progress 
                    percent={stats ? Math.min(100, (stats.profitFactor / 1.6) * 100) : 0}
                    strokeColor={stats && stats.profitFactor >= 1.6 ? '#52c41a' : '#faad14'}
                    format={() => `${stats?.profitFactor.toFixed(2) || 0}`}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div>
                  <Text strong>ドローダウン上限: 20%</Text>
                  <Progress 
                    percent={stats ? Math.min(100, ((20 - stats.maxDrawdown) / 20) * 100) : 0}
                    strokeColor={stats && stats.maxDrawdown <= 15 ? '#52c41a' : '#faad14'}
                    format={() => `${stats?.maxDrawdown.toFixed(1) || 0}%`}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div>
                  <Text strong>データ収集期間</Text>
                  <Progress 
                    percent={phaseSummary ? Math.min(100, (phaseSummary.totalDaysActive / 90) * 100) : 0}
                    strokeColor="#1890ff"
                    format={() => `${phaseSummary?.totalDaysActive || 0}/90日`}
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {/* Phase Roadmap Status */}
          <Alert
            message="Phase 1: 基盤データ収集・分析"
            description={
              <div>
                <p>現在は戦略の基本性能を確立し、将来の拡張に必要なデータを蓄積する重要な段階です。</p>
                <Space>
                  <Tag color="green">✓ パフォーマンス追跡システム</Tag>
                  <Tag color="green">✓ 取引記録システム</Tag>
                  <Tag color="blue">→ 環境別成績分析</Tag>
                  <Tag color="orange">Phase 2: 環境適応型戦略</Tag>
                </Space>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          {/* Daily Performance Table */}
          <Card title="日次パフォーマンス履歴">
            <Table
              dataSource={dailyData}
              columns={columns}
              rowKey="date"
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `合計 ${total} 日`
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default PerformanceDashboard;